#!/usr/bin/env bash
set -euo pipefail
dir="${1:-content}"
# No `tee /dev/stderr`: on Vercel stderr is a socket and opening /dev/stderr fails (ENXIO).
out=$(pnpm -s import:content "$dir" --sink bundle --out static/content --only lessons/hsk1)
printf '%s\n' "$out" >&2
sha=$(printf '%s\n' "$out" | tail -n 1)
pnpm -s fonts "static/content/$sha" static/fonts/lessons
