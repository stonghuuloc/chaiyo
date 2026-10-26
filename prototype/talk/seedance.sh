#!/usr/bin/env bash
# Usage: prototype/talk/seedance.sh [model]   (needs ARK_API_KEY in env or prototype/talk/.env)
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
: "${ARK_API_KEY:?put ARK_API_KEY=... in prototype/talk/.env}"
MODEL="${1:-seedance-1-0-pro-250528}"
API=https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks
PROMPT='The white bear-like character from the reference image speaks cheerfully straight to the camera, as if saying a short greeting. Its small mouth opens and closes in a natural talking rhythm, 3-4 syllables, then closes. Gentle head bob in time with the speech, one soft blink in the middle, cheeks stay blushed. Keep the character exactly as in the image: same face, same two small round ears, bold dark outlines, flat colours, hand-drawn Japanese manga style. Static camera, plain warm off-white background, no props, no other characters, no text. Ends with the mouth closed.'

sips -s format jpeg -Z 512 redpanda-closed.png --out /tmp/seed-first.jpg >/dev/null
python3 - "$MODEL" "$PROMPT" > /tmp/seed-body.json <<'PY'
import base64, json, sys
img = base64.b64encode(open('/tmp/seed-first.jpg', 'rb').read()).decode()
print(json.dumps({"model": sys.argv[1], "content": [
  {"type": "text", "text": sys.argv[2] + " --resolution 480p --duration 5 --camerafixed true"},
  {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64," + img}}]}))
PY
id=$(curl -sS -X POST "$API" -H "Authorization: Bearer $ARK_API_KEY" -H "Content-Type: application/json" --data-binary @/tmp/seed-body.json \
  | python3 -c 'import json,sys; r=json.load(sys.stdin); print(r.get("id") or sys.exit("create failed: "+json.dumps(r)))')
echo "task $id"
while :; do
  r=$(curl -sS "$API/$id" -H "Authorization: Bearer $ARK_API_KEY")
  st=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["status"])' "$r")
  echo "status $st"
  case $st in
    succeeded) url=$(python3 -c 'import json,sys; print(json.loads(sys.argv[1])["content"]["video_url"])' "$r"); break ;;
    failed|cancelled|expired) echo "$r"; exit 1 ;;
  esac
  sleep 10
done
curl -sS -o redpanda-talk.mp4 "$url"
ffmpeg -y -loglevel error -i redpanda-talk.mp4 -i nihao.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest redpanda-talk-nihao.mp4
echo "done: prototype/talk/redpanda-talk.mp4 (silent) · redpanda-talk-nihao.mp4 (with our 你好)"
