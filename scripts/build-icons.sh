#!/usr/bin/env bash
# One source PNG (rounded tile on transparent) → every logo/PWA icon size.
# Usage: scripts/build-icons.sh [source.png]   (default assets/brand/source.png; output static/brand)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=${1:-assets/brand/source.png}
OUT=static/brand
TILE='#c52f1c' # sampled from the source tile edge (vermilion, recoloured via scripts/recolor-tile.py)
mkdir -p "$OUT"
[ "$SRC" -ef assets/brand/source.png ] || cp "$SRC" assets/brand/source.png

# square, rounded, transparent corners: in-app / landing / README logo
magick assets/brand/source.png -trim +repage -background none -gravity center \
  -extent '%[fx:max(w,h)]x%[fx:max(w,h)]' -resize 1024x1024 "$OUT/logo.png"

# full-bleed square: the OS (iOS, Android launcher) applies its own corner mask
magick "$OUT/logo.png" -channel A -threshold 99% -morphology Erode Disk:10 +channel \
  -background "$TILE" -flatten "$OUT/icon-1024.png"  # erode drops the tile's soft rim
for s in 512 192 180 48 32; do magick "$OUT/icon-1024.png" -resize ${s}x${s} "$OUT/icon-$s.png"; done
mv "$OUT/icon-180.png" "$OUT/apple-touch-icon.png"

# maskable: art shrunk into the 80% safe circle so round launchers don't clip "Chaiyo!"
magick "$OUT/icon-1024.png" -resize 80% -background "$TILE" -gravity center -extent 1024x1024 \
  -resize 512x512 "$OUT/icon-maskable-512.png"

magick "$OUT/icon-48.png" "$OUT/icon-32.png" \( "$OUT/icon-32.png" -resize 16x16 \) "$OUT/favicon.ico"
rm "$OUT/icon-48.png"
ls -1 "$OUT"
