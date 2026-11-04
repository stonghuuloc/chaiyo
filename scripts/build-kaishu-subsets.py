#!/usr/bin/env python3
"""Subset assets/ukai.ttc face 0 into one WOFF2 per lesson of a content bundle.
Usage: python3 scripts/build-kaishu-subsets.py <bundleDir> <fontsDir> [--date YYYY-MM-DD]
Needs fonttools + brotli (scripts/requirements-fonts.txt)."""
import argparse
import datetime
import importlib.util
import json
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTCollection

HERE = Path(__file__).resolve().parent
UKAI = HERE.parent / 'assets' / 'ukai.ttc'
HAN = [(0x2E80, 0x2FDF), (0x3400, 0x4DBF), (0x4E00, 0x9FFF), (0xF900, 0xFAFF), (0x20000, 0x2FA1F), (0x30000, 0x3134F)]
MARKS = [(0x3000, 0x303F), (0xFF00, 0xFFEF)]


def _in(c, ranges):
    return any(a <= ord(c) <= b for a, b in ranges)


def glyph_set(node):
    if isinstance(node, dict):
        return set().union(*map(glyph_set, node.values()), set())
    if isinstance(node, list):
        return set().union(*map(glyph_set, node), set())
    if not isinstance(node, str):
        return set()
    han = {c for c in node if _in(c, HAN)}
    return han | {c for c in node if _in(c, MARKS)} if han else set()


def _stamp():
    spec = importlib.util.spec_from_file_location('stamp_arphic_notice', HERE / 'stamp-arphic-notice.py')
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.stamp


def build(bundle_dir, fonts_dir, date):
    bundle_dir, fonts_dir = Path(bundle_dir), Path(fonts_dir)
    manifest = json.loads((bundle_dir / 'manifest.json').read_text(encoding='utf-8'))
    glyphs = {
        lesson['id']: glyph_set(json.loads((bundle_dir / lesson['file']).read_text(encoding='utf-8')))
        for lesson in manifest['lessons']
    }
    cmap = TTCollection(str(UKAI)).fonts[0].getBestCmap()
    errors = [
        f"{lid}: U+{ord(c):04X} {c} is not in ukai.ttc face 0"
        for lid, chars in glyphs.items()
        for c in sorted(chars)
        if ord(c) not in cmap
    ]
    if errors:
        sys.exit('\n'.join(errors))
    fonts_dir.mkdir(parents=True, exist_ok=True)
    stamp = _stamp()
    options = subset.Options(flavor='woff2', font_number=0)
    for lid, chars in glyphs.items():
        font = subset.load_font(str(UKAI), options)
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=sorted(ord(c) for c in chars))
        subsetter.subset(font)
        out = fonts_dir / f'ukai-{lid}.woff2'
        subset.save_font(font, str(out), options)
        stamp(str(out), date)
        print(f'{lid}: {len(chars)} glyphs -> {out}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('bundle_dir')
    ap.add_argument('fonts_dir')
    ap.add_argument('--date', default=datetime.date.today().isoformat())
    a = ap.parse_args()
    build(a.bundle_dir, a.fonts_dir, a.date)
