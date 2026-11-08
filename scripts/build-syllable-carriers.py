"""Pick the text Azure reads for each syllable cell. usage: build-syllable-carriers.py <cedict_ts.u8> <Unihan.zip> <out.json>
Carriers are standard hanzi (Unihan kTGHZ2013). Best: the hanzi has that toned syllable as its only standard reading. Next: it is the default reading
(kMandarin) and at least 90% of the hanzi's corpus uses (kHanyuPinlu). More corpus uses, then kFrequency, then HSK words rank first.
Multi-syllable chips (pinyin to hanzi) are written by hand in the same file and kept. No such hanzi: the most common two-hanzi CC-CEDICT word (no erhua) whose first hanzi has that standard reading is sent and cut to its first syllable. Neither: no clip."""
import collections
import glob
import json
import re
import sys
import unicodedata
import zipfile

import yaml

cedict, unihan, out = sys.argv[1:4]
TONES = {"\u0304": 1, "\u0301": 2, "\u030c": 3, "\u0300": 4}


def numbered(marked):
    tone = 0
    base = ""
    for c in unicodedata.normalize("NFD", marked):
        if c in TONES:
            tone = TONES[c]
        elif c == "\u0308":
            base = base[:-1] + "v"
        else:
            base += c
    return base + str(tone) if tone else None


fields = collections.defaultdict(dict)
with zipfile.ZipFile(unihan) as z:
    for name in z.namelist():
        for line in z.read(name).decode().splitlines():
            parts = line.split("\t")
            if len(parts) == 3 and parts[1] in ("kTGHZ2013", "kMandarin", "kHanyuPinlu", "kFrequency"):
                fields[chr(int(parts[0][2:], 16))][parts[1]] = parts[2]

hsk = set()
for path in glob.glob("content/words/*.yaml"):
    hsk.update(path.split("/")[-1][:-5])

standard = {}
for char, f in fields.items():
    if "kTGHZ2013" not in f:
        continue
    readings = {numbered(r.split(":")[1]) for r in f["kTGHZ2013"].split()} - {None}
    pinlu = {numbered(m.group(1)): int(m.group(2)) for m in re.finditer(r"(\S+?)\((\d+)\)", f.get("kHanyuPinlu", ""))}
    standard[char] = dict(readings=readings, default=numbered(f.get("kMandarin", "").split()[0]) if f.get("kMandarin") else None,
                          pinlu=pinlu, freq=int(f.get("kFrequency", 9)))

carriers = collections.defaultdict(list)
for char, s in standard.items():
    for label in s["readings"]:
        total = sum(s["pinlu"].values())
        only = s["readings"] == {label}
        dominant = s["default"] == label and total and s["pinlu"].get(label, 0) / total >= 0.9
        if only or dominant:
            carriers[label].append(((0 if only else 1, -s["pinlu"].get(label, 0), s["freq"], char not in hsk, char), char))

words = collections.defaultdict(list)
for line in open(cedict, encoding="utf8"):
    m = re.match(r"(\S+) (\S+) \[([^\]]+)\] /(.*)/", line)
    if not m or line.startswith("#"):
        continue
    _, simp, pinyin, gloss = m.groups()
    syllables = pinyin.lower().replace("u:", "v").split()
    if len(syllables) == 2 and len(simp) == 2 and all(c in standard for c in simp) and "surname" not in gloss:
        first = standard[simp[0]]
        if syllables[0] not in first["readings"] or simp[1] == "儿":
            continue
        words[syllables[0]].append(((-first["pinlu"].get(syllables[0], 0), first["freq"] + standard[simp[1]]["freq"], simp), simp))

cells = {}
for row in yaml.safe_load(open("content/syllables.yaml", encoding="utf8")):
    for tone in (1, 2, 3, 4):
        label = row["syllable"].replace("ü", "v") + str(tone)
        if carriers[label]:
            cells[label] = {"say": min(carriers[label])[1]}
        elif words[label]:
            cells[label] = {"say": min(words[label])[1], "cut": True}

try:
    chips = json.load(open(out, encoding="utf8"))["chips"]
except FileNotFoundError:
    chips = {}
with open(out, "w", encoding="utf8") as f:
    json.dump({"cells": cells, "chips": chips}, f, ensure_ascii=False, indent="\t", sort_keys=True)
    f.write("\n")
cut = sum(1 for c in cells.values() if c.get("cut"))
print(f"cells {len(cells)} (hanzi {len(cells) - cut}, word cut {cut})")
