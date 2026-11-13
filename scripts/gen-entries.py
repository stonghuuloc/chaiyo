#!/usr/bin/env python3
"""Hanzii-style entries: meanings split by part of speech, one example per meaning, classifiers, near-synonyms.

Sources (the LLM edits, it does not invent meanings):
  meanings  CC-CEDICT English senses per reading (HSK list field `m`), numbered; every one must be covered or
            dropped with a reason, checked here. CVDICT Vietnamese senses help the translation.
  POS       HSK list field `p` (hint) → Vietnamese POS labels.
  examples  Tatoeba (CC BY 2.0 FR) simplified sentences that contain the word as a jieba token, with English
            (and Vietnamese when Tatoeba has it). LLM-written example only when no candidate fits, flagged ai.
Output (staging, never content/): .cache/words/out/words/<id>.yaml (Word) + sentences/hsk1.yaml (Sentence[]) + src/<id>.json (numbered CC-CEDICT senses).
Run: OPENCODE_API_KEY=… uv run scripts/gen-entries.py [--level N] [words]   (no words = all HSK 3.0 level N words in dict.json; sources download into .cache/words)
     GEN_PROVIDER=anthropic ANTHROPIC_API_KEY=… uv run scripts/gen-entries.py …   (Claude Haiku instead of opencode)
     GEN_PROVIDER=claude-cli uv run scripts/gen-entries.py …   (Claude Haiku via `claude -p` on the logged-in subscription)"""
import argparse, bz2, functools, hashlib, threading, unicodedata, json, os, random, re, shutil, subprocess, sys, urllib.request, uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from pathlib import Path

import jieba, jieba.posseg as pseg, opencc, yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / 'content/words'
LEVEL = 1  # HSK 3.0 level being generated (--level)
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
HINTS = {}  # GEN_HINTS: {headword: reviewer note appended to that entry's prompt}
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
    hits = [(hardness(toks), len(text), sid, text, tr) for sid, (text, toks, tr) in rows.items() if hz in toks and not re.search(r'[0-9A-Za-z０-９]', text)]
    hits.sort(key=lambda h: (max(h[0], level or 1) > (level or 1) + 1, h[1]))
    return {sid: {'zh': text, **tr} for _, _, sid, text, tr in hits[:n]}

def parse_json(text):
    """The first JSON object in the model's text; trailing text, a second object or a code fence is ignored."""
    return json.JSONDecoder().raw_decode(text[text.index('{'):])[0]

CLAUDE_MODEL = 'claude-haiku-5-5'

@functools.cache
def claude():
    import anthropic
    return anthropic.Anthropic(max_retries=6)

def ask_claude(prompt):
    """GEN_PROVIDER=anthropic: same prompt and JSON parse as opencode, sent to Claude Haiku."""
    res = claude().messages.create(model=CLAUDE_MODEL, max_tokens=16000, output_config={'effort': 'medium'},
                                   messages=[{'role': 'user', 'content': prompt}])
    USAGE['calls'] += 1
    USAGE['input'] += res.usage.input_tokens
    USAGE['output'] += res.usage.output_tokens
    if res.stop_reason in ('refusal', 'max_tokens'):
        raise RuntimeError(f'claude stopped: {res.stop_reason}')
    return parse_json(''.join(b.text for b in res.content if b.type == 'text'))

# Claude Code headless on the logged-in subscription; no tools, MCP, settings or skills keeps the context under 1k tokens
CLAUDE_CLI = ['claude', '-p', '--model', 'haiku', '--system-prompt', 'You answer with JSON only.', '--tools', '',
              '--no-session-persistence', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
              '--setting-sources', '', '--disable-slash-commands', '--output-format', 'json']

def ask_claude_cli(prompt):
    run = subprocess.run(CLAUDE_CLI, input=prompt, capture_output=True, text=True, timeout=600)
    try:
        res = json.loads(run.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(f'claude -p exit {run.returncode}: {(run.stderr or run.stdout)[:300]}') from None
    if run.returncode or res.get('is_error'):
        raise RuntimeError(f'claude -p {res.get("subtype")}: {str(res.get("result"))[:300]}')
    USAGE['calls'] += 1
    USAGE['input'] += res['usage']['input_tokens'] + res['usage'].get('cache_read_input_tokens', 0) + res['usage'].get('cache_creation_input_tokens', 0)
    USAGE['output'] += res['usage']['output_tokens']
    return parse_json(res['result'])

def ask(prompt):
    provider = os.environ.get('GEN_PROVIDER')
    if provider == 'anthropic':
        return ask_claude(prompt)
    if provider == 'claude-cli':
        return ask_claude_cli(prompt)
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
    return parse_json(text)

class Pending(Exception):
    """No answer file yet for a prompt: the prompt was exported to GEN_OFFLINE_DIR/prompts."""

def ask_files(prompt):
    """Offline provider: prompts go to GEN_OFFLINE_DIR/prompts/<sha>.txt, answers come back as GEN_OFFLINE_DIR/answers/<sha>.json (the raw model text)."""
    root = Path(os.environ['GEN_OFFLINE_DIR'])
    key = hashlib.sha256(prompt.encode()).hexdigest()[:16]
    answer = root / 'answers' / f'{key}.json'
    if answer.exists():
        return parse_json(answer.read_text(encoding='utf-8'))
    (root / 'prompts').mkdir(parents=True, exist_ok=True)
    (root / 'prompts' / f'{key}.txt').write_text(prompt, encoding='utf-8')
    raise Pending(key)

def source(hz):
    """Numbered CEDICT senses per reading; cross-reference senses removed up front."""
    row, h = DICT[hz], HSK[hz]
    hv_by_py = {row[1].lower(): row[3], **{p.lower(): v for p, v, _ in row[7]}}
    readings, skipped = [], []
    for fi, f in enumerate(h['f']):
        py = src_pinyin(f['i']['y'])
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

def src_pinyin(y):
    """The HSK list writes an erhua tail with a tone digit (yǒukòngr5); the model and dict.json write yǒukòngr."""
    return re.sub(r'r5\b', 'r', y)

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
    glosses = [re.sub(r'\s*\(.*?\)', '', s['vi']).strip().casefold() for r in e['readings'] for g in r['groups'] for s in g['senses'] if isinstance(s.get('vi'), str)]
    errs += [f'nghĩa "{s["vi"]}" có hai ghi chú "chỉ dùng trong": gộp thành một ghi chú liệt kê đủ các từ ghép' for r in e['readings'] for g in r['groups'] for s in g['senses'] if isinstance(s.get('vi'), str) and s['vi'].count('chỉ dùng trong') > 1]
    errs += [f'hai nghĩa có cùng lời giải thích "{v}": gộp thành một (một nghĩa, một ví dụ)' for v in dict.fromkeys(glosses) if glosses.count(v) > 1]
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
                if g['pos'] == 'Lượng từ' and len(hz) == 1 and any(texts.get(i, '').lower().startswith('classifier') for i in s.get('src', [])) and not re.search(f'[0-9０-９一二两三四五六七八九十几这那每半百千万]{hz}', text):
                    errs.append(f'ví dụ của lượng từ "{s["vi"]}" phải có số từ + 「{hz}」 đếm đúng danh từ đó')
                if g['pos'] == 'Lượng từ' and re.match(r'(?i)\s*(lượng từ|classifier)', s['vi']):
                    errs.append(f'nghĩa lượng từ "{s["vi"]}" chép nguyên từ CC-CEDICT: nêu đếm cái gì')
                if re.search(r'[0-9０-９]', x.get('hz') or '') and not x.get('tatoeba'):
                    errs.append(f'câu AI của "{s["vi"]}" dùng chữ số Ả Rập: viết số bằng chữ Hán')
                chars = CJK.findall(text)
                if len(split_syllables(x.get('py') or '', (len(chars), len(chars) - chars.count('儿')))) not in (len(chars), len(chars) - chars.count('儿')):
                    errs.append(f'pinyin của ví dụ "{s["vi"]}" không khớp số chữ Hán của câu: mỗi chữ một âm tiết, 儿 gộp vào âm trước')
                if any(y.lower().endswith('r') and not re.fullmatch(r'[eēéěè]r', y.lower()) for y in split_syllables(x.get('py') or '')) and '儿' not in text:
                    errs.append(f'pinyin của ví dụ "{s["vi"]}" có âm r (erhua) nhưng câu không có 儿')
                if x.get('ai') and not x.get('tatoeba') and len(re.findall(r'[\u4e00-\u9fff]', text)) > 12:
                    errs.append(f'câu AI của "{s["vi"]}" dài quá 12 chữ')
                if sid({**x, 'hz': text}) in seen:
                    errs.append(f'câu "{text}" dùng cho hai nghĩa')
                seen.add(sid({**x, 'hz': text}))
                errs += [f'{err} (ví dụ của "{s["vi"]}")' for err in py_errors(x.get('py') or '')]
    return errs

MAIN_OVERRIDE = {  # dict.json's first reading is a rare or unmarked one for these
    '着': 'zhe', '起来': 'qǐ lai', '雨': 'yǔ', '看': 'kàn', '和': 'hé', '行': 'xíng', '差': 'chà', '累': 'lèi', '吧': 'ba', '吗': 'ma',
    '地方': 'dì fang', '页': 'yè', '几': 'jǐ', '中': 'zhōng'}

def main_reading(hz, readings):
    """The reading that gets the plain-hanzi id: the table above, else the reading with most common senses (告诉 gào su, not the legal gào sù), a tie going to dict.json's reading, then source order."""
    if hz in MAIN_OVERRIDE:
        return MAIN_OVERRIDE[hz]
    dict_py = DICT[hz][1].lower()
    common = lambda r: sum(bool(s.get('common')) for g in r['groups'] for s in g['senses'])
    return max(readings, key=lambda r: (common(r), r['pinyin'].lower() == dict_py))['pinyin'].lower()

HINT_POS = {'n': 'Danh từ', 'v': 'Động từ', 'a': 'Tính từ', 'd': 'Phó từ', 'q': 'Lượng từ'}

VOWELS = 'aeiouüvāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
SYLLABLE = re.compile(rf'(?:[zcs]h|[bpmfdtnlgkhjqxrzcsyw])?[{VOWELS}]+(?:ng|n)?r?(?![{VOWELS}])', re.I)
SYLLABLE_FULL = re.compile(rf'(?:(?:[zcs]h|[bpmfdtnlgkhjqxrzcsyw])[{VOWELS}]+|[aoeāáǎàōóǒòēéěèAOEĀÁǍÀŌÓǑÒĒÉĚÈ][{VOWELS}]*)(?:ng|n)?r?', re.I)
PUNCT = {'，': ',', '。': '.', '？': '?', '！': '!', '、': ',', '；': ';', '：': ':', '“': '"', '”': '"', '「': '"', '」': '"', '《': '"', '》': '"', '（': '(', '）': ')', '…': '...'}
TONED = set(VOWELS) - set('aeiouüv')
CLASSIFIERS = set('个本张只条件杯瓶些位块双把辆支页岁次点年口家间层碗盘打分元角')
NUMERAL_UNIT = re.compile('[一二两三四五六七八九十百千万零〇半几]+[个本张只条件杯瓶些位块双把辆支页岁次年口家间层碗盘打分元角]')
CJK = re.compile(r'[\u3400-\u9fff]')

SYLLABLES = {re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', y)) for row in DICT.values() for y in re.findall(r'[a-zü\u0300-\u036f]+', unicodedata.normalize('NFD', row[1].lower()))}

def split_syllables(py, want=()):
    """Pinyin syllables, longest first and at most one tone mark each, so 'nǚér' still splits into nǚ + ér when the apostrophe is missing. When the syllable count is ambiguous ('bùnéng' is bù + néng or bùn + éng) a parse with one of the counts in want wins."""
    def bare(parse):  # a syllable outside the dictionary's inventory costs more than a zero-initial one, which only follows an apostrophe: bùnéng is bù néng, Tiānānmén is Tiān ān mén
        plain = lambda y: re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', y.lower()).replace('ü', 'v')).replace('v', 'ü')
        return (sum(plain(y) not in SYLLABLES for y in parse), sum(not re.match(r'[bpmfdtnlgkhjqxrzcsyw]', y, re.I) for y in parse))
    def parses(run):
        memo = {len(run): {0: []}}
        def at(i):
            if i in memo:
                return memo[i]
            out = {}
            for end in range(len(run), i, -1):
                cand = run[i:end]
                erhua_cut = cand[-1] in 'rR' and len(cand) > 1 and run[end:end + 1] and run[end].lower() in VOWELS
                if SYLLABLE_FULL.fullmatch(cand) and sum(ch in TONED for ch in cand.lower()) <= 1 and not erhua_cut:
                    for k, rest in at(end).items():
                        parse = [cand, *rest]
                        if k + 1 not in out or bare(parse) < bare(out[k + 1]):
                            out[k + 1] = parse
            memo[i] = out
            return out
        return at(0) or {1: [run]}
    runs = [parses(r) for r in re.findall(rf"[A-Za-z{VOWELS.replace('v', '')}ÀÁÈÉÌÍÒÓÙÚǍǏǑǓǕǗǙǛĀĒĚĪŌŪ]+", unicodedata.normalize('NFC', py))]
    def pick(i, total):
        if i == len(runs):
            return [] if total in want else None
        for k, parts in runs[i].items():
            rest = pick(i + 1, total + k)
            if rest is not None:
                return [*parts, *rest]
        return None
    chosen = pick(0, 0) if want else None
    return chosen if chosen is not None else [y for r in runs for y in next(iter(r.values()))]

JIEBA_LOCK = threading.RLock()

def set_freq(word, freq=None):
    """Make jieba cut word as one token (freq None: just enough to beat its own pieces) without inflating the corpus total, which add_word and suggest_freq do on every call and which made cuts depend on call order. Returns the old frequency."""
    jieba.dt.initialize()
    old = jieba.dt.FREQ.get(word)
    if freq is None:
        share = 1.0
        for seg in jieba.cut(word, HMM=False):
            share *= jieba.dt.FREQ.get(seg, 1) / jieba.dt.total
        freq = max(int(share * jieba.dt.total) + 1, old or 1)
    jieba.dt.total += freq - (old or 0)
    jieba.dt.FREQ[word] = freq
    for i in range(1, len(word)):
        jieba.dt.FREQ.setdefault(word[:i], 0)
    return old

def collapse_notes(vi):
    """One 'chỉ dùng trong' note per gloss: the compounds of every repeated note, in order, without repeats."""
    m = re.search(r' \(([^()]*)\)$', vi)
    if not m or m.group(1).count('chỉ dùng trong') < 2:
        return vi
    parts, compounds, at = [], [], None
    for piece in (p.strip() for p in m.group(1).split(';')):
        if not piece.startswith('chỉ dùng trong'):
            parts.append(piece)
            continue
        at = len(parts) if at is None else at
        compounds += [c for c in (t.strip() for t in piece[len('chỉ dùng trong'):].split(',')) if c and c not in compounds]
    parts.insert(at, 'chỉ dùng trong ' + ', '.join(compounds))
    return vi[:m.start()] + f' ({"; ".join(parts)})'


def note_compounds(vi):
    """Hanzi compounds named by a 'chỉ dùng trong …' note."""
    return [c for m in re.findall(r'chỉ dùng trong ([^)]*)', vi) for c in re.findall(r'[\u4e00-\u9fff]{2,}', m)]

@contextmanager
def taught(hz, compounds, sentences=()):
    """For one entry only: the headword and its bound-note compounds are single words. A single hanzi that jieba strands next to a longer word (这位|子, 常见|到) is joined to the neighbour's edge character when that is a vocabulary word (位子, 见到)."""
    known = lambda w: w in HSK or w in DICT
    words = {w for w in {hz, *compounds} if len(w) > 1}
    with JIEBA_LOCK:
        jieba.dt.initialize()
        saved = {}
        def teach(ws, strong=False):
            for w in ws - saved.keys():
                saved[w] = set_freq(w, 10**7 if strong else None)
        teach(words)
        try:
            if len(hz) == 1 and hz not in '一不了的着过':
                extra = set()
                for text in sentences:
                    toks = jieba.lcut(text)
                    for i, t in enumerate(toks):
                        if t != hz:
                            continue
                        if i and len(toks[i - 1]) > 1 and known(toks[i - 1][-1] + hz):
                            extra.add(toks[i - 1][-1] + hz)
                        if i + 1 < len(toks) and len(toks[i + 1]) > 1 and known(hz + toks[i + 1][0]):
                            extra.add(hz + toks[i + 1][0])
                teach(extra, True)
            yield
        finally:
            for w, f in saved.items():
                set_freq(w, f or 0)

OVERRIDE = {  # the standard's spelling for headwords the general cut gets wrong; whole-headword match only
    '第二': 'dì-èr', '打电话': 'dǎ diànhuà', '干什么': 'gàn shénme', '没什么': 'méi shénme',
    '开玩笑': 'kāi wánxiào', '下雨': 'xià yǔ', '上车': 'shàng chē', '下车': 'xià chē',
    '没关系': 'méi guānxi', '你好': 'nǐ hǎo', '星期天': 'xīngqītiān', '星期日': 'xīngqīrì',
    **{'星期' + d: 'xīngqī' + y for d, y in zip('一二三四五六', ['yī', 'èr', 'sān', 'sì', 'wǔ', 'liù'])},
}

def flat_py(py):
    return re.sub(r"[\s'’-]", '', py.lower())

def normalize_py(hz, py, classifiers=(), capital=True, override=None):
    if override and hz in override:
        return override[hz]
    py = re.sub(r'\s+r\b', 'r', py)  # the source writes the erhua tail as its own syllable: nǎ r -> nǎr
    units = {m.group(0) for m in NUMERAL_UNIT.finditer(hz)}  # 六十分 must not cut as 六 + 十分, for this sentence only
    with JIEBA_LOCK:
        saved = {w: set_freq(w) for w in units}
        try:
            return cut_py(hz, py, classifiers, capital)
        finally:
            for w, f in saved.items():
                set_freq(w, f or 0)

def drop_false_apostrophes(py):
    """An apostrophe stays only when both syllables around it exist: bàng'ōngshì (ōng) and niún'ǎi (niún) were splitter slips, dá'àn is real."""
    plain = lambda y: re.sub(r'[\u0300-\u036f]', '', unicodedata.normalize('NFD', y.lower())).replace('v', 'ü')
    chunks, out = re.split(r"['’]", py), ''
    for i, chunk in enumerate(chunks):
        if i:
            last = split_syllables(re.findall(r'[^\W\d_]+$', chunks[i - 1])[-1])[-1] if re.search(r'[^\W\d_]$', chunks[i - 1]) else ''
            first = split_syllables(re.match(r'[^\W\d_]+', chunk).group(0))[0] if re.match(r'[^\W\d_]', chunk) else ''
            out += "'" if plain(last) in SYLLABLES and plain(first) in SYLLABLES else ''
        out += chunk
    return out

def cut_py(hz, py, classifiers, capital=True):
    py = drop_false_apostrophes(py)
    """Citation pinyin (the importer derives sandhi): 一/不 un-sandhied, syllables joined per word as jieba cuts the hanzi, punctuation ASCII. Unchanged when syllables and hanzi do not line up. classifiers: the entry's own headword when it is a measure word, so 一出戏 is yīchū xì."""
    chars = CJK.findall(hz)
    syls = split_syllables(py, (len(chars), len(chars) - chars.count('儿')))
    erhua = len(syls) != len(chars) and len(syls) == len(chars) - chars.count('儿')
    if erhua:
        chars = [c for c in chars if c != '儿']
    elif len(syls) != len(chars):
        return py
    for i, (c, y) in enumerate(zip(chars, syls)):
        if c == '一' and y.lower() in ('yí', 'yì'):
            syls[i] = y[0] + 'ī'
        elif c == '不' and y.lower() == 'bú':
            syls[i] = y[0] + 'ù'
    toks = []
    for t in pseg.lcut(hz):  # an HMM-only token (雨和雪, 二加) that holds a function word or numeral is cut again from the dictionary
        if len(t.word) > 1 and not jieba.dt.FREQ.get(t.word) and re.search('[和与跟同及的了着过在是有不也都就还又加减乘除等一二三四五六七八九十百千万两零]', t.word):
            toks += [(u.word, u.flag) for u in pseg.lcut(t.word, HMM=False)]
        else:
            toks.append((t.word, t.flag))
    split = []
    for i, (w, f) in enumerate(toks):
        if w == '的话' and not (i + 1 < len(toks) and toks[i + 1][0] in '，,'):  # 的话 is a unit only when conditional
            split += [('的', 'u'), ('话', 'n')]
        elif split and (split[-1][1].startswith('m') or split[-1][0] in '这那哪每几') and len(w) > 1 and w[0] in CLASSIFIERS and w not in DICT and w not in HSK:  # 这|本书: the classifier is not part of the noun
            split += [(w[0], 'q'), (w[1:], f)]
        elif len(w) > 2 and w[0] in '这那哪每' and w[1] in CLASSIFIERS and w not in DICT and w not in HSK and w[1:] not in HSK and w[1:] not in DICT:  # 那本书 as one token
            split += [(w[0], 'r'), (w[1], 'q'), (w[2:], f)]
        elif len(w) > 2 and w[0] in '这那哪每几' and w[1] in CLASSIFIERS and w not in DICT and w not in HSK:  # 每|分钟: the rest is a word of its own
            split += [(w[0], 'm' if w[0] == '几' else 'r'), (w[1:], f)]
        elif len(w) > 2 and w[0] == '几' and w[1] in CLASSIFIERS and w not in DICT and w not in HSK and w[1:] not in HSK and w[1:] not in DICT:
            split += [(w[0], 'm'), (w[1], 'q'), (w[2:], f)]
        elif w == '们' and split and re.fullmatch(r'[\u4e00-\u9fff]+', split[-1][0]):  # 工人|们 is one word
            split[-1] = (split[-1][0] + w, split[-1][1])
        else:
            split.append((w, f))
    units = []  # [text, syllable count, is_word, flag]
    c = 0  # syllables consumed
    toned = lambda i: any(ch in TONED for ch in syls[i].lower())
    count = lambda t: len(CJK.findall(t.replace('儿', '') if erhua else t))
    for w, f in split:
        if erhua and w == '儿':
            continue
        n = count(w)
        if not n:
            units.append([w, 0, False, f])
            continue
        pieces = [(w, f)]
        if n > 1 and w not in DICT:
            if w[0] in '我你他她它别' and w not in ('我们', '你们', '他们', '她们', '它们'):
                pieces = [(w[0], 'r'), (w[1:], f)]
            elif w[0] == '一' and len(w) > 2 and w[1] in classifiers:  # 一出戏: numeral + the headword classifier is one word, the noun is another
                pieces = [(w[:2], 'm'), (w[2:], f)]
            elif w[-1] == '一' or (w[0] == '一' and w[1] not in CLASSIFIERS and w[1] not in '下会些起共定样直般边半百千万亿零两二三四五六七八九十'):  # 天一黑, 一醒: 一 is its own word
                pieces = [(w[:-1], f), ('一', 'm')] if w[-1] == '一' else [('一', 'm'), (w[1:], f)]
            elif w[-1] in '着了的过' and toned(c + n - 1) and w not in HSK:  # a full-tone 着 (zháo) is a verb, not the particle; 错过, 经过, 通过 are words
                pieces = [(w[:-1], f), (w[-1], 'x')]
        for pw, pf in pieces:
            pn = count(pw)
            prev = units[-1] if units else None
            complement = pw == '着' and toned(c) and prev and prev[2] and prev[3].startswith('v') and prev[1] == 1  # 冻着, 猜着, 找着: zháo joins the verb
            particle = pw in ('的', '了', '着', '过') and prev and prev[2] and not toned(c) or complement
            classifier = pf.startswith('q') and prev and prev[2] and prev[3].startswith('m')
            if particle or classifier:
                prev[1] += pn
                prev[3] = pf
            else:
                units.append([pw, pn, True, pf])
            c += pn
    out, k, opened, straight = '', 0, False, False
    for text, n, is_word, _ in units:
        if is_word:
            word = ''
            for y in syls[k:k + n]:
                glue = ' ' if word.endswith('r') and not re.search(r'(?i)(^|[^a-z])[eēéěè]r$', word) else ("'" if word and unicodedata.normalize('NFD', y[0].lower())[0] in 'aoe' else '')
                word += (glue if word else '') + y
            out += (' ' if out and not out.endswith(' ') and not opened else '') + word
            opened = False
            k += n
        else:
            for c in text:
                if c.isspace():
                    continue
                if c == '"':
                    straight = not straight
                if c in '“「《（(' or (c == '"' and straight):
                    out += (' ' if out and not out.endswith(' ') else '') + PUNCT.get(c, c)
                    opened = True
                else:
                    out += PUNCT.get(c, c)
    return (out[:1].upper() + out[1:]) if capital else out

HANVIET_FIX = {'喝': 'hát', '女': 'nữ', '冷': 'lãnh', '读': 'độc', '拿': 'nã', '最': 'tối', '爸': 'bả', '妈': 'ma', '哭': 'khốc', '爬': 'bà', '油': 'du', '层': 'tằng'}  # dict.json holds the native word for these

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

MUST_HAVE = {  # core senses of the most polysemous HSK 1 words; the audit must see each one covered
    '就': ['Phó từ: ngay, liền (我马上就来)', 'Phó từ: chỉ, vừa đúng (就一个)', 'Liên từ/Phó từ: thì (他不是在家就是在学校)'],
    '地方': ['Danh từ: chỗ, nơi', 'Danh từ: chỗ, điểm (有不懂的地方)'],
    '还有': ['Liên từ: ngoài ra, và còn', 'Động từ: còn có'],
    '还': ['Phó từ: vẫn, còn', 'Phó từ: còn, hơn nữa', 'Động từ: trả lại (还-huan2)'],
    '都': ['Phó từ: đều, tất cả', 'Phó từ: đã (都十点了)'],
    '才': ['Phó từ: mới, vừa mới', 'Phó từ: mãi mới, đến khi'],
    '也': ['Phó từ: cũng'], '又': ['Phó từ: lại, lần nữa (đã xảy ra)', 'Phó từ: vừa ... vừa'],
    '在': ['Giới từ: ở, tại', 'Phó từ: đang', 'Động từ: ở, có mặt'],
    '给': ['Động từ: cho, đưa (nghĩa phải có từ "cho": 给我一本书)', 'Giới từ: cho, giúp (làm việc gì cho ai), để'],
    '让': ['Động từ: để, cho phép', 'Động từ: bảo, khiến'], '叫': ['Động từ: gọi, tên là', 'Động từ: bảo, khiến'],
    '会': ['Động từ: biết (kỹ năng)', 'Động từ: sẽ, có thể xảy ra', 'Danh từ: cuộc họp'],
    '能': ['Động từ: có thể (khả năng)', 'Động từ: được phép'],
    '可以': ['Động từ: có thể, được phép'], '要': ['Động từ: muốn', 'Động từ: cần, phải', 'Phó từ: sắp, sẽ'],
    '得': ['Động từ: phải (děi)', 'Trợ từ: bổ ngữ (de)'], '了': ['Trợ từ: hoàn thành', 'Trợ từ: tình huống mới'],
    '过': ['Trợ từ: đã từng', 'Động từ: qua, đi qua'], '对': ['Tính từ: đúng', 'Giới từ: đối với, với'],
    '跟': ['Giới từ: với, cùng', 'Động từ: theo'], '从': ['Giới từ: từ'], '到': ['Động từ: đến', 'Bổ ngữ: được, tới (kết quả)'],
    '说': ['Động từ: nói'], '看': ['Động từ: xem, nhìn', 'Động từ: thăm, khám (看病)', 'Động từ: cho rằng', 'Động từ: trông, canh (kān: 看孩子, 看门)'],
    '想': ['Động từ: nghĩ', 'Động từ: muốn', 'Động từ: nhớ'], '好': ['Tính từ: tốt', 'Phó từ: rất, thật (好大)', 'Bổ ngữ: xong'],
    '有': ['Động từ: có', 'Động từ: có (tồn tại)'], '点': ['Danh từ: giờ', 'Lượng từ: chút, ít (一点)', 'Danh từ: điểm'],
    '些': ['Lượng từ: một vài, những'], '没': ['Phó từ: chưa, không (没有)'], '用': ['Động từ: dùng, sử dụng'],
    '开': ['Động từ: mở', 'Động từ: lái (xe) (开车)', 'Động từ: bật, vận hành (máy)'], '很': ['Phó từ: rất'], '打': ['Động từ: đánh', 'Động từ: gọi (điện thoại)', 'Động từ: chơi (bóng)'],
    '多': ['Tính từ: nhiều', 'Phó từ: bao nhiêu, mấy (多大)'], '下': ['Danh từ: dưới', 'Động từ: xuống', 'Lượng từ: lần (一下)'],
    '上': ['Danh từ: trên', 'Động từ: lên'], '把': ['Giới từ: 把 (đưa tân ngữ lên trước)'],
    '做': ['Động từ: làm'], '的': ['Trợ từ: của, định ngữ'],
}

def standins(hz, e, bound):
    # AI examples for a single hanzi must show it on its own, not only inside a longer compound (要是 for 要, 就算 for 就)
    if len(hz) != 1:
        return []
    with JIEBA_LOCK:  # entry runs in a pool; another thread's taught() changes FREQ
        return [f'ví dụ của "{s["vi"]}" chỉ có từ ghép chứa 「{hz}」: viết lại câu với 「{hz}」 đứng riêng (không dùng từ ghép khác thay thế)'
                for r in e['readings'] for g in r['groups'] for s in g['senses']
                if s['ex'].get('ai') and not s['ex'].get('tatoeba') and g['pos'] != 'Lượng từ' and s['vi'] not in bound and 'chỉ dùng trong' not in s['vi']
                and hz not in jieba.lcut(s['ex'].get('hz') or '')
                and not (hz in '百千万' and ('一' + hz) in (s['ex'].get('hz') or ''))]

def audit(hz, e, llm, readings):
    """A second opinion on the finished entry: unnatural examples and senses starred rare that are everyday meanings."""
    texts = {i: t for r in readings for i, t in r['senses'].items()}
    rows = [{'id': f'{ri}.{gi}.{si}', 'pos': g['pos'], 'vi': s['vi'], 'rare': not s.get('common'), 'hz': s['ex'].get('hz') or '', 'py': s['ex'].get('py'),
             **({'bound_form': True} if s.get('src') and all(texts.get(i, '').lower().startswith('(bound form)') for i in s['src']) else {})}
            for ri, r in enumerate(e['readings']) for gi, g in enumerate(r['groups']) for si, s in enumerate(g['senses'])]
    for row, (r, g, s) in zip(rows, [(r, g, s) for r in e['readings'] for g in r['groups'] for s in g['senses']]):
        if s['ex'].get('tatoeba'):
            row['hz'] = '(Tatoeba, đã duyệt)'
    out = llm(f"""Kiểm tra mục từ 「{hz}」 cho người Việt học tiếng Trung. Mỗi dòng: một nghĩa, cờ rare (nghĩa hiếm), một câu ví dụ.
{json.dumps(rows, ensure_ascii=False)}
Nghĩa gốc CC-CEDICT và bản dịch cvdict_vi để đối chiếu: {json.dumps(readings, ensure_ascii=False)}
{('Nghĩa BẮT BUỘC phải có trong mục từ này (liệt kê vào missing nếu thiếu): ' + json.dumps(MUST_HAVE[hz], ensure_ascii=False)) if hz in MUST_HAVE else ''}
Trả về JSON {{"bad_example":[{{"id":"...","why":"..."}}],"common":["id",...],"bound":[{{"id":"...","pattern":"不用"}}],"duplicate":[{{"id":"...","of":"id của nghĩa giống hệt"}}],"missing":[{{"pos":"...","vi":"..."}}]}}.
- bad_example: câu tiếng Trung không tự nhiên, dùng từ ghép không có thật (ví dụ 本干), từ văn ngôn, hoặc từ ghép khác thay cho chính chữ đó (要是 thay cho 要, 就算 thay cho 就), hoặc không minh hoạ đúng nghĩa. Trong "why" nêu rõ dạng đúng: câu phải chứa 「{hz}」 đứng riêng hoặc trong cấu trúc thông dụng của nó. Cũng là bad_example: nghĩa chỉ có nhờ một từ khác trong câu hoặc vị trí bổ ngữ (一整晚 là nhờ 整, 他脑子转得快 là bổ ngữ mức độ, 他的前途 chỉ có trong từ ghép 前途 mà không có ghi chú) hoặc câu dùng chữ ở âm đọc khác với nghĩa đang kiểm tra (看 kàn thay cho kān), hoặc nghĩa do chữ kế bên gánh (到银行去: "đi" là nhờ 去; 多出不少: "nhiều hơn" là nhờ 多), hoặc nghĩa tiếng Anh dịch sát chữ (single → duy nhất, almost → suýt, "in sports or games" → thi đấu khi câu là điểm thi); nghĩa tiếng Việt dịch theo từ tiếng Anh mơ hồ của CC-CEDICT chứ không theo cách dùng trong câu (quite → khá thay vì rất, boil → đun sôi thay vì sôi, get along → hợp nhau thay vì sống qua ngày), hoặc không khớp tự/tha động từ; câu mà nghĩa đang minh hoạ do một từ khác gánh (显示出来 không minh hoạ 出来 "nảy sinh"; 碰着/淋着 là bổ ngữ, không minh hoạ 着 zháo "chạm"), hoặc câu ghép từ chưa chuẩn (算盘 phải là 打算盘). Bỏ qua dòng (Tatoeba).
- common: id của nghĩa đang rare=true nhưng thực ra người học gặp thường xuyên trong lời nói hằng ngày. Chỉ liệt kê khi chắc chắn.
- bound: nghĩa thông dụng nhưng chỉ dùng trong một kết cấu cố định, phủ định hoặc nghi vấn, không đứng độc lập được (用 "cần" chỉ trong 不用 hoặc câu hỏi; 要 "quan trọng" chỉ trong 要紧). Nghĩa chỉ có trong một từ ghép cụ thể (去 "ngoái" chỉ trong 去年) cũng là bound; nghĩa uyển ngữ, văn chương hoặc chuyên ngành (去 "qua đời", 冬天去了; 元 "ẩn" trong 一元方程) phải rare, không phải bound. Ghi chú bound phải đúng với MỌI nửa của nghĩa (哪儿 "bất cứ đâu" chỉ trong 哪儿都…; "đâu đó" trong 好像在哪儿见过 là nghĩa khác, tách riêng và không có ghi chú), bằng tiếng Việt, ngăn cách bằng ", ", không dùng 等 「」 反问. Ghi "pattern" liệt kê ĐỦ các kết cấu chính (少 shào "trẻ": 少年, 少女, 年少; 热 "nhiệt tình": 热情, 热心; 着 "sốt ruột": 着急, 着凉), không chỉ một ví dụ. Nghĩa là cách dùng chính sau động từ (V+出来: 拿出来, 想出来) KHÔNG phải bound. Nghĩa kiểu này KHÔNG phải nghĩa hiếm.
- bound_form: dòng có bound_form=true là nghĩa CC-CEDICT ghi "(bound form)" (chỉ có trong từ ghép: 和 "Nhật Bản" trong 和服, 和 "hài hòa" trong 和谐). Nghĩa đó phải nằm trong bound với pattern đủ (và nếu là nghĩa chuyên ngành hay văn chương thì cũng phải rare).
- duplicate: nghĩa chỉ là cách nói khác của một nghĩa có sẵn (东边 "phía đông" và "ở phía đông của"; 快 "sắp" và "suýt"): ghi id của nghĩa thừa và id của nghĩa giữ lại.
- missing: nghĩa CỐT LÕI mà người học gặp rất thường nhưng mục từ chưa có, dù CC-CEDICT không ghi (ví dụ 地方 "chỗ, điểm" trong 有不懂的地方; 真的 tính từ "thật"). Dựa vào cvdict_vi. Chỉ liệt kê khi chắc chắn, tối đa 2.
Không có gì sai → danh sách rỗng.""")
    by_id = {r['id']: r for r in rows}
    bad = [f'ví dụ của "{by_id[b["id"]]["vi"]}" không tự nhiên: {b.get("why", "")}' for b in out.get('bad_example', []) if isinstance(b, dict) and b.get('id') in by_id]
    unstar = {by_id[i]['vi'] for i in out.get('common', []) if i in by_id}
    bound = {by_id[b['id']]['vi']: b.get('pattern') for b in out.get('bound', []) if isinstance(b, dict) and b.get('id') in by_id and b.get('pattern')}
    boundless = [f'nghĩa "{r["vi"]}" lấy từ dòng "(bound form)" của CC-CEDICT nhưng chưa có ghi chú: thêm "(chỉ dùng trong …)" liệt kê các từ ghép chính, hoặc bỏ nghĩa vào dropped nếu không có ví dụ tự nhiên'
                 for r in rows if r.get('bound_form') and r['vi'] not in bound and 'chỉ dùng trong' not in r['vi']]
    dup = {by_id[d['id']]['vi']: by_id[d['of']]['vi'] for d in out.get('duplicate', []) if isinstance(d, dict) and d.get('id') in by_id and d.get('of') in by_id and d['id'] != d['of']}
    missing = [f'thiếu nghĩa cốt lõi {m["pos"]} "{m["vi"]}": thêm nó với "src": [], "core": true và ví dụ tự nhiên' for m in out.get('missing', []) if isinstance(m, dict) and m.get('pos') and m.get('vi')]
    return bad + missing + boundless, unstar, bound, dup

def merge_senses(hz, readings, merge):
    """Fold CC-CEDICT senses that mean the same thing into one numbered sense before the model translates them."""
    out = json.loads(json.dumps(readings))
    answer = merge(f"""Mục từ 「{hz}」. Dưới đây là các nghĩa CC-CEDICT (đánh số).
{json.dumps([{'pinyin': r['pinyin'], 'senses': r['senses']} for r in readings], ensure_ascii=False)}
Gộp các nghĩa CÙNG MỘT nghĩa (đồng nghĩa, chỉ khác cách diễn đạt, như "left side" và "the left", "to get" và "to obtain") thành một nhóm. Không gộp nghĩa khác từ loại hoặc khác ngữ cảnh. Chỉ trả về JSON {{"groups": [["0.0", "0.1"], ...]}}, chỉ ghi nhóm có từ 2 số trở lên, các số trong nhóm cùng một cách đọc.""")
    seen = set()
    for group in answer.get('groups', []) if isinstance(answer, dict) else []:
        if not isinstance(group, list) or len(group) < 2 or len({i.split('.')[0] for i in group if isinstance(i, str)}) != 1:
            continue
        for r in out:
            texts = r['senses']
            if all(isinstance(i, str) and i in texts and i not in seen for i in group):
                texts[group[0]] = ' / '.join(texts[i] for i in group)
                for i in group[1:]:
                    del texts[i]
                seen.update(group)
    return out

def entry(hz, rows, llm=ask, merge=None):
    readings, skipped = source(hz)
    merge = merge or (llm if llm in (ask, ask_files) else None)
    before = sum(len(r['senses']) for r in readings)
    if merge:
        readings = merge_senses(hz, readings, merge)
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
- Nghĩa động từ KHÔNG chứa tân ngữ trong chính nó: viết "lấy, múc (nước)", "thắt, buộc (nút, dây)", không viết "đi lấy nước". Tân ngữ thường gặp đặt trong ngoặc. Không chép nguyên cvdict_vi hay dịch từng chữ từ tiếng Anh: nếu tiếng Việt đã bao hàm ý (cơm = cooked rice) thì dùng từ đơn ("cơm", không phải "cơm đã nấu"; "vé xe, vé tàu", không phải "vé xe buýt hoặc tàu hỏa").
- Từ tiếng Anh mơ hồ trong CC-CEDICT (quite, boil, get along, to issue…) KHÔNG dùng để dịch: dịch theo cách dùng tiếng Trung đúng trong câu ví dụ. Ví dụ 很 "quite" = "rất" (không phải "khá"); 开 水开了 = "sôi (nước)" (nước tự sôi, không phải "đun sôi"); 过 "to get along" = "sống qua ngày", không phải "hợp nhau" (đó là 合得来). Nghĩa tiếng Việt phải khớp ngữ pháp (tự/tha động từ) và mức độ của câu.
- Lý do "trùng" chỉ cho nghĩa GIỐNG HỆT một nghĩa khác. Nghĩa mượn hay hiếm (fan/devotee, tên gọi mới) vẫn phải có trong mục từ, đánh common: false.
- Phân biệt từ gần nghĩa mà người Việt hay lẫn: 还是 hỏi lựa chọn là "hay, hay là", còn "hoặc" là 或者.
- "common": true cho mọi nghĩa người học HSK 1–6 hay gặp trong lời nói và văn viết thường ngày, kể cả khi nó chỉ xuất hiện trong cấu trúc hoặc từ ghép thông dụng (少 trong 很少 "hiếm khi", 少来/少废话 "thôi, đừng" là common). false CHỈ cho nghĩa hiếm: văn ngôn, phương ngữ, chuyên ngành, chỉ còn trong thành ngữ cố định, hoặc chỉ dùng làm tên riêng. Căn cứ vào mức độ thường dùng của nghĩa, KHÔNG phải thứ tự trong CC-CEDICT. Không bỏ nghĩa hiếm, chỉ đánh dấu.
- Lượng từ: nghĩa viết bằng từ đếm tiếng Việt kèm (danh từ được đếm), ví dụ 本 "quyển, cuốn (sách)", 杯 "cốc, ly (đồ uống)", 床 "tấm, chiếc (chăn, nệm)"; KHÔNG bắt đầu bằng "lượng từ" hay "classifier for". Ví dụ phải có số từ ngay trước đúng lượng từ 「{hz}」 (一床被子, 三岁), không dùng lượng từ khác (两张床 là sai cho 床).
- Giới từ, bổ ngữ, động từ: dịch theo cách dùng của tiếng Việt, không dịch sát giới từ tiếng Anh của CC-CEDICT (for the benefit of → cho, giúp; không dùng "vì"; to → cho, không dùng "tới"). Hai nghĩa chỉ là cách nói khác của nhau (đi tới / đến, tới; làm… cho / cho, giúp) thì gộp thành một.
- Mỗi nghĩa chỉ một ý và một ví dụ: không gộp hai nghĩa khác nhau vào một dòng (几 "mấy (hỏi số nhỏ)" khác 几 "vài (số không xác định)"). 几 dịch là "mấy", không phải "bao nhiêu" (đó là 多少). Nghĩa chỉ dùng ở khẩu ngữ, phương ngữ hoặc thô (女人 "vợ") phải common: false.
- Ví dụ phải đúng ÂM ĐỌC của nghĩa đang viết (看 kān "trông, canh" khác 看 kàn "xem"): không chọn câu mà chữ đó đọc âm khác.
- Ví dụ: với mỗi nghĩa, chọn câu Tatoeba dùng ĐÚNG nghĩa đó (ghi "tatoeba": id, chép nguyên "hz"), ưu tiên câu ngắn, từ dễ. Một câu chỉ dùng cho một nghĩa.
  Không có câu nào đúng nghĩa → tự viết câu ≤ 12 chữ Hán, từ vựng HSK ≤ {max(level or 3, 2)}, ghi "ai": true. Câu tự viết phải là tiếng Trung hiện đại tự nhiên, dùng 「{hz}」 hoặc một từ ghép CÓ THẬT chứa nó (không bịa từ ghép, không dùng từ văn ngôn làm câu thay thế). Nếu nghĩa chỉ có ở từ không tự nhiên trong lời nói (hoặc ví dụ duy nhất là từ ghép văn ngôn), đưa nghĩa vào "dropped" với lý do "không có ví dụ tự nhiên" thay vì cố viết câu.
  Không dùng chữ số Ả Rập trong câu tự viết: viết số bằng chữ Hán (六十, 一百). Nghĩa uyển ngữ hoặc hiếm (去 "qua đời") phải đánh common: false và câu dùng chính chữ đó (他爷爷病了很久，上个月去了), không dùng từ khác (去世) thay thế.
  "py": pinyin phải khớp chữ Hán (không thêm r khi câu không có 儿); trợ từ 了/着/过/的 viết thanh nhẹ (le, zhe, guo, de), động từ viết dấu (guò, zháo); pinyin có dấu, viết liền từng từ (zǒulù, jiàndào, tārén, wǒmen), cách nhau giữa các từ, viết hoa đầu câu; không đánh dấu biến điệu thanh 3-3 (giữ dấu gốc). "vi": dịch tiếng Việt tự nhiên (dựa vào câu Trung, bản tiếng Anh/Việt kèm theo chỉ để hiểu nghĩa).
- "luongtu": lượng từ đi với danh từ này ([] nếu không phải danh từ). "cannghia": tối đa 3 từ gần nghĩa, [] nếu không chắc.

Chỉ trả về JSON:
{{"readings":[{{"pinyin":"...","hanviet":"...","groups":[{{"pos":"Danh từ","senses":[{{"vi":"...","src":["1.0"],"common":true,"ex":{{"tatoeba":"123","hz":"...","py":"...","vi":"..."}}}}]}}]}}],"dropped":[{{"id":"1.5","why":"trùng"}}],"luongtu":[],"cannghia":[]}}"""
    if HINTS.get(hz):
        prompt += f'\n\nGhi chú của người kiểm duyệt cho mục từ này, bắt buộc áp dụng: {HINTS[hz]}'
    e = llm(prompt)
    errs = check(e, cands, hz, readings)
    unstar, bound, dup = set(), {}, {}
    if not errs:
        bad, unstar, bound, dup = audit(hz, e, llm, readings)
        errs = bad + standins(hz, e, bound) + [f'danh sách HSK gợi ý từ loại "{p}" nhưng chưa có nghĩa nào. Nếu từ có nghĩa cốt lõi này mà CC-CEDICT không ghi (xem cvdict_vi), thêm nó với "src": [] và "core": true; nếu không thì để nguyên' for p in pos_gaps(hz, e)]
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
    redirect = {}  # removed gloss -> survivor, so a mirrored pair or a chain folds into a live sense instead of removing both
    for extra, kept in dup.items():  # a sense the audit calls a synonym split of another folds into it
        if extra in redirect:
            continue
        while kept in redirect:
            kept = redirect[kept]
        live = {s['vi']: (g, s) for r in e['readings'] for g in r['groups'] for s in g['senses']}
        if extra not in live or kept not in live or live[extra][1] is live[kept][1]:
            continue
        g, s = live[extra]
        live[kept][1].setdefault('src', []).extend(s.get('src', []))
        g['senses'] = [x for x in g['senses'] if x is not s]
        redirect[extra] = kept
    for r in e['readings']:
        for g in r['groups']:
            for s in g['senses']:
                if s['vi'] in unstar:
                    s['common'] = True
                if bound.get(s['vi']):
                    note = 'chỉ dùng trong ' + re.sub(r'[「」]', '', bound[s['vi']]).replace('、', ', ').replace('，', ', ').replace('；', '; ')
                    paren = re.search(r' \(([^()]*)\)$', s['vi'])
                    named = re.findall(r'[\u4e00-\u9fff]{2,}', paren.group(1)) if paren else []
                    if paren and named and set(named) <= set(re.findall(r'[\u4e00-\u9fff]{2,}', note)) and not re.sub(r'trong|[\u4e00-\u9fff]|[;, ]', '', paren.group(1)):
                        s['vi'] = s['vi'][:paren.start()] + f' ({note})'
                    else:
                        s['vi'] = s['vi'][:-1] + f'; {note})' if s['vi'].endswith(')') else f'{s["vi"]} ({note})'
                s['vi'] = s['vi'].replace('（', '(').replace('）', ')')
    for r in e['readings']:
        sents = [s['ex']['hz'] for g in r['groups'] for s in g['senses']]
        with taught(hz, [c for g in r['groups'] for s in g['senses'] for c in note_compounds(s['vi'])], sents):
            for g in r['groups']:
                for s in g['senses']:
                    s['ex']['py'] = normalize_py(s['ex']['hz'], s['ex']['py'], {hz} if g['pos'] == 'Lượng từ' else ())
    e['core'] = [s['vi'] for r in e['readings'] for g in r['groups'] for s in g['senses'] if s.get('core')]
    main = main_reading(hz, e['readings'])
    e['main'] = main
    for r in list(e['readings']):
        if r['pinyin'].lower() != main and not any(s.get('common') for g in r['groups'] for s in g['senses']):
            e['readings'].remove(r)
            e.setdefault('dropped', []).extend({'id': i, 'why': 'âm hiếm'} for g in r['groups'] for s in g['senses'] for i in s.get('src', []))
    e['stats'] = {'cedict': before, 'merged': len(ids), 'xref': len(skipped), 'dropped': len(e.get('dropped', [])),
                  'tatoeba': sum(bool(s['ex'].get('tatoeba')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'ai_ex': sum(bool(s['ex'].get('ai')) for r in e['readings'] for g in r['groups'] for s in g['senses']),
                  'candidates': len(cands)}
    e['readings'].sort(key=lambda r: (r['pinyin'].lower() != main, not any(s.get('common') for g in r['groups'] for s in g['senses'])))
    e['cedict'] = readings
    e['out'] = to_yaml(hz, e)
    return hz, e

def to_yaml(hz, e):
    row = DICT[hz]
    nums = {src_pinyin(f['i']['y']).lower(): f['i']['n'] for f in HSK[hz]['f']}
    words, sentences = {}, {}
    for r in e['readings']:
        py = r['pinyin'].lower()
        main = py == e['main']
        wid = hz if main else hz + '-' + ''.join(s if s[-1].isdigit() else s + '5' for s in nums[py].split())
        variants = [r['pinyin'] for r in e['cedict'] if r['pinyin'].lower() == py]
        proper = variants[0] if variants and all(v[:1].isupper() for v in variants) else py
        w = words.setdefault(wid, {'id': wid, 'hanzi': hz, 'pinyin': normalize_py(hz, proper, capital=proper[:1].isupper(), override=OVERRIDE),
                                   'hanviet': hanviet(hz, row[3] if py == row[1].lower() else next((v for p, v, _ in row[7] if p.lower() == py), row[3])),
                                   'level': LEVEL, 'pos': [], 'senses': [], 'examples': []})
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

HAND = 'hand'  # sense note marking wording a person wrote, so it stays a hand sense after promotion (the Word schema allows note)
HAND_GLOSSES = {  # hand glosses an earlier promotion folded into a generated twin, so no pos-less sense marks them any more
    '不客气': {'không có gì'}, '你们': {'các bạn'}, '再见': {'tạm biệt'},
    '对不起': {'xin lỗi'}, '没关系': {'không sao'}, '谢谢': {'cảm ơn'},
}

def fold_hand(senses):
    """A generated sense whose gloss equals a hand gloss, or one of its ;/,-separated terms, folds into the hand sense: hand wording stays, pos, example and rare come from the first generated twin and later twins are dropped; the hand sense keeps note 'hand' so it stays hand after promotion. A sense that repeats an earlier gloss is dropped too; its example stays in the word's example list."""
    norm = lambda v: re.sub(r'\s*\(.*?\)', '', v).strip().casefold()
    hand = [h for h in senses if 'pos' not in h or h.get('note') == HAND]
    for g in [g for g in senses if 'pos' in g]:
        terms = {norm(g['vi']), *(t.strip() for t in re.split(r'[;,]', norm(g['vi'])))}
        twin = next((h for h in hand if h is not g and norm(h['vi']) in terms), None)
        if twin:
            if 'pos' not in twin:
                twin.update({k: g[k] for k in ('pos', 'example', 'rare') if k in g})
                twin['note'] = HAND
            senses[:] = [x for x in senses if x is not g]
    seen = set()
    senses[:] = [x for x in senses if not (norm(x['vi']) in seen or seen.add(norm(x['vi'])))]
    return senses

def out_dir():
    return CACHE / ('out' if LEVEL == 1 else f'out-hsk{LEVEL}')

def sent_file():
    return f'sentences/hsk{LEVEL}.yaml'

def write_out(results):
    out = out_dir()
    sentences = {s['id']: s for s in (yaml.safe_load((out / sent_file()).read_text(encoding='utf-8')) if (out / sent_file()).exists() else [])}
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
                hand = []
                for s in old.get('senses', []):
                    if 'pos' not in s or s.get('note') == HAND:
                        hand.append(dict(s))
                    elif s.get('vi') in HAND_GLOSSES.get(wid, ()):  # hand wording a promotion folded before the marker existed
                        hand.append({**s, 'note': HAND})
                merged = fold_hand([*hand, *w['senses']])
                hand_ex = [x for x in old.get('examples', []) if not x.startswith('s-w-')]
                w = {**w, **{k: old[k] for k in ('image', 'parts', 'components', 'spoken', 'collocations', 'hanviet') if k in old},
                     'senses': merged, 'examples': (hand_ex + [x for x in w['examples'] if x not in hand_ex])[:3]}
            dump(out / 'words' / f'{wid}.yaml', {k: w[k] for k in WORD_FIELDS if k in w})
            same = [r for r in e['cedict'] if flat_py(r['pinyin']) == flat_py(w['pinyin'])]
            base = next((r for r in same if not r['pinyin'][:1].isupper()), same[0])
            nums = {**base, 'senses': {k: v for r in same for k, v in r['senses'].items()}, 'core': e.get('core', [])}
            (out / 'src').mkdir(parents=True, exist_ok=True)
            (out / 'src' / f'{wid}.json').write_text(json.dumps(nums, ensure_ascii=False, indent=1), encoding='utf-8')
    dump(out / sent_file(), sorted(sentences.values(), key=lambda s: s['id']))

def restage_sentences(w, sentences):
    """The pinyin every example sentence of a staged word gets from the current normalize_py, under that word's taught compounds and classifier."""
    ids = [x for x in dict.fromkeys([*w.get('examples', []), *(s['example'] for s in w['senses'] if 'example' in s)]) if x in sentences and x.startswith('s-w-')]
    texts = [sentences[i]['hanzi'] for i in ids]
    with taught(w['hanzi'], [c for s in w['senses'] for c in note_compounds(s['vi'])], texts):
        return {i: normalize_py(sentences[i]['hanzi'], sentences[i]['pinyin'], {w['hanzi']} if 'mw' in w['pos'] else ()) for i in ids}

def restage():
    """Deterministic fixes over the staged set, no model call: sentence pinyin, header case, hand-gloss folds and the CC-CEDICT source of case-variant readings."""
    out = out_dir()
    sentences = {s['id']: s for s in yaml.safe_load((out / sent_file()).read_text(encoding='utf-8'))}
    changed = {'sentences': 0, 'headers': 0, 'folds': 0, 'notes': 0, 'src': 0}
    settled = set()  # a sentence shared by several words takes the pinyin of the first word in file order
    for f in sorted((out / 'words').glob('*.yaml')):
        w = yaml.safe_load(f.read_text(encoding='utf-8'))
        hz, py = w['hanzi'], w['pinyin'].lower()
        readings, _ = source(hz)
        same = [r for r in readings if flat_py(r['pinyin']) == flat_py(py)]
        proper = same[0]['pinyin'] if same and all(r['pinyin'][:1].isupper() for r in same) else py
        proper = normalize_py(hz, proper, capital=proper[:1].isupper(), override=OVERRIDE)
        if proper != w['pinyin']:
            w['pinyin'] = proper
            changed['headers'] += 1
        for sense in w['senses']:
            sense['vi'] = collapse_notes(sense['vi'])
            repeat = re.search(r' \(([^()]*?);? ?chỉ dùng trong ([^()]*)\)$', sense['vi'])
            if repeat and set(re.findall(r'[\u4e00-\u9fff]{2,}', repeat.group(1))) <= set(re.findall(r'[\u4e00-\u9fff]{2,}', repeat.group(2))) and not re.sub(r'trong|[\u4e00-\u9fff]|[;, ]', '', repeat.group(1)):
                tidy = sense['vi'][:repeat.start()] + f' (chỉ dùng trong {repeat.group(2)})'
                changed['notes'] += tidy != sense['vi']
                sense['vi'] = tidy
        before = len(w['senses'])
        w['senses'] = fold_hand(w['senses'])
        changed['folds'] += before - len(w['senses'])
        for i, new in restage_sentences(w, sentences).items():
            if i in settled:
                continue
            settled.add(i)
            if sentences[i]['pinyin'] != new:
                sentences[i]['pinyin'] = new
                changed['sentences'] += 1
        dump(f, {k: w[k] for k in WORD_FIELDS if k in w})
        src = out / 'src' / f.with_suffix('.json').name
        old = json.loads(src.read_text(encoding='utf-8'))
        base = next((r for r in same if not r['pinyin'][:1].isupper()), same[0])
        nums = {**old, **{k: base[k] for k in ('pinyin', 'hanviet', 'cvdict_vi')}, 'senses': {**{k: v for r in same for k, v in r['senses'].items()}, **old['senses']}} if len(same) > 1 else old
        if nums != old:
            src.write_text(json.dumps(nums, ensure_ascii=False, indent=1), encoding='utf-8')
            changed['src'] += 1
    dump(out / sent_file(), sorted(sentences.values(), key=lambda s: s['id']))
    print('restaged', json.dumps(changed))

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
    sentences = {s['id']: s for s in yaml.safe_load((out / sent_file()).read_text(encoding='utf-8'))}
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
                label = f' (Tatoeba #{x["source"].split(":")[1]})' if x and x['source'].startswith('tatoeba:') else ''
                lines.append(f'- {"★ " if s.get("rare") else ""}{s["vi"]}' + (f' — {x["hanzi"]} / {x["pinyin"]} / {x["vi"]}{label}' if x else ''))
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
    # refs of words that stay in content (other levels) count too, so this level's file never drops a sentence they cite
    kept = [f for f in CONTENT.glob('*.yaml') if f.name not in {w.name for w in words}] if CONTENT.exists() else []
    used = {x for f in [*words, *kept] for w in [yaml.safe_load(f.read_text(encoding='utf-8'))] for x in [*w.get('examples', []), *(s['example'] for s in w['senses'] if 'example' in s)]}
    # a sentence another level's file already holds keeps its id there; listing it twice breaks the import
    elsewhere = {s['id'] for f in (CONTENT.parent / 'sentences').glob('*.yaml') if f.name != Path(sent_file()).name
                 for s in yaml.safe_load(f.read_text(encoding='utf-8')) or []}
    sentences = [s for s in yaml.safe_load((out / sent_file()).read_text(encoding='utf-8'))
                 if (not s['id'].startswith('s-w-') or s['id'] in used) and s['id'] not in elsewhere]
    current = CONTENT.parent / sent_file()
    staged_ids = {s['id'] for s in sentences}
    sentences += [s for s in (yaml.safe_load(current.read_text(encoding='utf-8')) or [] if current.exists() else [])
                  if s['id'] in used and s['id'] not in staged_ids and s['id'] not in elsewhere]
    CONTENT.mkdir(parents=True, exist_ok=True)
    for f in words:
        shutil.copy(f, CONTENT / f.name)
    dump(CONTENT.parent / sent_file(), sentences)
    print(f'promoted {len(words)} words, {len(sentences)} sentences')

def main(argv, llm=ask):
    ap = argparse.ArgumentParser(prog='gen-entries.py')
    ap.add_argument('words', nargs='*')
    ap.add_argument('--sample', type=int)
    ap.add_argument('--seed', type=int)
    ap.add_argument('--promote', action='store_true')
    ap.add_argument('--restage', action='store_true')
    ap.add_argument('--approved', type=int)
    ap.add_argument('--level', type=int, choices=range(1, 7), default=1)
    args = ap.parse_args(argv)
    global LEVEL
    LEVEL = args.level
    if args.promote and args.approved is None:
        ap.error('--promote needs --approved N')
    if args.sample and args.seed is None:
        ap.error('--sample needs --seed N')
    if args.promote:
        return promote(out_dir(), args.approved)
    if args.sample:
        return review(out_dir(), args.seed, args.sample)
    if args.restage:
        for name in SOURCES:
            fetch(name)
        HSK.update({e['s']: e for e in json.loads((CACHE / 'complete.min.json').read_text(encoding='utf-8'))})
        return restage()
    argv = args.words
    if os.environ.get('GEN_HINTS'):
        HINTS.update(json.loads(Path(os.environ['GEN_HINTS']).read_text(encoding='utf-8')))
    if llm is ask and os.environ.get('GEN_OFFLINE_DIR'):
        llm = ask_files
    provider = os.environ.get('GEN_PROVIDER')
    if provider not in (None, '', 'opencode', 'anthropic', 'claude-cli'):
        print(f'unknown GEN_PROVIDER {provider!r} (use opencode, anthropic or claude-cli)', file=sys.stderr)
        sys.exit(2)
    need = {'anthropic': 'ANTHROPIC_API_KEY', 'claude-cli': None}.get(provider, 'OPENCODE_API_KEY')
    if llm is ask and need and not os.environ.get(need):
        print(f'{need} is not set', file=sys.stderr)
        sys.exit(2)
    for name in SOURCES:
        fetch(name)
    HSK.update({e['s']: e for e in json.loads((CACHE / 'complete.min.json').read_text(encoding='utf-8'))})
    level = {s for s, e in HSK.items() if f'n{LEVEL}' in e['l']} & DICT.keys()
    words = []
    for w in argv or sorted(level):
        if w in level:
            words.append(w)
        else:
            print(f'skip {w}: not in HSK{LEVEL} list')
    rows = tatoeba()
    done, rejected, pending = [], [], []
    with ThreadPoolExecutor(int(os.environ.get("GEN_WORKERS", 8))) as pool:
        for w, f in [(w, pool.submit(entry, w, rows, llm)) for w in words]:
            try:
                hz, e = f.result()
                done.append((hz, e))
                print('ok', hz, json.dumps(e['stats'], ensure_ascii=False))
            except Pending:
                pending.append(w)
                print('PENDING', w)
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
    print(f'cedict senses {sum(e["stats"]["cedict"] for _, e in done)} -> {sum(e["stats"]["merged"] for _, e in done)} after merging synonyms')
    print(f'llm calls {USAGE["calls"]}, tokens in {USAGE["input"]} / out {USAGE["output"]}')
    if pending:
        print(f'{len(pending)} words wait for answers: ' + ' '.join(pending))
    if rejected:
        print('\n'.join(f'REJECT {r}' for r in rejected))
        sys.exit(1)
    if pending:
        sys.exit(3)

if __name__ == '__main__':
    main(sys.argv[1:])
