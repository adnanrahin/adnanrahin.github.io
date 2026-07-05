#!/usr/bin/env bash
# Run Jekyll locally without installing Ruby (requires Docker)
set -e
docker compose run --rm jekyll bundle install
docker compose up
