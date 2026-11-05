#!/usr/bin/env bash
set -euo pipefail
dir="${1:-content}"
sha=$(pnpm -s import:content "$dir" --sink bundle --out static/content --only lessons/hsk1 | tee /dev/stderr | tail -n 1)
pnpm -s fonts "static/content/$sha" static/fonts/lessons
