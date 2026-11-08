"""Cut a two-syllable clip to its first syllable. usage: cut-first-syllable.py <in.wav> <out.wav>
The cut is the intensity minimum between 25% and 70% of the voiced span, with 10 ms fade-in and 15 ms fade-out."""
import subprocess
import sys

import numpy as np
import parselmouth

src, out = sys.argv[1:3]
snd = parselmouth.Sound(src)
f0 = snd.to_pitch(time_step=0.01, pitch_floor=70, pitch_ceiling=400).selected_array["frequency"]
voiced = np.where(f0 > 0)[0]
if len(voiced) < 10:
    sys.exit("no voiced span")
t0, t1 = voiced[0] * 0.01, voiced[-1] * 0.01
intensity = snd.to_intensity(minimum_pitch=100, time_step=0.01)
times, values = intensity.xs(), intensity.values[0]
window = (times >= t0 + 0.25 * (t1 - t0)) & (times <= t0 + 0.7 * (t1 - t0))
cut = times[window][np.argmin(values[window])] if window.any() else (t0 + t1) / 2
start = max(0, t0 - 0.03)
subprocess.run(
    ["ffmpeg", "-y", "-loglevel", "error", "-ss", str(start), "-to", str(cut), "-i", src,
     "-af", "afade=t=in:d=0.01,afade=t=out:st=%f:d=0.015" % max(0, cut - start - 0.015), out],
    check=True,
)
