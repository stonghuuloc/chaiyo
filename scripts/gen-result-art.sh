#!/bin/sh
# Cast v2 scenes (NOTES.md "Cast v2"). Roles: panda cries / shy, red panda talks + comforts + teaches,
# fawn goes wild, takin is smug and selfish-cute. Reference lineup: assets/ref/cast-v2.png.
# Usage: scripts/gen-result-art.sh [name ...]   (no args = every scene below)
cd "$(dirname "$0")/.." || exit 1

LOOK="The characters must look exactly like the attached character lineup (left to right: the baby panda, the red panda, the sika deer fawn, the takin calf): same colours, faces and proportions, cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals. Every character is tiny, squat and round, about two heads tall, all the same height; characters always stand on the floor or ground, or sit on chairs or cushions, NEVER standing or sitting on top of tables or desks unless the prompt says so explicitly; arms are short stubs ending in small round paws with no fingers and no thumbs. Faces follow the mood in THIS prompt, not the lineup poses: in the lineup the panda is teary and the takin smug, but here nobody has tears, watery eyes or a worried frown unless this prompt says crying or tears; happy, greeting or excited characters have clearly happy faces (eyes curved into smiling arcs or bright shiny eyes, big open smile). The fawn has a plain tan face with a cream muzzle and white spots only on its back. No text, no letters, no numbers. The lineup image is only a reference for how they look: draw ONLY the characters named in this prompt, never add the other lineup characters, and no other creatures or people."
STYLE=". $LOOK Set them in a richly detailed, cozy illustrated background with warm golden lighting, like a storybook scene."
# Badges: one round sticker medallion centred on plain white (cut to a circle below).
BADGE=". Draw it as ONE round sticker badge centred in the image: a circular illustrated medallion about 70% of the image height, with a thick cream rim and a thin lantern-red outer ring, the scene inside the circle. Outside the circle is plain flat pure white, nothing else. $LOOK"
# Portraits for avatars and the talking frames: one character on plain white.
SOLO=". $LOOK Plain flat pure white background, nothing else."

scene() {
  case "$1" in
    # gate / test results → assets/results
    b0-pass) echo "In a cozy classroom with wooden desks and a blank green chalkboard, the panda standing at its desk crying happy tears, proudly holding up a round gold star badge on a red ribbon, the red panda next to it clapping and cheering, a graded test paper with a big red circle mark on the desk" ;;
    b0-fail) echo "Only the panda and the red panda. In a cozy classroom with wooden desks and a blank green chalkboard, the panda sitting at its desk with teary eyes, looking down at a test paper, the red panda standing beside the desk patting its head with an encouraging smile, soft afternoon light through the window" ;;
    b1-pass) echo "In a bright classroom with wooden desks and a blank green chalkboard, the panda crying happy tears and holding up a round gold star badge on a red ribbon, the red panda waving and cheering beside it, the fawn jumping wildly on top of a desk with arms flung up, paper confetti in the air" ;;
    b1-fail) echo "Only the panda and the red panda. In a classroom with wooden desks and a blank green chalkboard, the panda sitting at its desk with big teary eyes, clutching a test paper, the red panda standing next to it, the same small size, resting one round paw on its shoulder with a gentle encouraging smile" ;;
    hsk1-pass) echo "The panda crying happy tears and the red panda beaming, standing side by side and each holding up a blank cream paper certificate with a red stamp seal in the corner, the fawn behind them jumping and yelling with joy, sunny courtyard of a small exam hall" ;;
    hsk1-fail) echo "Only the panda and the red panda. The two sitting together on a bench outside a small exam hall, the panda sobbing and clutching a blank paper result sheet, the red panda leaning in with a gentle smile and a round paw on its back, soft sunset light" ;;
    # Home scenes → assets/home
    day-done) echo "Only the fawn. The fawn napping happily in a hammock between two trees in a flower garden at sunset, eyes closed with a content smile, rolling hills behind" ;;
    freeze-used) echo "All four characters snuggled together under a red quilted kotatsu blanket in a cozy room, snow falling outside the big window, the panda holding a warm cup, the red panda smiling, the fawn and the takin cosy, a lantern and a small plate of snacks on the low table" ;;
    lesson-next) echo "Only the panda. The panda stepping out of an open wooden front door onto a sunny garden path with a small determined smile, flowers along the path, hills in the distance, bright morning" ;;
    reviews-due) echo "Only the red panda. In a cozy study, the red panda sitting on a wooden chair BEHIND a wooden desk, the desk edge in front of its belly so only its upper body shows above the desktop (it is NOT sitting on the desk), smiling and holding up a small blank paper card in one paw, a neat stack of blank cards on the desk beside it, a paper lantern and bookshelves behind" ;;
    streak-at-risk) echo "Only the takin. At night in a cozy room, the takin looking nervously at a big wall clock near midnight with a sweat drop, a desk lamp glowing, dark blue sky through the window" ;;
    # word art (Bài 1) → assets/words
    nihao) echo "Only the panda. The panda at an open wooden garden gate waving hello with one round paw and a big friendly smile, sunny garden" ;;
    ni) echo "Only the panda and the red panda. On a garden path at sunset, the panda pointing one round paw at the red panda, who smiles back" ;;
    nin) echo "Only the panda. The panda bowing politely at the entrance of a traditional wooden shop with a cloth noren curtain, warm lantern light" ;;
    nimen) echo "All four characters. In a sunny meadow, the panda waving at the other three standing together, the red panda, the fawn and the takin all waving back" ;;
    hao) echo "Only the fawn. The fawn giving a big happy paw-up gesture in a flower garden with a rose arch, bright day" ;;
    xiexie) echo "Only the panda and the fawn. In a cozy living room, the fawn handing a small wrapped gift box to the panda, who receives it with both paws and a grateful happy face, cups of tea on a small table" ;;
    bukeqi) echo "Only the panda and the fawn. In a cozy living room, the panda holding a small wrapped gift box and thanking the fawn, who waves one paw modestly with a big smile as if saying it's nothing" ;;
    zaijian) echo "Only the panda and the red panda. On a village lane at sunset, the panda waving goodbye from the front, the red panda small in the distance down the lane waving back" ;;
    duibuqi) echo "Only the panda and the red panda. The panda standing at a wooden table beside a knocked-over teacup and a small tea spill, eyes full of tears, bowing its head to apologise to the red panda, who looks at it kindly, cozy evening kitchen" ;;
    meiguanxi) echo "Only the panda and the red panda. The red panda smiling warmly and waving one paw as if saying it is okay, while the teary panda looks up relieved, a knocked-over teacup and small tea spill on the wooden table between them, cozy evening kitchen" ;;
    # lesson cover → assets/lessons
    h1-01) echo "Only the panda and the fawn. The panda and the fawn meeting on a path by a calm lake with a small wooden bridge, the fawn waving hello excitedly and the panda shyly waving back, green trees, bright day" ;;
    # onboarding → assets/onboard
    welcome) echo "The panda, the red panda and the fawn standing together at an open wooden school gate on a sunny morning, the red panda waving hello with one round paw, the panda smiling shyly and hugging a small notebook, the fawn jumping with excitement, a stone path leading to a cozy little school with red paper lanterns" ;;
    level-up) echo "In a tidy exam hall with wooden desks, three big wooden blocks stacked like stairs, the panda standing on the middle block looking back with happy teary eyes, the red panda at the bottom cheering with both round paws raised, the fawn on the top block jumping wildly" ;;
    placed) echo "The fawn flinging open a wooden sliding classroom door with wild excitement, the panda and the red panda right behind peeking in happily, inside a cozy classroom with wooden desks and a blank green chalkboard, bright morning light" ;;
    start-b0) echo "Only the panda and the red panda. In a cozy classroom with wooden desks and a blank green chalkboard, the panda sitting at its desk opening a brand new notebook with a happy, determined face, the red panda sitting at the next desk leaning over with a warm smile, bright morning light" ;;
    # badges → assets/badges
    badge-first) echo "Only the panda. The panda taking a small brave first step onto a stone path with tiny happy tears, a little red paper lantern glowing beside the path, soft morning sky" ;;
    badge-streak7) echo "Only the fawn. The fawn jumping wildly with both stub arms flung up beside a small cheerful campfire, sparks flying, night sky with stars" ;;
    badge-streak30) echo "Only the red panda and the panda. The red panda proudly holding up a big glowing red paper lantern with a flame inside, the panda beside it the same size looking up with teary happy eyes, warm evening glow" ;;
    badge-words100) echo "Only the takin. The takin hugging a tall stack of small blank paper word cards possessively with a smug cute face, as if they are all its own, soft pastel background" ;;
    badge-hsk1) echo "Only the panda. The panda crying happy tears while holding up a blank cream paper certificate with a round red stamp seal in the corner, sparkles around it" ;;
    # avatars (cropped to 160 px) → assets/avatars; talking frames → prototype/talk
    av-panda|av-redpanda|av-fawn|av-takin) echo "Only the $(name "${1#av-}"). A head-and-shoulders portrait of the $(name "${1#av-}") facing front with a calm friendly face, centred, filling about 70% of the image height" ;;
    talk-redpanda|talk-panda) echo "Only the $(name "${1#talk-}"). The $(name "${1#talk-}") standing facing front, full body, centred, filling about 80% of the image height, calm friendly face with the mouth closed" ;;
    *) return 1 ;;
  esac
}
name() { case "$1" in redpanda) echo "red panda" ;; fawn) echo "fawn" ;; *) echo "$1" ;; esac; }

ALL="b0-pass b0-fail b1-pass b1-fail hsk1-pass hsk1-fail day-done freeze-used lesson-next reviews-due streak-at-risk nihao ni nin nimen hao xiexie bukeqi zaijian duibuqi meiguanxi h1-01 welcome level-up placed start-b0 badge-first badge-streak7 badge-streak30 badge-words100 badge-hsk1 av-panda av-redpanda av-fawn av-takin talk-redpanda talk-panda"

gen() {
  p="$(scene "$1")" || { echo "unknown: $1"; return 1; }
  case "$1" in badge-*) p="$p$BADGE" ;; av-*|talk-*) p="$p$SOLO" ;; *) p="$p$STYLE" ;; esac
  case "$1" in
    b0-*|b1-*|hsk1-*) out="assets/results/$1.png" ;;
    day-done|freeze-used|lesson-next|reviews-due|streak-at-risk) out="assets/home/$1.png" ;;
    h1-01) out="assets/lessons/$1.png" ;;
    welcome|level-up|placed|start-b0) out="assets/onboard/$1.png" ;;
    badge-*) out="/tmp/pyfix/badge-raw/${1#badge-}-raw.png" ;;
    av-*) out="/tmp/pyfix/av-raw/${1#av-}.png" ;;
    talk-*) out="/tmp/pyfix/talk-raw/${1#talk-}-closed.png" ;;
    *) out="assets/words/$1.png" ;;
  esac
  mkdir -p "$(dirname "$out")"
  tmp="/tmp/gen-$1.png"; rm -f "$tmp"
  python3 scripts/gen-image.py "$tmp" "$p" assets/ref/cast-v2.png > "/tmp/gen-$1.log" 2>&1
  # only replace the existing file once a new one actually arrived
  [ -s "$tmp" ] && mv "$tmp" "$out" && echo "ok   $out" || { echo "FAIL $1: $(tail -n 1 /tmp/gen-$1.log)"; return 1; }
  case "$1" in
    badge-*) magick "$out" -fuzz 6% -trim +repage -gravity center -background white -extent "%[fx:max(w,h)]x%[fx:max(w,h)]" -resize 256x256 \( -size 256x256 xc:none -fill white -draw "circle 128,128 128,2" \) -compose DstIn -composite "assets/badges/${1#badge-}.png" ;;
    av-*) magick "$out" -fuzz 4% -trim +repage -gravity center -background white -extent "%[fx:max(w,h)]x%[fx:max(w,h)]" -resize 160x160 "assets/avatars/${1#av-}.png" ;;
  esac
}
# Free scene with the shared STYLE (used by scripts/build-lesson-media.py): --prompt OUT "scene"
if [ "$1" = "--prompt" ]; then
  mkdir -p "$(dirname "$2")"; tmp="/tmp/gen-$$.png"; rm -f "$tmp"
  python3 scripts/gen-image.py "$tmp" "$3$STYLE" assets/ref/cast-v2.png > "$tmp.log" 2>&1
  [ -s "$tmp" ] && mv "$tmp" "$2" && echo "ok   $2" && exit 0
  echo "FAIL $2: $(tail -n 1 "$tmp.log")"; exit 1
fi


[ $# -eq 0 ] && set -- $ALL
# 8 at a time: the API is fine with that, ~100 s per wave
i=0
for n in "$@"; do gen "$n" & i=$((i + 1)); [ $((i % 8)) -eq 0 ] && wait; done
wait
