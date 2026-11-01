#!/usr/bin/env python3
"""Listening clips for the HSK 1 mock (prototype/data/mock-h1.js), same edge-tts voice as lesson words.
Usage: python3 scripts/build-mock-audio.py   → prototype/audio/mock-h1/q01.mp3 … q20.mp3; skips existing
Needs the /tmp/etts venv (edge-tts)."""
import importlib.util, json, os, subprocess
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('media', os.path.join(ROOT, 'scripts/build-lesson-media.py'))
media = importlib.util.module_from_spec(spec); spec.loader.exec_module(media)

js = "import('./data/mock-h1.js').then(m=>console.log(JSON.stringify(m.MOCK.sections[0].parts.flatMap(p=>p.items))))"
items = json.loads(subprocess.run(['node', '--input-type=module', '-e', js], cwd=media.P, capture_output=True, text=True, check=True).stdout)
jobs = [(f"{it['say']} {it['q']}" if it.get('q') else it['say'], media.WORD_VOICE, f'{media.P}/audio/mock-h1/q{i:02d}.mp3')
        for i, it in enumerate(items, 1)]
with ThreadPoolExecutor(8) as ex:
    res = list(ex.map(lambda j: media.tts(*j), jobs))
print(f'mock-h1 audio: {res.count("ok")} new, {res.count("skip")} kept', *[r for r in res if r.startswith('FAIL')], sep='\n  ')
