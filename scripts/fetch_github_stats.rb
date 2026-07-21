#!/usr/bin/env ruby
# frozen_string_literal: true

require "json"
require "net/http"
require "time"
require "uri"
require "yaml"

USERNAME = ENV.fetch("GITHUB_USERNAME", "adnanrahin")
TOKEN = ENV["GITHUB_TOKEN"]
OUTPUT = File.expand_path("../_data/github_stats.yml", __dir__)

EXCLUDED_LANGS = %w[HTML CSS TypeScript Jupyter\ Notebook].freeze
LANG_ALIASES = {
  "HCL" => "CloudFormation Stack",
  "CloudFormation" => "CloudFormation Stack"
}.freeze
FEATURED_LANGS = ["Java", "Scala", "Python", "C++", "Shell", "CloudFormation Stack"].freeze

# Cap how much any single repo can contribute to byte totals (after equal-repo blend).
# Prevents one giant notebook/dataset repo from wiping out Java/Scala history.
MAX_REPO_SHARE = 0.08

LANG_COLORS = {
  "Java" => "#b07219",
  "Scala" => "#c22d40",
  "Python" => "#3572A5",
  "C++" => "#f34b7d",
  "Shell" => "#89e051",
  "CloudFormation Stack" => "#ff9900",
  "default" => "#6c9eff"
}.freeze

LANGUAGE_QUERY = <<~GRAPHQL.freeze
  query($login: String!, $cursor: String) {
    user(login: $login) {
      repositories(first: 100, after: $cursor, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
        pageInfo { hasNextPage endCursor }
        nodes {
          name
          stargazerCount
          languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
            edges {
              size
              node { name }
            }
          }
        }
      }
    }
  }
GRAPHQL

def normalize_lang_totals(lang_totals)
  normalized = {}
  lang_totals.each do |name, bytes|
    next if name.nil? || EXCLUDED_LANGS.include?(name)

    label = LANG_ALIASES[name] || name
    normalized[label] = normalized[label].to_i + bytes.to_i
  end
  normalized
end

# Blend two signals:
# 1) Equal weight per repo (primary) - "how often do I use this across projects?"
# 2) Capped byte share (secondary) - still reflect larger real codebases a bit
def build_breakdown(repo_lang_maps)
  equal_scores = Hash.new(0.0)
  capped_bytes = Hash.new(0.0)
  repos_counted = 0

  repo_lang_maps.each do |lang_totals|
    filtered = normalize_lang_totals(lang_totals)
    featured_total = FEATURED_LANGS.sum { |name| filtered[name].to_i }
    next if featured_total.zero?

    repos_counted += 1

    FEATURED_LANGS.each do |name|
      share = filtered[name].to_i.to_f / featured_total
      equal_scores[name] += share
      capped_bytes[name] += [share, MAX_REPO_SHARE].min * featured_total
    end
  end

  if repos_counted.zero?
    return FEATURED_LANGS.map { |name|
      { "name" => name, "pct" => 0, "color" => LANG_COLORS[name] || LANG_COLORS["default"] }
    }
  end

  equal_pct = FEATURED_LANGS.to_h do |name|
    [name, (equal_scores[name] / repos_counted) * 100.0]
  end

  capped_total = FEATURED_LANGS.sum { |name| capped_bytes[name] }
  byte_pct = FEATURED_LANGS.to_h do |name|
    share = capped_total.positive? ? (capped_bytes[name] / capped_total) * 100.0 : 0.0
    [name, share]
  end

  # 70% equal-repo, 30% capped-bytes
  blended = FEATURED_LANGS.to_h do |name|
    [name, equal_pct[name] * 0.7 + byte_pct[name] * 0.3]
  end

  # Round and fix drift so visible bars sum to 100
  rounded = FEATURED_LANGS.map do |name|
    {
      "name" => name,
      "pct" => blended[name].round,
      "color" => LANG_COLORS[name] || LANG_COLORS["default"]
    }
  end

  drift = 100 - rounded.sum { |lang| lang["pct"] }
  if drift != 0
    top = rounded.max_by { |lang| blended[lang["name"]] }
    top["pct"] = [top["pct"] + drift, 0].max
  end

  # Drop true zeros from the chart so Shell/CloudFormation don't show empty rows
  visible = rounded.reject { |lang| lang["pct"].zero? }
  visible.empty? ? rounded : visible
end

def github_get(url)
  uri = URI(url)
  request = Net::HTTP::Get.new(uri)
  request["Accept"] = "application/vnd.github+json"
  request["X-GitHub-Api-Version"] = "2022-11-28"
  request["Authorization"] = "Bearer #{TOKEN}" if TOKEN && !TOKEN.empty?
  request["User-Agent"] = "adnanrahin-github-stats"

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
  raise "GitHub API #{response.code} for #{url}: #{response.body}" unless response.is_a?(Net::HTTPSuccess)

  JSON.parse(response.body)
end

def github_graphql(query, variables = {})
  raise "GITHUB_TOKEN is required for language stats" if TOKEN.nil? || TOKEN.empty?

  uri = URI("https://api.github.com/graphql")
  request = Net::HTTP::Post.new(uri)
  request["Authorization"] = "Bearer #{TOKEN}"
  request["Content-Type"] = "application/json"
  request["User-Agent"] = "adnanrahin-github-stats"
  request.body = JSON.generate({ query: query, variables: variables })

  response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) { |http| http.request(request) }
  body = JSON.parse(response.body)
  raise "GraphQL error: #{body["errors"]}" if body["errors"]

  body["data"]
end

def fetch_language_stats(username)
  repo_lang_maps = []
  total_stars = 0
  cursor = nil
  pages = 0

  loop do
    data = github_graphql(LANGUAGE_QUERY, { "login" => username, "cursor" => cursor })
    repos = data.dig("user", "repositories")
    raise "No repository data returned" unless repos

    repos["nodes"].each do |repo|
      total_stars += repo["stargazerCount"].to_i
      lang_totals = {}
      repo.dig("languages", "edges")&.each do |edge|
        name = edge.dig("node", "name")
        size = edge["size"].to_i
        next if name.nil?

        lang_totals[name] = lang_totals[name].to_i + size
      end
      repo_lang_maps << lang_totals unless lang_totals.empty?
    end

    pages += 1
    # Scan more history so older Java/Scala work still counts
    break unless repos.dig("pageInfo", "hasNextPage") && pages < 10

    cursor = repos.dig("pageInfo", "endCursor")
  end

  { "repo_lang_maps" => repo_lang_maps, "stars" => total_stars }
end

def fetch_lifetime_commits(username)
  query = URI.encode_www_form_component("author:#{username} committer-date:>2008-01-01")
  result = github_get("https://api.github.com/search/commits?q=#{query}&per_page=1")
  result["total_count"] || 0
end

def load_existing_stats
  return {} unless File.exist?(OUTPUT)

  YAML.safe_load(File.read(OUTPUT), permitted_classes: [Time]) || {}
rescue StandardError
  {}
end

def main
  existing = load_existing_stats
  lock_breakdown = existing["lock_lang_breakdown"] == true

  user = github_get("https://api.github.com/users/#{USERNAME}")

  if lock_breakdown && existing["lang_breakdown"].is_a?(Array) && !existing["lang_breakdown"].empty?
    breakdown = existing["lang_breakdown"]
    stars = existing["stars"] || 0
    puts "Keeping locked lang_breakdown from #{OUTPUT}"
  else
    language_data = fetch_language_stats(USERNAME)
    breakdown = build_breakdown(language_data["repo_lang_maps"])
    stars = language_data["stars"]

    if breakdown.sum { |lang| lang["pct"] }.zero?
      warn "Warning: featured language breakdown is empty - check GITHUB_TOKEN permissions"
    end
  end

  commits = begin
    fetch_lifetime_commits(USERNAME)
  rescue StandardError => e
    warn "Commit search failed: #{e.message}"
    existing["commits"] || 0
  end

  stats = {
    "username" => USERNAME,
    "updated_at" => Time.now.utc.iso8601,
    "member_since" => user["created_at"]&.slice(0, 4),
    "repos" => user["public_repos"],
    "commits" => commits,
    "languages" => breakdown.length,
    "stars" => stars,
    "lock_lang_breakdown" => lock_breakdown,
    "lang_breakdown" => breakdown
  }

  File.write(OUTPUT, stats.to_yaml(line_width: -1))
  puts "Wrote #{OUTPUT}"
  puts "  commits: #{commits}"
  puts "  repos:   #{stats['repos']}"
  puts "  stars:   #{stats['stars']}"
  puts "  locked:  #{lock_breakdown}"
  breakdown.each { |lang| puts "  #{lang['name']}: #{lang['pct']}%" }
end

main if $PROGRAM_NAME == __FILE__
