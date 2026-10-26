#!/usr/bin/env python3
"""One image via opencode-go hosted gpt-image-2, with the cast lineup attached as reference.
Calls the API directly: omp 18.12.5 drops the x-opencode-session header on image requests (400 MissingSessionID).
Usage: gen-image.py OUT.png "prompt" [ref.png]"""
import base64, json, os, sqlite3, sys, urllib.request, uuid

out, prompt = sys.argv[1], sys.argv[2]
ref = sys.argv[3] if len(sys.argv) > 3 else 'assets/ref/cast.png'

db = sqlite3.connect(os.path.expanduser('~/.omp/agent/agent.db'))
row = db.execute("select json_extract(data,'$.key') from auth_credentials "
                 "where provider='opencode-go' and disabled_cause is null limit 1").fetchone()
if not row: sys.exit('no opencode-go key in ~/.omp/agent/agent.db')

content = [{'type': 'input_text', 'text': prompt}]
if ref:
    b64 = base64.b64encode(open(ref, 'rb').read()).decode()
    content.append({'type': 'input_image', 'detail': 'auto', 'image_url': f'data:image/png;base64,{b64}'})

body = {
    'model': 'gpt-6-luna',
    'input': [{'role': 'user', 'content': content}],
    # no 'model' → opencode silently serves gpt-image-1 (much worse); pin gpt-image-2
    'tools': [{'type': 'image_generation', 'model': 'gpt-image-2', 'action': 'edit' if ref else 'generate',
               'output_format': 'png', 'size': '1536x1024', 'quality': 'high'}],
    'tool_choice': {'type': 'image_generation'},
    'store': False,
}
req = urllib.request.Request(
    'https://opencode.ai/inference/go/v1/responses', data=json.dumps(body).encode(),
    headers={'Authorization': f'Bearer {row[0]}', 'Content-Type': 'application/json',
             'User-Agent': 'chaiyo-gen/1',  # default Python UA → Cloudflare 1010
             'x-opencode-session': str(uuid.uuid4())})
try:
    res = json.load(urllib.request.urlopen(req, timeout=300))
except urllib.error.HTTPError as e:
    sys.exit(f'HTTP {e.code}: {e.read()[:400].decode(errors="replace")}')

imgs = [o['result'] for o in res.get('output', []) if o.get('type') == 'image_generation_call' and o.get('result')]
if not imgs: sys.exit(f'no image in response: {json.dumps(res)[:400]}')
open(out, 'wb').write(base64.b64decode(imgs[0]))
print(out)
