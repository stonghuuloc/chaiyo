# Recolour the logo's sunflower tile to Chaiyo vermilion; book pages, ink and the red "!" stay.
# Usage: python scripts/recolor-tile.py IN.png OUT.png [#c6301d]
import sys, colorsys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
target = sys.argv[3] if len(sys.argv) > 3 else '#c6301d'
tr, tg, tb = (int(target[i:i + 2], 16) / 255 for i in (1, 3, 5))
th, ts, tv = colorsys.rgb_to_hsv(tr, tg, tb)

img = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255
rgb, a = img[..., :3], img[..., 3:]
mx, mn = rgb.max(-1), rgb.min(-1)
s = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
d = np.maximum(mx - mn, 1e-6)
r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6

# tile = yellow/orange hue with real saturation; soft edge so cream pages and the rim blend
hue_ok = ((h > 25 / 360) & (h < 60 / 360)).astype(np.float32)
w = hue_ok * np.clip((s - .30) / .25, 0, 1)

# map tile value range (yellow ≈ v 1.0, s .76) onto the target, keeping the shading
ref_v, ref_s = 254 / 255, .756
nv = np.clip(mx / ref_v * tv, 0, 1)
ns = np.clip(s / ref_s * ts, 0, 1)
c = nv * ns
x = c * (1 - abs((th * 6) % 2 - 1))
m = nv - c
seg = int(th * 6)
base = [(c, x, 0), (x, c, 0), (0, c, x), (0, x, c), (x, 0, c), (c, 0, x)][seg]
new = np.stack([np.asarray(k, dtype=np.float32) * np.ones_like(nv) for k in base], -1) + m[..., None]

res = rgb * (1 - w[..., None]) + new * w[..., None]
Image.fromarray((np.concatenate([res, a], -1) * 255).round().astype(np.uint8)).save(out)
