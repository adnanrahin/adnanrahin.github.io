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
  "JavaScript" => "#f1e05a",
  "TypeScript" => "#3178c6",
  "Python" => "#3572A5",
  "Java" => "#b07219",
  "Scala" => "#c22d40",
  "C++" => "#f34b7d",
  "C" => "#555555",
  "Go" => "#00ADD8",
  "HTML" => "#e34c26",
  "CSS" => "#563d7c",
  "Shell" => "#89e051",
  "CloudFormation Stack" => "#ff9900",
  "CloudFormation" => "#ff9900",
  "Dockerfile" => "#384d54",
  "default" => "#6c9eff"
}.freeze

def normalize_lang_totals(lang_totals)
  normalized = {}
  lang_totals.each do |name, bytes|
    next if EXCLUDED_LANGS.include?(name)

    label = LANG_ALIASES[name] || name
    normalized[label] = normalized[label].to_i + bytes.to_i
  end
  normalized
end

def github_request(url)
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

def fetch_lifetime_commits(username)
  query = URI.encode_www_form_component("author:#{username} committer-date:>2008-01-01")
  result = github_request("https://api.github.com/search/commits?q=#{query}&per_page=1")
  result["total_count"] || 0
end

def fetch_all_repos(username)
  repos = []
  page = 1

  loop do
    url = "https://api.github.com/users/#{username}/repos?per_page=100&page=#{page}&type=owner&sort=pushed"
    batch = github_request(url)
    break if !batch.is_a?(Array) || batch.empty?

    repos.concat(batch.reject { |repo| repo["fork"] })
    break if batch.length < 100

    page += 1
    break if page > 10
  end

  repos
end

def aggregate_repo_stats(repos)
  lang_totals = {}
  total_stars = repos.sum { |repo| repo["stargazers_count"].to_i }
  sample = repos.first(40)

  sample.each do |repo|
    langs = github_request(repo["languages_url"])
    langs.each { |lang, bytes| lang_totals[lang] = lang_totals[lang].to_i + bytes.to_i }
  rescue StandardError => e
    warn "Skipping #{repo['name']}: #{e.message}"
    next
  end

  filtered = normalize_lang_totals(lang_totals)
  featured_total = FEATURED_LANGS.sum { |name| filtered[name].to_i }

  breakdown = FEATURED_LANGS.map do |name|
    bytes = filtered[name].to_i
    {
      "name" => name,
      "pct" => featured_total.positive? ? (bytes * 100.0 / featured_total).round : 0,
      "color" => LANG_COLORS[name] || LANG_COLORS["default"]
    }
  end

  { "languages" => FEATURED_LANGS.length, "stars" => total_stars, "lang_breakdown" => breakdown }
end

def main
  user = github_request("https://api.github.com/users/#{USERNAME}")
  repos = fetch_all_repos(USERNAME)
  repo_stats = aggregate_repo_stats(repos)
  commits = begin
    fetch_lifetime_commits(USERNAME)
  rescue StandardError => e
    warn "Commit search failed: #{e.message}"
    0
  end
  member_since = user["created_at"]&.slice(0, 4)

  stats = {
    "username" => USERNAME,
    "updated_at" => Time.now.utc.iso8601,
    "member_since" => member_since,
    "repos" => user["public_repos"] || repos.length,
    "commits" => commits,
    "languages" => repo_stats["languages"],
    "stars" => repo_stats["stars"],
    "lang_breakdown" => repo_stats["lang_breakdown"]
  }

  File.write(OUTPUT, stats.to_yaml(line_width: -1))
  puts "Wrote #{OUTPUT}"
  puts "  commits: #{commits} (lifetime, all public repos)"
  puts "  repos:   #{stats['repos']}"
  puts "  stars:   #{stats['stars']}"
  stats["lang_breakdown"].each { |lang| puts "  #{lang['name']}: #{lang['pct']}%" }
end

main if $PROGRAM_NAME == __FILE__
