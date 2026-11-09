#!/usr/bin/env python3
"""Shrink PNG art the way TinyPNG does: cap the long edge, then palette-quantize with dithering.
Library: compress_png(src, dst), check_budget(paths). CLI: python3 scripts/img_compress.py [--budget] FILE_OR_DIR...
(compresses in place unless --budget, which only checks sizes and exits 1 above BUDGET)."""
import shutil, subprocess, sys, tempfile
from pathlib import Path

MAX_EDGE = 860       # UI shows art at <= 430 px wide (prototype/lesson.css): 2x for retina
QUALITY = '60-90'
IM = ['magick'] if shutil.which('magick') else ['convert']    # ImageMagick 7 vs the 6 on ubuntu runners
BUDGET = 400_000     # bytes per image; assets_push refuses to upload above this


def compress_png(src, dst, max_edge=MAX_EDGE, quality=QUALITY):
    """Write a resized + quantized copy of src to dst (never upscales; alpha kept). Returns dst's size in bytes."""
    src, dst = Path(src), Path(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        resized = Path(tmp) / 'r.png'
        subprocess.run([*IM, str(src), '-resize', f'{max_edge}x{max_edge}>', '-strip', str(resized)], check=True)
        out = Path(tmp) / 'q.png'
        r = subprocess.run(['pngquant', '--quality', quality, '--speed', '1', '--floyd=1', '--strip',
                            '--output', str(out), str(resized)], capture_output=True)
        if r.returncode == 99:    # quality floor not reachable at 256 colours: take the best palette anyway
            r = subprocess.run(['pngquant', '--quality', '0-90', '--speed', '1', '--floyd=1', '--strip',
                                '--output', str(out), str(resized)], capture_output=True)
        if r.returncode:
            raise RuntimeError(f'pngquant failed on {src}: {r.stderr.decode(errors="replace").strip()}')
        shutil.copyfile(out if out.stat().st_size < resized.stat().st_size else resized, dst)
    return dst.stat().st_size


def check_budget(paths, budget=BUDGET):
    """Return [(path, size)] for every file above budget."""
    return [(str(p), Path(p).stat().st_size) for p in paths if Path(p).stat().st_size > budget]


def main(argv):
    check_only = '--budget' in argv
    files = []
    for a in argv:
        if a.startswith('--'):
            continue
        p = Path(a)
        files += sorted(p.rglob('*.png')) if p.is_dir() else [p]
    if not check_only:
        for f in files:
            compress_png(f, f)
    over = check_budget(files)
    for p, s in over:
        print(f'over budget: {p} {s} > {BUDGET}', file=sys.stderr)
    return 1 if over else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
