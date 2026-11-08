"""Score the F0 contour of syllable clips. usage: syllable-f0.py <clip.mp3>...  prints "<file stem>\t<1-4|5|none>" per clip.
The classifier is spike/tone_probe.py: longest voiced run, first and last fifth of the contour against the clip median in semitones, tone 3 dip tested first."""
import os
import subprocess
import sys
import tempfile

import numpy as np
import parselmouth


def tone_of(path):
    snd = parselmouth.Sound(path)
    f0 = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=400).selected_array["frequency"]
    voiced = f0[f0 > 0]
    idx = np.where(f0 > 0)[0]
    runs = np.split(idx, np.where(np.diff(idx) > 3)[0] + 1) if len(idx) else []
    run = max(runs, key=len) if runs else []
    if len(run) < 8:
        return None
    c = 12 * np.log2(f0[run[0] : run[-1] + 1] / np.median(voiced))
    c = c[f0[run[0] : run[-1] + 1] > 0]
    n = len(c)
    q = max(1, n // 5)
    start, end = c[:q].mean(), c[-q:].mean()
    low = int(np.argmin(c))
    spread = c.max() - c.min()
    if len(run) * 0.01 < 0.22 and spread < 4:
        return 5
    if 0.2 * n < low < 0.8 * n and start - c[low] > 1.5 and end - c[low] > 1.0:
        return 3
    if end - start > 2.5 and low < n * 0.4:
        return 2
    if start - end > 3.0 and low > n * 0.6:
        return 4
    if spread < 3.0:
        return 1
    return 2 if end > start else 4


with tempfile.TemporaryDirectory() as tmp:
    for clip in sys.argv[1:]:
        wav = os.path.join(tmp, "clip.wav")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", clip, "-ac", "1", wav], check=True)
        tone = tone_of(wav)
        print(os.path.splitext(os.path.basename(clip))[0], "none" if tone is None else tone, sep="\t", flush=True)
