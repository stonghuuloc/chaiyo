"""CHY-14 tone-forcing probe. Usage: python tone_probe.py render|analyze
render: OmniVoice refclip (narrator-1 reference, seed 1403) for each syllable x text form -> spike/_wav/tone/<syl>-<form>.wav
analyze: Praat F0 per clip -> tone class -> spike/tone-probe/results.json"""
import json, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WAV = os.path.join(HERE, "_wav", "tone")
REF = os.path.join(HERE, "_wav", "voices", "narrator-1.wav")
AUDITION = "你好！今天天气很好，我们一起去学校吧。你吃饭了吗？"
# syllable, target tone, hanzi for the override form, unambiguous carrier hanzi
SYL = [
    ("xing2", 2, "行", "形"), ("hang2", 2, "行", "杭"),
    ("ba3", 3, "把", "靶"), ("ba4", 4, "把", "爸"),
    ("ma1", 1, "妈", "妈"), ("ma2", 2, "麻", "麻"), ("ma3", 3, "马", "马"), ("ma4", 4, "骂", "骂"),
    ("ba5", 5, "吧", "吧"),
]
MARK = {"a": "āáǎà", "e": "ēéěè", "i": "īíǐì", "o": "ōóǒò", "u": "ūúǔù"}
def marked(s):
    base, t = s[:-1], int(s[-1])
    if t == 5:
        return base
    v = "a" if "a" in base else "i"
    i = base.index(v)
    return base[:i] + MARK[v][t - 1] + base[i + 1:]
FORMS = {
    "upper": lambda s, t, h, c: s.upper(),
    "lower": lambda s, t, h, c: s,
    "hanzi+upper": lambda s, t, h, c: h + s.upper(),
    "marks": lambda s, t, h, c: marked(s),
    "carrier": lambda s, t, h, c: c,
}

def jobs():
    for s, t, h, c in SYL:
        for f, fn in FORMS.items():
            yield s, f, fn(s, t, h, c)

if sys.argv[1] == "render":
    import soundfile as sf, torch
    from omnivoice import OmniVoice
    todo = [(s, f, x) for s, f, x in jobs() if not os.path.exists(os.path.join(WAV, f"{s}-{f}.wav"))]
    os.makedirs(WAV, exist_ok=True)
    model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="mps", dtype=torch.float16) if todo else None
    for s, f, x in todo:
        torch.manual_seed(1403)
        a = model.generate(text=x, ref_audio=REF, ref_text=AUDITION)[0]
        a = a.squeeze().float().cpu().numpy() if hasattr(a, "cpu") else np.asarray(a)
        sf.write(os.path.join(WAV, f"{s}-{f}.wav"), a, 24000)
        print("rendered", s, f, x, flush=True)
else:
    import parselmouth
    out = []
    for s, f, x in jobs():
        p = os.path.join(WAV, f"{s}-{f}.wav")
        snd = parselmouth.Sound(p)
        pitch = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=400)
        f0 = pitch.selected_array["frequency"]
        v = f0[f0 > 0]
        row = {"syllable": s, "form": f, "text": x, "target": int(s[-1]), "dur": round(snd.duration, 2)}
        # trim to the longest voiced run
        idx = np.where(f0 > 0)[0]
        if len(idx) < 8:
            row.update(tone=None, reason="unvoiced"); out.append(row); continue
        runs = np.split(idx, np.where(np.diff(idx) > 3)[0] + 1)
        run = max(runs, key=len)
        c = 12 * np.log2(f0[run[0]:run[-1] + 1] / np.median(v))
        c = c[f0[run[0]:run[-1] + 1] > 0]
        n = len(c); q = max(1, n // 5)
        start, end = c[:q].mean(), c[-q:].mean()
        mn = int(np.argmin(c)); rng = c.max() - c.min()
        voiced_s = round(len(run) * 0.01, 2)
        if voiced_s < 0.22 and rng < 4:
            tone = 5
        elif end - start > 2.5 and mn < n * 0.4:
            tone = 2
        elif start - end > 3.0 and mn > n * 0.6:
            tone = 4
        elif 0.2 * n < mn < 0.8 * n and start - c[mn] > 1.5 and end - c[mn] > 1.0:
            tone = 3
        elif rng < 3.0:
            tone = 1
        elif end > start:
            tone = 2
        else:
            tone = 4
        row.update(tone=tone, ok=tone == row["target"], voiced=voiced_s, start=round(float(start), 1), end=round(float(end), 1), rng=round(float(rng), 1), minpos=round(mn / n, 2))
        out.append(row)
    os.makedirs(os.path.join(HERE, "tone-probe"), exist_ok=True)
    json.dump(out, open(os.path.join(HERE, "tone-probe", "results.json"), "w"), ensure_ascii=False, indent=1)
    from collections import defaultdict
    d = defaultdict(lambda: [0, 0])
    for r in out:
        d[r["form"]][1] += 1; d[r["form"]][0] += bool(r.get("ok"))
    for f, (a, b) in d.items():
        print(f, f"{a}/{b}")
    for r in out:
        print(r["syllable"].ljust(6), r["form"].ljust(12), r["text"].ljust(8), "want", r["target"], "got", r["tone"], r.get("start"), r.get("end"), r.get("rng"), r.get("voiced"))
