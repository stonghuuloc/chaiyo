#!/usr/bin/env python3
"""Hanzii-style entries: meanings split by part of speech, one example per meaning, classifiers, near-synonyms.

Sources (the LLM edits, it does not invent meanings):
  meanings  CC-CEDICT English senses per reading (HSK list field `m`), numbered; every one must be covered or
            dropped with a reason, checked here. CVDICT Vietnamese senses help the translation.
  POS       HSK list field `p` (hint) → Vietnamese POS labels.
  examples  Tatoeba (CC BY 2.0 FR) simplified sentences that contain the word as a jieba token, with English
            (and Vietnamese when Tatoeba has it). LLM-written example only when no candidate fits, flagged ai.
Output (staging, never content/): .cache/words/out/words/<id>.yaml (Word) + sentences/hsk1.yaml (Sentence[]) + src/<id>.json (numbered CC-CEDICT senses).
Run: OPENCODE_API_KEY=… uv run scripts/gen-entries.py [words]   (no words = all HSK 3.0 level 1 words in dict.json; sources download into .cache/words)"""
import argparse, bz2, hashlib, unicodedata, json, os, random, re, shutil, sys, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import jieba, opencc, yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content/words'
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
DICT = {r[0]: r for r in json.loads((ROOT / 'prototype/data/dict.json').read_text(encoding='utf-8'))}
HSK = {}
USAGE = {'calls': 0, 'input': 0, 'output': 0}
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
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if manifest.get(name, digest) != digest:
        print('sha changed', name, manifest[name], '->', digest)
    manifest[name] = digest
    manifest_path.write_text(json.dumps(manifest, indent=1), encoding='utf-8')
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
    USAGE['calls'] += 1
    USAGE['input'] += (res.get('usage') or {}).get('input_tokens', 0)
    USAGE['output'] += (res.get('usage') or {}).get('output_tokens', 0)
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

REASONS = {'trùng', 'cổ/văn ngôn', 'tên riêng', 'không có ví dụ tự nhiên'}
POS_CODE = dict(zip(POS_VI, ['n', 'v', 'adj', 'adv', 'mw', 'pron', 'num', 'prep', 'conj', 'part', 'interj', 'comp', 'phrase', 'phrase']))
MARKED = set('āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ')
NEUTRAL = {'de', 'le', 'ma', 'me', 'men', 'ne', 'ba', 'zi', 'zhe', 'guo', 'a', 'ya', 'na', 'chu lai', 'qi lai'}
WORD_FIELDS = ['id', 'hanzi', 'pinyin', 'spoken', 'hanviet', 'level', 'pos', 'senses', 'collocations', 'examples', 'image', 'parts', 'components']

class Reject(Exception):
    def __init__(self, hz, errs):
        super().__init__(f'{hz}: {"; ".join(errs)}')
        self.hz, self.errs = hz, errs

def sid(x):
    return f's-w-{x["tatoeba"]}' if x.get('tatoeba') else 's-w-ai-' + hashlib.sha1(x['hz'].encode()).hexdigest()[:8]

def py_errors(py):
    errs = []
    if re.search(r'\d', py):
        errs.append('pinyin có chữ số')
    if re.search('[\u2e80-\u2fdf]', py):
        errs.append('pinyin có bộ thủ')
    if not MARKED & set(py.lower()) and ' '.join(re.sub(r'[^\w ]', '', py).lower().split()) not in NEUTRAL:
        errs.append('pinyin thiếu dấu thanh')
    return [f'{e} "{py}"' for e in errs]

TONES = '̄́̌̀'

def canon(py, readings):
    """The source reading the model's pinyin names: spacing is ignored, a toneless source vowel accepts any tone, a dropped erhua r is accepted; a single-reading word also tolerates tone sandhi; an exact match wins."""
    got = unicodedata.normalize('NFC', py.lower()).replace(' ', '')
    flat = {r['pinyin']: unicodedata.normalize('NFC', r['pinyin'].lower()).replace(' ', '') for r in readings}
    for want in flat.items():
        if want[1] == got:
            return want[0]
    def loose(w):
        return ''.join('[' + c + ''.join(unicodedata.normalize('NFC', c + t) for t in TONES) + ']' if c in 'aeiouü' else re.escape(c) for c in w)
    for name, want in flat.items():
        if re.fullmatch(loose(want), got) or (want.endswith('r') and re.fullmatch(loose(want[:-1]), got)):
            return name
    plain = lambda w: ''.join(c for c in unicodedata.normalize('NFD', w) if not unicodedata.combining(c))
    if len(flat) == 1:  # tone sandhi (yī → yí): nothing else it could be
        name, want = next(iter(flat.items()))
        if plain(want).rstrip('r') == plain(got).rstrip('r'):
            return name

def check(e, cands, hz, readings):
    texts = {i: t for r in readings for i, t in r['senses'].items()}
    used = {i for r in e['readings'] for g in r['groups'] for s in g['senses'] for i in s.get('src', [])}
    dropped = {d['id'] for d in e.get('dropped', [])}
    errs = [f'thiếu nghĩa {i} "{t}"' for i, t in texts.items() if i not in used | dropped]
    errs += [f'lý do lạ {d.get("why")}' for d in e.get('dropped', []) if d.get('why') not in REASONS]
    seen = set()
    for r in e['readings']:
        if not canon(r['pinyin'], readings):
            errs.append(f'âm đọc lạ {r["pinyin"]}')
        for g in r['groups']:
            if g['pos'] not in POS_VI:
                errs.append(f'từ loại lạ {g["pos"]}')
            for s in g['senses']:
                if not isinstance(s.get('vi'), str) or not s['vi'].strip():
                    errs.append('nghĩa thiếu "vi"')
                    continue
                if not s.get('core') and (not s.get('src') or any(i not in texts for i in s['src'])):
                    errs.append(f'nghĩa "{s["vi"]}" không có nguồn')
                x = s.get('ex') or {}
                if not isinstance(x.get('py'), str) or not isinstance(x.get('vi'), str):
                    errs.append(f'ví dụ của "{s["vi"]}" thiếu "py" hoặc "vi"')
                    continue
                if x.get('tatoeba') and x['tatoeba'] not in cands:
                    errs.append(f'câu {x["tatoeba"]} không có trong danh sách')
                    continue
                if not x.get('tatoeba') and not x.get('ai'):
                    errs.append(f'ví dụ của "{s["vi"]}" thiếu nguồn')
                    continue
                text = cands[x['tatoeba']]['zh'] if x.get('tatoeba') else x.get('hz') or ''
                if hz not in text:
                    errs.append(f'ví dụ của "{s["vi"]}" không chứa {hz}')
                if g['pos'] == 'Lượng từ' and len(hz) == 1 and any(texts[i].lower().startswith('classifier') for i in s['src']) and not re.search(f'[0-9０-９一二两三四五六七八九十几这那每半百千万]{hz}', text):
                    errs.append(f'ví dụ của lượng từ "{s["vi"]}" phải có số từ + 「{hz}」 đếm đúng danh từ đó')
                if g['pos'] == 'Lượng từ' and re.match(r'(?i)\s*(lượng từ|classifier)', s['vi']):
                    errs.append(f'nghĩa lượng từ "{s["vi"]}" chép nguyên từ CC-CEDICT: nêu đếm cái gì')
                if x.get('ai') and not x.get('tatoeba') and len(re.findall(r'[\u4e00-\u9fff]', text)) > 12:
                    errs.append(f'câu AI của "{s["vi"]}" dài quá 12 chữ')
                if sid({**x, 'hz': text}) in seen:
                    errs.append(f'câu "{text}" dùng cho hai nghĩa')
                seen.add(sid({**x, 'hz': text}))
                errs += [f'{err} (ví dụ của "{s["vi"]}")' for err in py_errors(x.get('py') or '')]
    return errs

MAIN_OVERRIDE = {  # dict.json's first reading is a rare or unmarked one for these
    '着': 'zhe', '起来': 'qǐ lai', '雨': 'yǔ', '看': 'kàn', '和': 'hé', '行': 'xíng', '差': 'chà', '累': 'lèi', '吧': 'ba',
    '地方': 'dì fang', '页': 'yè'}

def main_reading(hz, readings):
    """The reading that gets the plain-hanzi id: the table above, else the reading with most common senses (告诉 gào su, not the legal gào sù), a tie going to dict.json's reading, then source order."""
    if hz in MAIN_OVERRIDE:
        return MAIN_OVERRIDE[hz]
    dict_py = DICT[hz][1].lower()
    common = lambda r: sum(bool(s.get('common')) for g in r['groups'] for s in g['senses'])
    return max(readings, key=lambda r: (common(r), r['pinyin'].lower() == dict_py))['pinyin'].lower()

HINT_POS = {'n': 'Danh từ', 'v': 'Động từ', 'a': 'Tính từ', 'd': 'Phó từ', 'q': 'Lượng từ'}

VOWELS = 'aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
SYLLABLE = re.compile(rf'(?:[zcs]h|[bpmfdtnlgkhjqxrzcsyw])?[{VOWELS}]+(?:ng|n|r)?(?![{VOWELS}])', re.I)
PUNCT = {'，': ',', '。': '.', '？': '?', '！': '!', '、': ',', '；': ';', '：': ':', '“': '"', '”': '"', '…': '...'}
CJK = re.compile(r'[\u3400-\u9fff]')

def normalize_py(hz, py):
    """Citation pinyin (the importer derives sandhi): 一/不 un-sandhied, syllables joined per word as jieba cuts the hanzi, punctuation ASCII. Unchanged when syllables and hanzi do not line up."""
    syls = SYLLABLE.findall(unicodedata.normalize('NFC', py))
    chars = CJK.findall(hz)
    if len(syls) != len(chars):
        return py
    for i, (c, y) in enumerate(zip(chars, syls)):
        if c == '一' and y.lower() in ('yí', 'yì'):
            syls[i] = y[0] + 'ī'
        elif c == '不' and y.lower() == 'bú':
            syls[i] = y[0] + 'ù'
    out, k = '', 0
    for tok in jieba.lcut(hz):
        n = len(CJK.findall(tok))
        if n:
            word = ''
            for y in syls[k:k + n]:
                word += ("'" if word and y[0].lower() in 'aoe' else '') + y
            out += (' ' if out and not out.endswith(' ') else '') + word
            k += n
        else:
            out += ''.join(PUNCT.get(c, c) for c in tok if not c.isspace())
    return out[:1].upper() + out[1:]

HANVIET_FIX = {'冷': 'lãnh', '读': 'độc', '拿': 'nã', '最': 'tối', '爸': 'bả', '妈': 'ma'}  # dict.json holds the native word for these

def hanviet(hz, value):
    parts = value.split()
    if len(parts) != len(hz):
        return HANVIET_FIX[hz] if hz in HANVIET_FIX else value
    return ' '.join(HANVIET_FIX.get(c, p) for c, p in zip(hz, parts))

def hanviet_dupes(w):
    """A Hán Việt equal to one of the word's own Vietnamese glosses is usually the native word, not the Sino-Vietnamese reading."""
    glosses = {re.sub(r'\(.*?\)', '', s['vi']).strip().lower() for s in w['senses']}
    return w['hanviet'].lower() in glosses

def pos_gaps(hz, e):
    """HSK list POS hints with no group in any reading: a core sense CC-CEDICT omits (真的 is also an adjective) may be missing."""
    have = {g['pos'] for r in e['readings'] for g in r['groups']}
    return [HINT_POS[p] for p in HSK[hz].get('p', []) if p in HINT_POS and HINT_POS[p] not in have]

def audit(hz, e, llm, readings):
    """A second opinion on the finished entry: unnatural examples and senses starred rare that are everyday meanings."""
    rows = [{'id': f'{ri}.{gi}.{si}', 'pos': g['pos'], 'vi': s['vi'], 'rare': not s.get('common'), 'hz': s['ex'].get('hz') or '', 'py': s['ex'].get('py')}
            for ri, r in enumerate(e['readings']) for gi, g in enumerate(r['groups']) for si, s in enumerate(g['senses'])]
    for row, (r, g, s) in zip(rows, [(r, g, s) for r in e['readings'] for g in r['groups'] for s in g['senses']]):
        if s['ex'].get('tatoeba'):
            row['hz'] = '(Tatoeba, đã duyệt)'
    out = llm(f"""Kiểm tra mục từ 「{hz}」 cho người Việt học tiếng Trung. Mỗi dòng: một nghĩa, cờ rare (nghĩa hiếm), một câu ví dụ.
{json.dumps(rows, ensure_ascii=False)}
Nghĩa gốc CC-CEDICT và bản dịch cvdict_vi để đối chiếu: {json.dumps(readings, ensure_ascii=False)}
Trả về JSON {{"bad_example":[{{"id":"...","why":"..."}}],"common":["id",...],"bound":["id",...],"missing":[{{"pos":"...","vi":"..."}}]}}.
- bad_example: câu tiếng Trung không tự nhiên, dùng từ ghép không có thật (ví dụ 本干), từ văn ngôn làm câu thay thế, hoặc không minh hoạ đúng nghĩa. Bỏ qua dòng (Tatoeba).
- common: id của nghĩa đang rare=true nhưng thực ra người học gặp thường xuyên trong lời nói hằng ngày. Chỉ liệt kê khi chắc chắn.
- bound: id của nghĩa chỉ dùng trong một số kết cấu cố định hoặc chỉ ở dạng phủ định/nghi vấn, không đứng độc lập được (ví dụ 用 "cần phải" chỉ trong 不用; 要 tính từ "quan trọng" chỉ trong 要紧).
- missing: nghĩa CỐT LÕI mà người học gặp rất thường nhưng mục từ chưa có, dù CC-CEDICT không ghi (ví dụ 地方 "chỗ, điểm" trong 有不懂的地方; 真的 tính từ "thật"). Dựa vào cvdict_vi. Chỉ liệt kê khi chắc chắn, tối đa 2.
Không có gì sai → danh sách rỗng.""")
    by_id = {r['id']: r for r in rows}
    bad = [f'ví dụ của "{by_id[b["id"]]["vi"]}" không tự nhiên: {b.get("why", "")}' for b in out.get('bad_example', []) if isinstance(b, dict) and b.get('id') in by_id]
    unstar = {by_id[i]['vi'] for i in out.get('common', []) if i in by_id}
    bound = {by_id[i]['vi'] for i in out.get('bound', []) if i in by_id}
    missing = [f'thiếu nghĩa cốt lõi {m["pos"]} "{m["vi"]}": thêm nó với "src": [], "core": true và ví dụ tự nhiên' for m in out.get('missing', []) if isinstance(m, dict) and m.get('pos') and m.get('vi')]
    return bad + missing, unstar, bound

def entry(hz, rows, llm=ask):
    readings, skipped = source(hz)
    level = DICT[hz][5]
    cands = candidates(hz, level, rows)
    ids = [i for r in readings for i in r['senses']]
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
- Gộp các nghĩa gần đồng nghĩa (CC-CEDICT hay tách bằng dấu phẩy, ví dụ "to get; to obtain; to receive") thành MỘT nghĩa, ghi hết số vào src. Chỉ tách khi người học cần phân biệt.
- Nghĩa tiếng Việt ngắn, tự nhiên (2–8 từ), dịch theo cách người Việt nói, KHÔNG dịch từng chữ (invalid = người ốm lâu năm, không phải "tàn tật"; building = nhà/toà nhà tuỳ ngữ cảnh). Có thể thêm ghi chú trong ngoặc. Sắp nghĩa hay dùng nhất trước.
- "common": true cho mọi nghĩa người học HSK 1–6 hay gặp trong lời nói và văn viết thường ngày, kể cả khi nó chỉ xuất hiện trong cấu trúc hoặc từ ghép thông dụng (少 trong 很少 "hiếm khi", 少来/少废话 "thôi, đừng" là common). false CHỈ cho nghĩa hiếm: văn ngôn, phương ngữ, chuyên ngành, chỉ còn trong thành ngữ cố định, hoặc chỉ dùng làm tên riêng. Căn cứ vào mức độ thường dùng của nghĩa, KHÔNG phải thứ tự trong CC-CEDICT. Không bỏ nghĩa hiếm, chỉ đánh dấu.
- Lượng từ: nghĩa viết bằng từ đếm tiếng Việt kèm (danh từ được đếm), ví dụ 本 "quyển, cuốn (sách)", 杯 "cốc, ly (đồ uống)", 床 "tấm, chiếc (chăn, nệm)"; KHÔNG bắt đầu bằng "lượng từ" hay "classifier for". Ví dụ phải có số từ ngay trước đúng lượng từ 「{hz}」 (一床被子, 三岁), không dùng lượng từ khác (两张床 là sai cho 床).
- Ví dụ: với mỗi nghĩa, chọn câu Tatoeba dùng ĐÚNG nghĩa đó (ghi "tatoeba": id, chép nguyên "hz"), ưu tiên câu ngắn, từ dễ. Một câu chỉ dùng cho một nghĩa.
  Không có câu nào đúng nghĩa → tự viết câu ≤ 12 chữ Hán, từ vựng HSK ≤ {max(level or 3, 2)}, ghi "ai": true. Câu tự viết phải là tiếng Trung hiện đại tự nhiên, dùng 「{hz}」 hoặc một từ ghép CÓ THẬT chứa nó (không bịa từ ghép, không dùng từ văn ngôn làm câu thay thế). Nếu nghĩa chỉ có ở từ không tự nhiên trong lời nói (hoặc ví dụ duy nhất là từ ghép văn ngôn), đưa nghĩa vào "dropped" với lý do "không có ví dụ tự nhiên" thay vì cố viết câu.
  "py": pinyin có dấu, viết liền từng từ (zǒulù, jiàndào, tārén, wǒmen), cách nhau giữa các từ, viết hoa đầu câu; không đánh dấu biến điệu thanh 3-3 (giữ dấu gốc). "vi": dịch tiếng Việt tự nhiên (dựa vào câu Trung, bản tiếng Anh/Việt kèm theo chỉ để hiểu nghĩa).
- "luongtu": lượng từ đi với danh từ này ([] nếu không phải danh từ). "cannghia": tối đa 3 từ gần nghĩa, [] nếu không chắc.

Chỉ trả về JSON:
{{"readings":[{{"pinyin":"...","hanviet":"...","groups":[{{"pos":"Danh từ","senses":[{{"vi":"...","src":["1.0"],"common":true,"ex":{{"tatoeba":"123","hz":"...","py":"...","vi":"..."}}}}]}}]}}],"dropped":[{{"id":"1.5","why":"trùng"}}],"luongtu":[],"cannghia":[]}}"""
    e = llm(prompt)
    errs = check(e, cands, hz, readings)
    unstar, bound = set(), set()
    if not errs:
        bad, unstar, bound = audit(hz, e, llm, readings)
        errs = bad + [f'danh sách HSK gợi ý từ loại "{p}" nhưng chưa có nghĩa nào. Nếu từ có nghĩa cốt lõi này mà CC-CEDICT không ghi (xem cvdict_vi), thêm nó với "src": [] và "core": true; nếu không thì để nguyên' for p in pos_gaps(hz, e)]
    if errs:  # one repair round with the concrete failures
        e = llm(prompt + f"\n\nBản trước cần sửa: {json.dumps(errs, ensure_ascii=False)}. Sửa và trả lại toàn bộ JSON:\n{json.dumps(e, ensure_ascii=False)}")
        errs = check(e, cands, hz, readings)
    if errs:
        raise Reject(hz, errs)
    for r in e['readings']:
        r['pinyin'] = canon(r['pinyin'], readings)
        for g in r['groups']:
            for s in g['senses']:
                x = s['ex']
                if x.get('tatoeba'):  # verbatim source text, not the model's copy
                    x['hz'] = cands[x['tatoeba']]['zh']
                x['py'] = normalize_py(x['hz'], x['py'])
    for r in e['readings']:
        for g in r['groups']:
            for s in g['senses']:
                if s['vi'] in unstar:
                    s['common'] = True
                if s['vi'] in bound:
                    s['common'] = False
    e['core'] = [s['vi'] for r in e['readings'] for g in r['groups'] for s in g['senses'] if s.get('core')]
    main = main_reading(hz, e['readings'])
    e['main'] = main
    for r in list(e['readings']):
        if r['pinyin'].lower() != main and not any(s.get('common') for g in r['groups'] for s in g['senses']):
            e['readings'].remove(r)
            e.setdefault('dropped', []).extend({'id': i, 'why': 'âm hiếm'} for g in r['groups'] for s in g['senses'] for i in s['src'])
    e['stats'] = {'cedict': len(ids), 'xref': len(skipped), 'dropped': len(e.get('dropped', [])),
                  'tatoeba': sum(bool(s['ex'].get('tatoeba')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'ai_ex': sum(bool(s['ex'].get('ai')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'candidates': len(cands)}
    e['readings'].sort(key=lambda r: (r['pinyin'].lower() != main, not any(s.get('common') for g in r['groups'] for s in g['senses'])))
    e['cedict'] = readings
    e['out'] = to_yaml(hz, e)
    return hz, e

def to_yaml(hz, e):
    row = DICT[hz]
    nums = {f['i']['y'].lower(): f['i']['n'] for f in HSK[hz]['f']}
    words, sentences = {}, {}
    for r in e['readings']:
        py = r['pinyin'].lower()
        main = py == e['main']
        wid = hz if main else hz + '-' + ''.join(s if s[-1].isdigit() else s + '5' for s in nums[py].split())
        w = words.setdefault(wid, {'id': wid, 'hanzi': hz, 'pinyin': py,
                                   'hanviet': hanviet(hz, row[3] if py == row[1].lower() else next((v for p, v, _ in row[7] if p.lower() == py), row[3])),
                                   'level': 1, 'pos': [], 'senses': [], 'examples': []})
        for g in r['groups']:
            code = POS_CODE[g['pos']]
            if code not in w['pos']:
                w['pos'].append(code)
            for s in sorted(g['senses'], key=lambda s: not s.get('common')):
                x = s['ex']
                sentences[sid(x)] = {'id': sid(x), 'hanzi': x['hz'], 'pinyin': x['py'], 'vi': x['vi'],
                                     'source': f'tatoeba:{x["tatoeba"]}' if x.get('tatoeba') else 'ai'}
                w['senses'].append({'vi': s['vi'], 'pos': code, **({} if s.get('common') else {'rare': True}), 'example': sid(x)})
                if sid(x) not in w['examples']:
                    w['examples'].append(sid(x))
        w['examples'] = w['examples'][:3]
    return words, sentences

def dump(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(yaml.safe_dump(data, sort_keys=False, allow_unicode=True, width=1000), encoding='utf-8')

def write_out(results):
    out = CACHE / 'out'
    sentences = {s['id']: s for s in (yaml.safe_load((out / 'sentences/hsk1.yaml').read_text(encoding='utf-8')) if (out / 'sentences/hsk1.yaml').exists() else [])}
    for hz, e in results:
        for sub, ext in (('words', 'yaml'), ('src', 'json')):
            for old in [*(out / sub).glob(f'{hz}.{ext}'), *(out / sub).glob(f'{hz}-*.{ext}')]:
                old.unlink()
        words, new = e['out']
        sentences.update(new)
        for wid, w in words.items():
            existing = CONTENT / f'{wid}.yaml'
            if existing.exists():
                old = yaml.safe_load(existing.read_text(encoding='utf-8'))
                hand = [s for s in old.get('senses', []) if 'pos' not in s]
                hand_ex = [x for x in old.get('examples', []) if not x.startswith('s-w-')]
                w = {**w, **{k: old[k] for k in ('image', 'parts', 'components', 'spoken', 'collocations', 'hanviet') if k in old},
                     'senses': hand + w['senses'], 'examples': (hand_ex + [x for x in w['examples'] if x not in hand_ex])[:3]}
            dump(out / 'words' / f'{wid}.yaml', {k: w[k] for k in WORD_FIELDS if k in w})
            nums = {**next(r for r in e['cedict'] if r['pinyin'].lower() == w['pinyin']), 'core': e.get('core', [])}
            (out / 'src').mkdir(parents=True, exist_ok=True)
            (out / 'src' / f'{wid}.json').write_text(json.dumps(nums, ensure_ascii=False, indent=1), encoding='utf-8')
    dump(out / 'sentences/hsk1.yaml', sorted(sentences.values(), key=lambda s: s['id']))

def staged_sha(out):
    h = hashlib.sha256()
    for f in sorted(p for p in out.rglob('*') if p.is_file() and p.parent.name in ('words', 'sentences')):
        h.update(f.relative_to(out).as_posix().encode())
        h.update(f.read_bytes())
    return h.hexdigest()

def review(out, seed, size=20):
    ids = sorted(p.stem for p in (out / 'words').glob('*.yaml'))
    if len(ids) < size:
        print(f'warning: only {len(ids)} staged words, sampling all')
    picked = sorted(random.Random(seed).sample(ids, min(size, len(ids))))
    sentences = {s['id']: s for s in yaml.safe_load((out / 'sentences/hsk1.yaml').read_text(encoding='utf-8'))}
    total = [yaml.safe_load((out / 'words' / f'{i}.yaml').read_text(encoding='utf-8')) for i in ids]
    rare = [sum(bool(s.get('rare')) for s in w['senses']) for w in total]
    lines = [f'# Spot-check sample, seed {seed}', '',
             f'staged-set sha: {staged_sha(out)}', '',
             f'run totals: {len(ids)} word files, {len(sentences)} sentences, rare senses {sum(rare)} in {sum(bool(r) for r in rare)} words', '']
    for i in picked:
        w = yaml.safe_load((out / 'words' / f'{i}.yaml').read_text(encoding='utf-8'))
        lines += [f'### {i} {w["hanzi"]} {w["pinyin"]} · {w.get("hanviet", "")}', '']
        by_pos = {}
        for s in w['senses']:
            by_pos.setdefault(s.get('pos', '-'), []).append(s)
        for pos, senses in by_pos.items():
            lines.append(f'**{pos}**')
            for s in senses:
                x = sentences.get(s.get('example'))
                label = ('Tatoeba #' + x['source'].split(':')[1]) if x and x['source'].startswith('tatoeba:') else 'AI viết'
                lines.append(f'- {"★ " if s.get("rare") else ""}{s["vi"]}' + (f' — {x["hanzi"]} / {x["pinyin"]} / {x["vi"]} ({label})' if x else ''))
            lines.append('')
        src_file = out / 'src' / f'{i}.json'
        if src_file.exists():
            src = json.loads(src_file.read_text(encoding='utf-8'))
            lines += ['CC-CEDICT: ' + '; '.join(f'{k} {v}' for k, v in src['senses'].items()), '']
            if src.get('core'):
                lines += ['Added beyond CC-CEDICT: ' + '; '.join(src['core']), '']
    (out / f'review-{seed}.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'wrote {out / f"review-{seed}.md"} ({len(picked)} entries)')

def promote(out, seed):
    page = out / f'review-{seed}.md'
    if not page.exists() or f'staged-set sha: {staged_sha(out)}' not in page.read_text(encoding='utf-8'):
        print(f'review-{seed}.md is stale or missing', file=sys.stderr)
        sys.exit(2)
    words = sorted((out / 'words').glob('*.yaml'))
    used = {x for f in words for w in [yaml.safe_load(f.read_text(encoding='utf-8'))] for x in [*w.get('examples', []), *(s['example'] for s in w['senses'] if 'example' in s)]}
    sentences = [s for s in yaml.safe_load((out / 'sentences/hsk1.yaml').read_text(encoding='utf-8')) if not s['id'].startswith('s-w-') or s['id'] in used]
    CONTENT.mkdir(parents=True, exist_ok=True)
    for f in words:
        shutil.copy(f, CONTENT / f.name)
    dump(CONTENT.parent / 'sentences/hsk1.yaml', sentences)
    print(f'promoted {len(words)} words, {len(sentences)} sentences')

def main(argv, llm=ask):
    ap = argparse.ArgumentParser(prog='gen-entries.py')
    ap.add_argument('words', nargs='*')
    ap.add_argument('--sample', type=int)
    ap.add_argument('--seed', type=int)
    ap.add_argument('--promote', action='store_true')
    ap.add_argument('--approved', type=int)
    args = ap.parse_args(argv)
    if args.promote and args.approved is None:
        ap.error('--promote needs --approved N')
    if args.sample and args.seed is None:
        ap.error('--sample needs --seed N')
    if args.promote:
        return promote(CACHE / 'out', args.approved)
    if args.sample:
        return review(CACHE / 'out', args.seed, args.sample)
    argv = args.words
    if llm is ask and not os.environ.get('OPENCODE_API_KEY'):
        print('OPENCODE_API_KEY is not set', file=sys.stderr)
        sys.exit(2)
    for name in SOURCES:
        fetch(name)
    HSK.update({e['s']: e for e in json.loads((CACHE / 'complete.min.json').read_text(encoding='utf-8'))})
    hsk1 = {s for s, e in HSK.items() if 'n1' in e['l']} & DICT.keys()
    words = []
    for w in argv or sorted(hsk1):
        if w in hsk1:
            words.append(w)
        else:
            print(f'skip {w}: not in HSK1 list')
    rows = tatoeba()
    done, rejected = [], []
    with ThreadPoolExecutor(8) as pool:
        for w, f in [(w, pool.submit(entry, w, rows, llm)) for w in words]:
            try:
                hz, e = f.result()
                done.append((hz, e))
                print('ok', hz, json.dumps(e['stats'], ensure_ascii=False))
            except Reject as err:
                rejected.append(str(err))
                print('REJECT', err)
            except Exception as err:
                rejected.append(f'{w}: {err!r}')
                print('FAIL', rejected[-1])
    write_out(done)
    for hz, e in done:
        for w in e['out'][0].values():
            if hanviet_dupes(w):
                print(f'warning: {w["id"]} hanviet "{w["hanviet"]}" equals one of its glosses')
    senses = [s for _, e in done for w in e['out'][0].values() for s in w['senses']]
    rare_words = {(hz, w['id']) for hz, e in done for w in e['out'][0].values() if any(s.get('rare') for s in w['senses'])}
    files = sum(len(e['out'][0]) for _, e in done)
    print(f'words {len(words)}, files {files}, rejected {len(rejected)}, tatoeba {sum(e["stats"]["tatoeba"] for _, e in done)} / ai {sum(e["stats"]["ai_ex"] for _, e in done)}, '
          f'rare senses {sum(bool(s.get("rare")) for s in senses)} in {len({hz for hz, _ in rare_words})} words')
    print(f'llm calls {USAGE["calls"]}, tokens in {USAGE["input"]} / out {USAGE["output"]}')
    if rejected:
        print('\n'.join(f'REJECT {r}' for r in rejected))
        sys.exit(1)

if __name__ == '__main__':
    main(sys.argv[1:])
