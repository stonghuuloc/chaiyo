#!/usr/bin/env bash
# Guarded `supabase config push`: refuses when a Google credential is empty (an empty env() overwrites the live secret).
# Usage: scripts/supabase-push.sh <project-ref>
set -euo pipefail
cd "$(dirname "$0")/.."
ref=${1:?usage: scripts/supabase-push.sh <project-ref>}
if [ -f supabase/.env ]; then
	set -a
	. supabase/.env
	set +a
fi
for name in SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET; do
	if [ -z "${!name:-}" ]; then
		echo "$name is empty; refusing to push" >&2
		exit 1
	fi
done
exec supabase config push --project-ref "$ref"
