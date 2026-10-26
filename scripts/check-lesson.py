#!/usr/bin/env python3
"""Check a prototype lesson (docs/lesson-preview-format.md rules ★1–★7).
Usage: python3 scripts/check-lesson.py h2-01 [h3-01 …]   → exit 1 on any error."""
import csv, json, os, re, subprocess, sys, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = os.path.join(ROOT, 'prototype')
DICT = json.load(open(os.path.join(P, 'data/dict.json')))
COUNT = {2: (10, 12), 3: (12, 14), 4: (14, 16), 5: (15, 18)}
# GF 0025-2021 Appendix A grammar list (ivankra/hsk30, MIT); level "7-9" → 7
with open(os.path.join(ROOT, 'data/sources/hsk30-grammar.csv'), newline='') as f:
    SYLLABUS = {int(r['No']): (int(r['Level'][0]), r['Content'] or r['Details'] or r['Category']) for r in csv.DictReader(f)}
HZ = re.compile(r'[\u3400-\u9fff]')
norm = lambda s: unicodedata.normalize('NFC', re.sub(r"[\s'’·-]", '', s.lower()))


def load(lid):
    js = f"import('./data/{lid}.js?'+Date.now()).then(m=>console.log(JSON.stringify(m.LESSON)))"
    r = subprocess.run(['node', '--input-type=module', '-e', js], cwd=P, capture_output=True, text=True)
    if r.returncode: sys.exit(f'{lid}: cannot load: {r.stderr.strip()[:400]}')
    return json.loads(r.stdout)


def check(lid):
    L = load(lid); lv = L['level']; err = []
    rows = {}
    for r in DICT: rows.setdefault(r[0], []).append(r)
    known = {c for r in DICT if r[5] <= lv for c in r[0]}
    S = L.get('sentences', {})

    # ★1 ★2 words
    words = L.get('words', []); at_level = 0
    for w in words:
        rs = rows.get(w['hz'])
        if not rs: err.append(f"★1 {w['hz']}: not in dict.json"); continue
        reads = [(r[1], r[3], r[5]) for r in rs] + [(o[0], o[1], r[5]) for r in rs for o in r[7]]
        hit = [x for x in reads if norm(x[0]) == norm(w['py'])]
        if not hit: err.append(f"★1 {w['hz']}: py '{w['py']}' not in {sorted({x[0] for x in reads})}"); continue
        if not any(norm(x[1]) == norm(w['hv']) for x in hit): err.append(f"★1 {w['hz']}: hv '{w['hv']}' ≠ {sorted({x[1] for x in hit})}")
        wl = min(x[2] for x in hit)
        if wl > lv: err.append(f"★2 {w['hz']}: HSK {wl} > {lv}")
        at_level += wl == lv
        for k in ('ex', 'art', 'vi', 'pos'):
            if not w.get(k): err.append(f"{w['hz']}: missing {k}")
        if w.get('ex') and w['ex'] not in S: err.append(f"{w['hz']}: ex {w['ex']} not a sentence")
        if len(w['hz']) > 1 and not w.get('chars'): err.append(f"{w['hz']}: multi-char word needs chars")
        if len(w['hz']) == 1 and not w.get('parts'): err.append(f"{w['hz']}: single char needs parts")
    lo, hi = COUNT.get(lv, (8, 15))
    if not lo <= len(words) <= hi: err.append(f"★2 {len(words)} words, want {lo}–{hi}")
    if words and at_level / len(words) < .7: err.append(f"★2 only {at_level}/{len(words)} words are HSK {lv}")

    # ★3 ★5 sentences
    for sid, s in S.items():
        unk = set(s.get('unknown', []))
        bad = {c for c in HZ.findall(s['hz']) if c not in known} - unk
        if bad: err.append(f"★3 {sid} {s['hz']}: chars above HSK {lv}: {''.join(sorted(bad))}")
        if len(unk) > 1: err.append(f"★3 {sid}: more than 1 unknown")
        for k in ('py', 'spoken'):
            if re.search(r'\d', s.get(k, '')): err.append(f"★5 {sid}: digits in {k}")
        if not s.get('vi'): err.append(f"{sid}: missing vi")

    # ★6 dialogue / reading
    dl = [sid for part in L.get('dialogue', []) for sid in part['lines']]
    rd = L.get('reading', {}).get('lines', []) if L.get('reading') else []
    for part in L.get('dialogue', []):
        sp = [S.get(x, {}).get('speaker') for x in part['lines']]
        if any(x not in ('redpanda', 'takin') for x in sp): err.append(f"★6 {part['title']}: speaker not redpanda/takin: {sp}")
        if any(a == b for a, b in zip(sp, sp[1:])): err.append(f"★6 {part['title']}: speakers not alternating")
    for x in dl + rd:
        if x not in S: err.append(f"unknown sentence id {x}")
    for x in rd:
        if S.get(x, {}).get('speaker'): err.append(f"★6 reading {x} has a speaker")
    if lv >= 3 and not rd: err.append('★6 HSK 3+ needs reading')

    # ★4 every word used in text + gate
    text = ''.join(S[x]['hz'] for x in dl + rd if x in S)
    gate = L.get('gate', [])
    gtext = json.dumps(gate, ensure_ascii=False) + ''.join(S.get(q.get('sid'), {}).get('hz', '') for q in gate)
    for w in words:
        if w['hz'] not in text: err.append(f"★4 {w['hz']}: not in dialogue/reading")
        if w['hz'] not in gtext and w['vi'] not in gtext: err.append(f"★4 {w['hz']}: not in gate")

    # ★7 grammar / writing / gate
    g = L.get('grammar', [])
    if not 1 <= len(g) <= 3: err.append(f"★7 {len(g)} grammar points")
    for x in g:
        ex = x.get('examples', [])
        if len(ex) < 2 or any(e not in S for e in ex): err.append(f"★7 grammar {x.get('id')}: examples {ex}")
    # ★8 syllabus: every point names its GF 0025-2021 items (std: [] = vocabulary pattern, no item);
    # none above the lesson level, and at least one new point at exactly this level
    levels = set()
    for x in g:
        if not isinstance(x.get('std'), list): err.append(f"★8 grammar {x.get('id')}: missing std"); continue
        for n in x['std']:
            if n not in SYLLABUS: err.append(f"★8 grammar {x['id']}: std {n} not in syllabus"); continue
            sl = SYLLABUS[n][0]; levels.add(sl)
            if sl > lv: err.append(f"★8 grammar {x['id']}: syllabus #{n} is HSK {sl if sl < 7 else '7-9'} > {lv} ({SYLLABUS[n][1][:30]})")
    if g and lv not in levels: err.append(f"★8 no grammar point at syllabus HSK {lv}")
    wr = L.get('writing', []); wchars = {c for w in words for c in w['hz']}
    if not 3 <= len(wr) <= 5 or any(c not in wchars for c in wr): err.append(f"★7 writing {wr}")
    if len(gate) < 8: err.append(f"★7 gate has {len(gate)} questions")
    if {q.get('t') for q in gate} != {'choice', 'listen', 'order'}: err.append(f"★7 gate types {sorted({q.get('t') for q in gate})}")
    for i, q in enumerate(gate, 1):
        if q.get('t') == 'order':
            if sorted(q['tiles']) != sorted(q['tiles']) or ''.join(sorted(q['ans'])) != ''.join(sorted(''.join(q['tiles']))): err.append(f"★7 gate {i}: tiles ≠ ans")
        elif q.get('ans') not in q.get('opts', []): err.append(f"★7 gate {i}: ans not in opts")
        if q.get('t') == 'listen' and q.get('sid') not in S: err.append(f"★7 gate {i}: sid {q.get('sid')}")
    if not L.get('cover'): err.append('missing cover prompt')
    return L, err


bad = 0
for lid in sys.argv[1:]:
    L, err = check(lid)
    n = len(L.get('words', [])); m = len(L.get('sentences', {}))
    print(f"{lid}: {n} words, {m} sentences, {len(L.get('gate', []))} gate — {'OK' if not err else str(len(err)) + ' errors'}")
    for e in err: print('  ' + e)
    bad += bool(err)
sys.exit(1 if bad else 0)
