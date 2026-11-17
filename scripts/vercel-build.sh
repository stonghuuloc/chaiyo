#!/usr/bin/env bash
# Vercel's Python is uv-managed and refuses pip installs (PEP 668), so the font deps go in a venv.
set -euo pipefail
venv="${TMPDIR:-/tmp}/chaiyo-fonts-venv"
python3 -m venv "$venv"
"$venv/bin/pip" install --quiet -r scripts/requirements-fonts.txt
PATH="$venv/bin:$PATH" bash scripts/build-content.sh
pnpm build
