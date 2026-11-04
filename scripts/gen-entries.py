#!/usr/bin/env python3
"""Hanzii-style entries: meanings split by part of speech, one example per meaning, classifiers, near-synonyms.

Sources (the LLM edits, it does not invent meanings):
  meanings  CC-CEDICT English senses per reading (HSK list field `m`), numbered; every one must be covered or
            dropped with a reason, checked here. CVDICT Vietnamese senses help the translation.
  POS       HSK list field `p` (hint) → Vietnamese POS labels.
  examples  Tatoeba (CC BY 2.0 FR) simplified sentences that contain the word as a jieba token, with English
            (and Vietnamese when Tatoeba has it). LLM-written example only when no candidate fits, flagged ai.
Output: prototype/data/entries.json {hz: entry}.
Run: OPENCODE_API_KEY=… uv run scripts/gen-entries.py [words]   (no words = all HSK 3.0 level 1 words in dict.json; sources download into .cache/words)"""
import bz2, hashlib, json, os, re, sys, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import jieba, opencc

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'prototype/data/entries.json'
CACHE = ROOT / '.cache/words'
HSK_COMMIT = '7ac65bf1a6387d35f1ade478906172a19311c7f9'
TATOEBA = 'https://downloads.tatoeba.org/exports/per_language'
SOURCES = {  # complete.min.json: drkameleon HSK (MIT), pinned; Tatoeba exports roll weekly, so their sha256 is only recorded
    'complete.min.json': f'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/{HSK_COMMIT}/complete.min.json',
    'cmn_sentences.tsv.bz2': f'{TATOEBA}/cmn/cmn_sentences.tsv.bz2',
    'eng_sentences.tsv.bz2': f'{TATOEBA}/eng/eng_sentences.tsv.bz2',
    'vie_sentences.tsv.bz2': f'{TATOEBA}/vie/vie_sentences.tsv.bz2',
    'cmn-eng_links.tsv.bz2': f'{TATOEBA}/cmn/cmn-eng_links.tsv.bz2',
    'cmn-vie_links.tsv.bz2': f'{TATOEBA}/cmn/cmn-vie_links.tsv.bz2',
}
DICT = {r[0]: r for r in json.load(open(ROOT / 'prototype/data/dict.json'))}
HSK = {}
POS_VI = ['Danh từ', 'Động từ', 'Tính từ', 'Phó từ', 'Lượng từ', 'Đại từ', 'Số từ', 'Giới từ', 'Liên từ', 'Trợ từ', 'Thán từ', 'Bổ ngữ', 'Cụm từ', 'Thành ngữ']
POS_HINT = {'n': 'danh từ', 'v': 'động từ', 'a': 'tính từ', 'd': 'phó từ', 'q': 'lượng từ', 'r': 'đại từ', 'm': 'số từ',
            'p': 'giới từ', 'c': 'liên từ', 'u': 'trợ từ', 'e': 'thán từ', 'y': 'trợ từ ngữ khí', 'i': 'thành ngữ', 'l': 'cụm từ'}
# CEDICT senses that are cross-references, not meanings
XREF = re.compile(r'^(old |archaic |erhua )?variant of|^see (also )?\S|^surname |^used in |^abbr\. for|^also written|^also pr\.', re.I)

def fetch(name):
    path = CACHE / name
    if not path.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        print('download', name, flush=True)
        part = path.with_name(name + '.part')
        with urllib.request.urlopen(SOURCES[name], timeout=300) as res:
            part.write_bytes(res.read())
        part.rename(path)
    manifest_path = CACHE / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if manifest.get(name, digest) != digest:
        print('sha changed', name, manifest[name], '->', digest)
    manifest[name] = digest
    manifest_path.write_text(json.dumps(manifest, indent=1))
    return path

def tatoeba():
    t2s = opencc.OpenCC('t2s')
    def tsv(name):
        return [l.rstrip('\n').split('\t') for l in bz2.open(CACHE / name, 'rt', encoding='utf-8')]
    cmn = {r[0]: r[2] for r in tsv('cmn_sentences.tsv.bz2') if t2s.convert(r[2]) == r[2]}  # simplified only
    eng = {r[0]: r[2] for r in tsv('eng_sentences.tsv.bz2')}
    vie = {r[0]: r[2] for r in tsv('vie_sentences.tsv.bz2')}
    tr = {}
    for links, lang in (('cmn-eng_links.tsv.bz2', eng), ('cmn-vie_links.tsv.bz2', vie)):
        for a, b in tsv(links):
            if a in cmn and b in lang:
                tr.setdefault(a, {}).setdefault('en' if lang is eng else 'vi', lang[b])
    rows = {}
    for sid, text in cmn.items():
        if sid in tr and 'en' in tr[sid] and len(text) <= 24:
            rows[sid] = (text, set(jieba.lcut(text)), tr[sid])
    return rows

def candidates(hz, level, rows, n=30):
    """Sentences using hz as a word; easiest vocabulary first, then shortest."""
    def hardness(toks):
        return max([((DICT[w][5] or 7) if w in DICT else (0 if not re.search(r'[\u4e00-\u9fff]', w) else 8)) for w in toks] or [0])
    hits = [(hardness(toks), len(text), sid, text, tr) for sid, (text, toks, tr) in rows.items() if hz in toks]
    hits.sort(key=lambda h: (max(h[0], level or 1) > (level or 1) + 1, h[1]))
    return {sid: {'zh': text, **tr} for _, _, sid, text, tr in hits[:n]}

def ask(prompt):
    key = os.environ['OPENCODE_API_KEY']
    body = {'model': 'gpt-6-luna', 'input': [{'role': 'user', 'content': [{'type': 'input_text', 'text': prompt}]}], 'store': False}
    req = urllib.request.Request('https://opencode.ai/inference/go/v1/responses', data=json.dumps(body).encode(),
                                 headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json',
                                          'User-Agent': 'chaiyo-gen/1', 'x-opencode-session': str(uuid.uuid4())})
    res = json.load(urllib.request.urlopen(req, timeout=240))
    text = ''.join(c.get('text', '') for o in res.get('output', []) if o.get('type') == 'message' for c in o.get('content', []))
    return json.loads(re.search(r'\{.*\}', text, re.S).group(0))

def source(hz):
    """Numbered CEDICT senses per reading; cross-reference senses removed up front."""
    row, h = DICT[hz], HSK[hz]
    hv_by_py = {row[1].lower(): row[3], **{p.lower(): v for p, v, _ in row[7]}}
    readings, skipped = [], []
    for fi, f in enumerate(h['f']):
        py = f['i']['y']
        keep = [m for m in f['m'] if not XREF.search(m)]
        skipped += [m for m in f['m'] if XREF.search(m)]
        if not keep:
            continue
        cv = row[6] if py.lower() == row[1].lower() else next((s for p, _, s in row[7] if p.lower() == py.lower()), [])
        readings.append({'pinyin': py, 'hanviet': hv_by_py.get(py.lower(), row[3]), 'cvdict_vi': cv,
                         'senses': {f'{fi}.{i}': m for i, m in enumerate(keep)}})
    return readings, skipped

REASONS = {'trùng', 'cổ/văn ngôn', 'tên riêng'}

class Reject(Exception):
    def __init__(self, hz, errs):
        super().__init__(f'{hz}: {"; ".join(errs)}')
        self.hz, self.errs = hz, errs

def check(e, ids, ex_ids, hz, texts):
    used = {i for r in e['readings'] for g in r['groups'] for s in g['senses'] for i in s.get('src', [])}
    dropped = {d['id'] for d in e.get('dropped', [])}
    errs = [f'thiếu nghĩa {i} "{texts[i]}"' for i in ids if i not in used | dropped]
    errs += [f'lý do lạ {d.get("why")}' for d in e.get('dropped', []) if d.get('why') not in REASONS]
    for r in e['readings']:
        for g in r['groups']:
            if g['pos'] not in POS_VI:
                errs.append(f'từ loại lạ {g["pos"]}')
            for s in g['senses']:
                x = s.get('ex') or {}
                if x.get('tatoeba') and x['tatoeba'] not in ex_ids:
                    errs.append(f'câu {x["tatoeba"]} không có trong danh sách')
                if hz not in (x.get('hz') or ''):
                    errs.append(f'ví dụ của "{s["vi"]}" không chứa {hz}')
    return errs

def entry(hz, rows, llm=ask):
    readings, skipped = source(hz)
    level = DICT[hz][5]
    cands = candidates(hz, level, rows)
    texts = {i: t for r in readings for i, t in r['senses'].items()}
    ids = list(texts)
    pos = ', '.join(POS_HINT.get(p, p) for p in HSK[hz].get('p', []))
    prompt = f"""Bạn là biên tập viên từ điển Trung–Việt cho người Việt học HSK. Biên tập mục từ 「{hz}」 (HSK {level or 'ngoài'}).
Bạn là người BIÊN TẬP, không phải tác giả: nghĩa lấy từ CC-CEDICT, câu ví dụ lấy từ Tatoeba.

Nghĩa gốc (CC-CEDICT, đánh số; cvdict_vi là bản dịch máy tiếng Việt để tham khảo):
{json.dumps(readings, ensure_ascii=False)}
Từ loại gợi ý (danh sách HSK): {pos or 'không có'}
Câu ví dụ có sẵn (Tatoeba, id → câu): {json.dumps(cands, ensure_ascii=False)}

Yêu cầu:
- Mỗi số nghĩa ({', '.join(ids)}) PHẢI nằm trong "src" của đúng một nghĩa đầu ra, hoặc trong "dropped" với lý do "trùng" (gộp nghĩa đồng nghĩa vào chung một nghĩa thì ghi cả hai số vào src, không phải drop), "cổ/văn ngôn" hoặc "tên riêng". Không tự thêm nghĩa không có trong nguồn.
- Gom theo cách đọc, rồi theo từ loại. Từ loại chỉ dùng: {', '.join(POS_VI)}. "classifier for …" là Lượng từ; 好/完/到 sau động từ chỉ kết quả là Bổ ngữ.
- Nghĩa tiếng Việt ngắn, tự nhiên (2–8 từ), có thể thêm ghi chú trong ngoặc. Sắp nghĩa phổ biến trước.
- "common": true cho nghĩa người học HSK 1–6 hay gặp (thường 2–5 nghĩa mỗi từ), false cho nghĩa hiếm/chuyên môn/chỉ còn trong từ ghép. Không bỏ nghĩa hiếm, chỉ đánh dấu.
- Ví dụ: với mỗi nghĩa, chọn câu Tatoeba dùng ĐÚNG nghĩa đó (ghi "tatoeba": id, chép nguyên "hz"), ưu tiên câu ngắn, từ dễ. Một câu chỉ dùng cho một nghĩa.
  Không có câu nào đúng nghĩa → tự viết câu ≤ 12 chữ Hán, từ vựng HSK ≤ {max(level or 3, 2)}, ghi "ai": true.
  "py": pinyin có dấu, tách từ, viết hoa đầu câu. "vi": dịch tiếng Việt tự nhiên (dựa vào câu Trung, bản tiếng Anh/Việt kèm theo chỉ để hiểu nghĩa).
- "luongtu": lượng từ đi với danh từ này ([] nếu không phải danh từ). "cannghia": tối đa 3 từ gần nghĩa, [] nếu không chắc.

Chỉ trả về JSON:
{{"readings":[{{"pinyin":"...","hanviet":"...","groups":[{{"pos":"Danh từ","senses":[{{"vi":"...","src":["1.0"],"common":true,"ex":{{"tatoeba":"123","hz":"...","py":"...","vi":"..."}}}}]}}]}}],"dropped":[{{"id":"1.5","why":"trùng"}}],"luongtu":[],"cannghia":[]}}"""
    e = llm(prompt)
    errs = check(e, ids, cands, hz, texts)
    if errs:  # one repair round with the concrete failures
        e = llm(prompt + f"\n\nBản trước sai: {json.dumps(errs, ensure_ascii=False)}. Sửa và trả lại toàn bộ JSON:\n{json.dumps(e, ensure_ascii=False)}")
        errs = check(e, ids, cands, hz, texts)
    if errs:
        raise Reject(hz, errs)
    for r in e['readings']:
        for g in r['groups']:
            for s in g['senses']:
                x = s['ex']
                if x.get('tatoeba'):  # verbatim source text, not the model's copy
                    x['hz'] = cands[x['tatoeba']]['zh']
    main = DICT[hz][1].lower()  # the reading learners meet first (dǎ, not dá)
    for r in list(e['readings']):
        if r['pinyin'].lower() != main and not any(s.get('common') for g in r['groups'] for s in g['senses']):
            e['readings'].remove(r)
            e.setdefault('dropped', []).extend({'id': i, 'why': 'âm hiếm'} for g in r['groups'] for s in g['senses'] for i in s['src'])
    e['stats'] = {'cedict': len(ids), 'xref': len(skipped), 'dropped': len(e.get('dropped', [])),
                  'tatoeba': sum(bool(s['ex'].get('tatoeba')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'ai_ex': sum(bool(s['ex'].get('ai')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'candidates': len(cands)}
    e['readings'].sort(key=lambda r: (r['pinyin'].lower() != main, not any(s.get('common') for g in r['groups'] for s in g['senses'])))
    e['src'] = 'ai-edited'
    return hz, e

def main(argv, llm=ask):
    if llm is ask and not os.environ.get('OPENCODE_API_KEY'):
        print('OPENCODE_API_KEY is not set', file=sys.stderr)
        sys.exit(2)
    for name in SOURCES:
        fetch(name)
    HSK.update({e['s']: e for e in json.load(open(CACHE / 'complete.min.json'))})
    hsk1 = {s for s, e in HSK.items() if 'n1' in e['l']} & DICT.keys()
    words = []
    for w in argv or sorted(hsk1):
        if w in hsk1:
            words.append(w)
        else:
            print(f'skip {w}: not in HSK1 list')
    rows = tatoeba()
    data = json.loads(OUT.read_text()) if OUT.exists() else {}
    rejected = []
    with ThreadPoolExecutor(8) as pool:
        for w, f in [(w, pool.submit(entry, w, rows, llm)) for w in words]:
            try:
                hz, e = f.result(); data[hz] = e
                print('ok', hz, json.dumps(e['stats'], ensure_ascii=False))
            except Reject as err:
                rejected.append(str(err))
                print('REJECT', err)
            except Exception as err:
                rejected.append(f'{w}: {err!r}')
                print('FAIL', rejected[-1])
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')))
    if rejected:
        print('\n'.join(f'REJECT {r}' for r in rejected))
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1:])
