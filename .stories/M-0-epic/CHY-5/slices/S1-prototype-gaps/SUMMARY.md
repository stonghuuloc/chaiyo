# CHY-5 S1 — summary
ACs: AC4  ·  Commits: 2b6128f … 16ae757  ·  PR: #15  ·  Mode: team (impl + tester)

## Shipped
- [AC4] `prototype/p1-landing.html`: logo, Vietnamese pitch, 3 Cast points (single-pose avatars), "Bắt đầu học" → `p2-login.html`. ✓
- [AC4] `prototype/x1-lookup.html`: Bài 1 dialogue, a grammar example, a word card, 爸爸坐飞机去北京。, 我喝奶茶。; every hanzi is tappable. Longest dict match (≤4 chars) containing the tap, plus a chip row of sub-words. Sheet anchors below or docks on top, so it never covers the tap (198 taps, 0 overlaps). Taught → "Xem chi tiết"; untaught → "Thêm vào từ của tôi" + toast; saved (奶茶) → no button. ✓
- [AC4] `prototype/data/mock-h1.js`: the full HSK 3.0 Level 1 paper, 40 questions over 8 part types, all words level 1. `scripts/check-mock.mjs` → `ok 40 questions`, with ≤2 of each answer letter per part. ✓
- [AC4] `prototype/m2-mock.html`:
  - Exam: timers 12:00 and 20:00, 2 plays per item, no feedback, auto-submit at 0:00, ✕ confirm.
  - Practice: no timer, answer + Vietnamese explanation after each item.
  - ✓
- [AC4] `prototype/m3-result.html`: score /200 (2 × /100, pass 120), section bars, 40-row answer review. Best Exam score is saved in `localStorage` and shown on the M2 intro. ✓
- [AC4] Entry: `t3-practice.html` HSK 1 row "· làm thử bản demo"; `p2-skill.html?k=thi&lv=1` mode choice Thi thật / Luyện. ✓
- [AC4] 20 new Cast scenes in `assets/words/mock-h1/`; scenes are in `prototype/data/mock-h1-art.txt`. All 20 pass against NOTES.md "Art — locked" (sheet `screens/t2-pictures-v2.jpg`) and are uploaded to R2 (`assets_push.py`: uploaded 20, deleted 0). ✓

## Deviated from plan
- Art route: `gen-image.py` (opencode-go) returned HTTP 402 (no funds). Pictures were made with omp `generate_image` (openai-codex), using the same LOOK/STYLE strings and the `cast-v2.png` reference (Loc chose B).
- First picture set ignored the art rules ("one clear subject, warm paper background" in the plan). All 20 were regenerated as Cast storybook scenes. 电视 needed one retry.
- P1 thumbnails use `assets/avatars/*.png`, not sprite-sheet crops (7a7dead).
- Listening audio: 20 mp3 clips (`scripts/build-mock-audio.py`, lesson word voice Xiaoxiao), not browser `speechSynthesis` — macOS picked a male voice (Loc, 16ae757). Item 2 asks 杯子, not 喝水 (cup picture was an inference).
- Practice wrong answer: no step.js "quay lại ở phần ôn" hint (5f7823f, review round 1).

## Not done / follow-up
- Clip content not machine-checked (no ASR here): clip n is rendered from item n's text; Loc to listen to q02, q11, q16.
- Review nits, round 3: `mock-h1.js?v=1` not bumped; `build-mock-audio.py` keeps stale clips after a text edit.
- Review nits, not fixed: M3 "gần được rồi" shows on every fail; `check-mock.mjs` breaks on paths with spaces.
- X1 overflow max-height → PARKED.md.

## Verification run
Tester (agent-browser, 390×844):
- 7 pages, 0 console errors.
- X1 anchor test: 198 taps, 0 overlaps.
- Exam, Practice and M3 flows pass.
- `node scripts/check-mock.mjs` → ok 40 questions.

Pre-push review: round 1 (standard) 1 Important, fixed in 5f7823f; round 2 (quick) 0; round 3 (standard) 0 Important, 3 Nits.
