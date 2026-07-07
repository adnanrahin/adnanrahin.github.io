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

EXCLUDED_LANGS = %w[HTML CSS TypeScript].freeze
LANG_ALIASES = {
  "HCL" => "CloudFormation Stack",
  "YAML" => "CloudFormation Stack",
  "CloudFormation" => "CloudFormation Stack"
}.freeze
FEATURED_LANGS = ["Java", "Scala", "Python", "C++", "Shell", "CloudFormation Stack"].freeze

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
    next if EXCLUDED_LANGS.include?(name)

    label = LANG_ALIASES[name] || name
    normalized[label] = normalized[label].to_i + bytes.to_i
  end
  normalized
end

def build_breakdown(lang_totals)
  filtered = normalize_lang_totals(lang_totals)
  featured_total = FEATURED_LANGS.sum { |name| filtered[name].to_i }

  FEATURED_LANGS.map do |name|
    bytes = filtered[name].to_i
    {
      "name" => name,
      "pct" => featured_total.positive? ? (bytes * 100.0 / featured_total).round : 0,
      "color" => LANG_COLORS[name] || LANG_COLORS["default"]
    }
  end
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
  lang_totals = {}
  total_stars = 0
  cursor = nil
  pages = 0

  loop do
    data = github_graphql(LANGUAGE_QUERY, { "login" => username, "cursor" => cursor })
    repos = data.dig("user", "repositories")
    raise "No repository data returned" unless repos

    repos["nodes"].each do |repo|
      total_stars += repo["stargazerCount"].to_i
      repo.dig("languages", "edges")&.each do |edge|
        name = edge.dig("node", "name")
        size = edge["size"].to_i
        lang_totals[name] = lang_totals[name].to_i + size
      end
    end

    pages += 1
    break unless repos.dig("pageInfo", "hasNextPage") && pages < 3

    cursor = repos.dig("pageInfo", "endCursor")
  end

  { "lang_totals" => lang_totals, "stars" => total_stars }
end

def fetch_lifetime_commits(username)
  query = URI.encode_www_form_component("author:#{username} committer-date:>2008-01-01")
  result = github_get("https://api.github.com/search/commits?q=#{query}&per_page=1")
  result["total_count"] || 0
end

def main
  user = github_get("https://api.github.com/users/#{USERNAME}")
  language_data = fetch_language_stats(USERNAME)
  breakdown = build_breakdown(language_data["lang_totals"])

  if breakdown.sum { |lang| lang["pct"] }.zero?
    warn "Warning: featured language breakdown is empty - check GITHUB_TOKEN permissions"
  end

  commits = begin
    fetch_lifetime_commits(USERNAME)
  rescue StandardError => e
    warn "Commit search failed: #{e.message}"
    0
  end

  stats = {
    "username" => USERNAME,
    "updated_at" => Time.now.utc.iso8601,
    "member_since" => user["created_at"]&.slice(0, 4),
    "repos" => user["public_repos"],
    "commits" => commits,
    "languages" => FEATURED_LANGS.length,
    "stars" => language_data["stars"],
    "lang_breakdown" => breakdown
  }

  File.write(OUTPUT, stats.to_yaml(line_width: -1))
  puts "Wrote #{OUTPUT}"
  puts "  commits: #{commits}"
  puts "  repos:   #{stats['repos']}"
  puts "  stars:   #{stats['stars']}"
  breakdown.each { |lang| puts "  #{lang['name']}: #{lang['pct']}%" }
end

main if $PROGRAM_NAME == __FILE__
