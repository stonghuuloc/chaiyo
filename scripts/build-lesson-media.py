#!/usr/bin/env python3
"""Media for a prototype lesson (docs/lesson-preview-format.md): audio, Kaishu font subset, art.
Usage: python3 scripts/build-lesson-media.py h2-01 [h3-01 …] [--no-art]
  audio  prototype/audio/<id>/w01.mp3 … (words) and <sid>.mp3 (sentences), edge-tts; skips existing
  font   prototype/fonts/ukai-<id>.woff2 (every hanzi in the lesson, from assets/ukai.ttc)
  art    assets/lessons/<id>.png (cover) + assets/words/<id>/w01.png …, via gen-result-art.sh --prompt; skips existing
Needs the /tmp/etts venv (edge-tts + fonttools)."""
import json, os, re, subprocess, sys
from datetime import date
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'prototype')
VENV = '/tmp/etts/bin'
VOICE = {'takin': 'zh-CN-XiaoyiNeural', 'redpanda': 'zh-CN-XiaoxiaoNeural', None: 'zh-CN-YunxiNeural'}
WORD_VOICE = 'zh-CN-XiaoxiaoNeural'


def load(lid):
    js = f"import('./data/{lid}.js').then(m=>console.log(JSON.stringify(m.LESSON)))"
    return json.loads(subprocess.run(['node', '--input-type=module', '-e', js], cwd=P, capture_output=True, text=True, check=True).stdout)


def tts(text, voice, out):
    if os.path.exists(out) and os.path.getsize(out): return 'skip'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    r = subprocess.run([f'{VENV}/edge-tts', '--voice', voice, '--rate', '-10%', '--text', text, '--write-media', out], capture_output=True, text=True)
    return 'ok' if r.returncode == 0 else f'FAIL {out}: {r.stderr[-200:]}'


def art(out, scene):
    if os.path.exists(out): return 'skip'
    r = subprocess.run(['sh', 'scripts/gen-result-art.sh', '--prompt', out, scene], cwd=ROOT, capture_output=True, text=True)
    return r.stdout.strip() or r.stderr.strip()


def build(lid, do_art):
    """Generate media for prototype/data/<lid>.js, optionally including art.

    Keep existing nonempty audio files and, when do_art is truthy, existing art
    files. Always regenerate the lesson's Kaishu WOFF2 subset and stamp it with
    today's local date. Write audio and fonts under prototype/ and art under
    assets/. Print progress and return None.

    Nonzero TTS and art exit codes become printed results; processing continues.
    Lesson-loading, font-subsetting, and notice-stamping command failures raise
    subprocess.CalledProcessError. Process-launch and file-access errors, JSON
    decoding errors, and missing lesson-field or speaker keys also propagate.
    """
    L = load(lid); jobs = []
    for i, w in enumerate(L['words'], 1):
        jobs.append((w['hz'], WORD_VOICE, f'{P}/audio/{lid}/w{i:02d}.mp3'))
    reading = set(L.get('reading', {}).get('lines', []) if L.get('reading') else [])
    for sid, s in L['sentences'].items():
        jobs.append((s['hz'], VOICE[None if sid in reading else s.get('speaker', 'redpanda')], f'{P}/audio/{lid}/{sid}.mp3'))
    with ThreadPoolExecutor(8) as ex:
        res = list(ex.map(lambda j: tts(*j), jobs))
    print(f'{lid} audio: {res.count("ok")} new, {res.count("skip")} kept', *[r for r in res if r.startswith('FAIL')], sep='\n  ')

    chars = ''.join(sorted(set(re.findall(r'[\u3400-\u9fff]', json.dumps(L, ensure_ascii=False)))))
    subprocess.run([f'{VENV}/pyftsubset', f'{ROOT}/assets/ukai.ttc', '--font-number=0', f'--text={chars}', '--flavor=woff2',
                    f'--output-file={P}/fonts/ukai-{lid}.woff2'], check=True)
    subprocess.run(['uvx', '--from', 'fonttools', '--with', 'brotli', 'python', os.path.join(ROOT, 'scripts/stamp-arphic-notice.py'),
                    date.today().isoformat(), f'{P}/fonts/ukai-{lid}.woff2'], check=True)
    print(f'{lid} font: {len(chars)} chars')

    if do_art:
        arts = [(f'{ROOT}/assets/lessons/{lid}.png', L['cover'])] + \
               [(f'{ROOT}/assets/words/{lid}/w{i:02d}.png', w['art']) for i, w in enumerate(L['words'], 1)]
        with ThreadPoolExecutor(8) as ex:
            for r in ex.map(lambda a: art(*a), arts): print(' ', r)


args = [a for a in sys.argv[1:] if not a.startswith('--')]
for lid in args: build(lid, '--no-art' not in sys.argv)
