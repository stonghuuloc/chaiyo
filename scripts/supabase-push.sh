#!/usr/bin/env bash
# Guarded `supabase config push`: refuses when a pushed secret (Google client id/secret, Resend API key) is empty; an empty env() overwrites the live value.
# Usage: scripts/supabase-push.sh <project-ref>
set -euo pipefail
cd "$(dirname "$0")/.."
ref=${1:?usage: scripts/supabase-push.sh <project-ref>}
if ! grep -qx "project_id = \"$ref\"" supabase/config.toml; then
	echo "$ref has no [remotes.*] override in supabase/config.toml; refusing to push the base (local) config" >&2
	exit 1
fi
for name in SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET RESEND_API_KEY; do
	val=${!name:-}
	if [ -f supabase/.env ]; then
		val=$(sed -n "s/^$name=//p" supabase/.env | tail -n 1)
	fi
	if [ -z "$(printf '%s' "$val" | tr -d " \"'")" ]; then
		echo "$name is empty; refusing to push" >&2
		exit 1
	fi
	unset "$name"
done
exec supabase config push --project-ref "$ref"
