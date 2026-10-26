# Build prototype/data/dict.json: HSK 3.0 levels 1–5 words with Vietnamese meaning + Hán Việt per reading.
# Sources, downloaded into /tmp/dict:
#   complete.min.json  github.com/drkameleon/complete-hsk-vocabulary (levels, pinyin)          MIT
#   dict.u8            github.com/DucThanhNguyen/han-thong data/dict.u8: CVDICT lines           CC BY-SA 4.0
#                      `trad simp [pin1 yin1] {hán việt} /nghĩa/…/` — Hán Việt per reading from
#                      ph0ngp/hanviet-pinyin-wordlist (MIT), so 好 hǎo = hảo, hào = hiếu.
# Output rows: [hz, pinyin, toneless key, hanviet, short meaning, level, senses[], others[[pinyin, hanviet, senses[]]]]
#   level 0 = not an HSK item; senses = every CVDICT sense of this reading; others = the word's other readings
import json, re, sys, unicodedata
from pathlib import Path

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '/tmp/dict')
OUT = Path(__file__).resolve().parent.parent / 'prototype/data/dict.json'
MAX_LEVEL = 5
# prototype words that are not HSK 3.0 items: Bài 1 phrases + "tự thêm" demo words
EXTRA = ['你好', '你们', '对不起', '没关系', '不客气', '再见', '熊猫', '奶茶', '火锅']

LINE = re.compile(r'^(\S+) (\S+) \[([^\]]*)\] \{([^}]*)\} /(.*)/$')
# every CVDICT entry per simplified form, in file order. Surname entries ("Huan2", "họ …") are kept apart
# so they never shadow the common word with the same reading (环 Huán surname vs huán ring).
cv = {}
for line in open(SRC / 'dict.u8', encoding='utf-8'):
    m = LINE.match(line.rstrip('\n'))
    if not m:
        continue
    _, simp, pin, hv, defs = m.groups()
    cv.setdefault(simp, []).append({'hv': '' if '_' in hv.split() else hv.lower(), 'defs': defs, 'pin': pin,
                                    'proper': pin[:1].isupper()})

def pick(simp, numbered):
    es = cv.get(simp, [])
    want = numbered.lower().replace('ü', 'v').replace('u:', 'v')
    same = [e for e in es if e['pin'].lower().replace('u:', 'v') == want]
    common = [e for e in same if not e['proper']] or [e for e in es if not e['proper']] or same or es
    return common[0] if common else None

def toneless(py):
    s = unicodedata.normalize('NFD', py.lower())
    s = ''.join(ch for ch in s if unicodedata.category(ch) != 'Mn')
    return re.sub(r'[^a-z]', '', s.replace('ü', 'v'))

def senses(d):
    out = []
    for s in d.split('/'):
        s = re.sub(r';?\s*LT:[^;]*', '', re.sub(r'\s*\(từ mượn\)', '', s)).strip(' ;')
        if not s or s.lower().startswith(('cl:', 'từ phân loại', 'biến thể')):
            continue
        if not any(s == o or s.startswith(o + ' (') or o.startswith(s + ' (') for o in out):
            out.append(s)
    return out

def meaning(d):
    text = ''
    for p in [p.strip() for s in senses(d) for p in s.split(';') if p.strip()]:
        nxt = f'{text}; {p}' if text else p
        if len(nxt) > 70 and text:
            break
        if p not in text:
            text = nxt
    return text

MARK = {'a': 'āáǎà', 'e': 'ēéěè', 'i': 'īíǐì', 'o': 'ōóǒò', 'u': 'ūúǔù', 'ü': 'ǖǘǚǜ'}
def marks(numbered):
    out = []
    for syl in numbered.replace('u:', 'ü').split():
        m = re.fullmatch(r'([a-zü]+)([1-5])', syl.lower())
        if not m:
            out.append(syl); continue
        s, t = m.group(1), int(m.group(2))
        if t < 5:
            i = s.find('a') if 'a' in s else s.find('e') if 'e' in s else s.find('o') if 'ou' in s else max(k for k, ch in enumerate(s) if ch in MARK)
            s = s[:i] + MARK[s[i]][t - 1] + s[i + 1:]
        out.append(s)
    return ' '.join(out)

def level(ls):
    nums = [int(x[1:]) for x in ls if x.startswith('n') and x[1:].isdigit()]
    return min(nums) if nums else None

# Bài 1 words: Hán Việt curated in the lesson file wins (你 nhĩ, not the rare nễ)
CURATED = dict(re.findall(r"hz: '([^']+)', py: '[^']*',(?: say: \[[^\]]*\],)? hv: '([^']+)'",
                          (OUT.parent / 'h1-01.js').read_text(encoding='utf-8')))

rows, seen = [], set()
def add(s, py, numbered, lv):
    e = pick(s, numbered)
    if not e or s in seen:
        return
    others = []
    for o in cv[s]:
        py_o = marks(o['pin'])
        if o is not e and not o['proper'] and o['pin'].lower() != e['pin'].lower() and senses(o['defs']) and py_o not in [x[0] for x in others]:
            others.append([py_o, o['hv'], senses(o['defs'])])
    rows.append([s, py, toneless(py), CURATED.get(s, e['hv']), meaning(e['defs']), lv, senses(e['defs']), others])
    seen.add(s)

for e in json.load(open(SRC / 'complete.min.json')):
    lv = level(e.get('l', []))
    if lv and lv <= MAX_LEVEL:
        # main reading: not a surname; HSK's first listed reading unless CVDICT has ≤2 senses for it
        # (打 dá "tá", 号 háo "gầm" are rare → dǎ, hào; 长 keeps cháng, not zhǎng)
        forms = [f['i'] for f in e['f']]
        def score(k):
            x = forms[k]; p = pick(e['s'], x['n'])
            exact = bool(p) and p['pin'].lower() == x['n'].lower()
            return (not x['y'][:1].isupper(), exact, exact and len(senses(p['defs'])) > 2, -k)
        f = forms[max(range(len(forms)), key=score)]
        add(e['s'], f['y'], f['n'], lv)
for s in EXTRA:
    e = pick(s, '')
    if e:
        add(s, marks(e['pin']), e['pin'], 0)

rows.sort(key=lambda r: (r[5] or 99, len(r[0])))
OUT.write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
chars = sorted({ch for r in rows for ch in r[0]})
(SRC / 'dict-chars.txt').write_text(''.join(chars))
print(len(rows), 'words', len(chars), 'chars', OUT.stat().st_size // 1024, 'KB',
      'no hv:', sum(1 for r in rows if not r[3]), {lv: sum(1 for r in rows if r[5] == lv) for lv in range(0, MAX_LEVEL + 1)})
