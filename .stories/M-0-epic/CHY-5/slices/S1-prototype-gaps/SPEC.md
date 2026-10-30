# CHY-5 S1 — spec
ACs: AC4  ·  Repo: chaiyo (`prototype/`, `assets/`)  ·  rev 1

## Behaviour
- [AC4] `prototype/p1-landing.html` exists and is the Landing Page: logo, one-line pitch in Vietnamese (Vietnamese-first, Hán Việt with every character, the Cast), 3 Cast illustrations from `assets/`, primary "Bắt đầu học" → `p2-login.html`. Shows no lesson content, Dictionary or audio (CONTEXT Landing Page). One column ≤430px, same tokens/fonts as `p2-login.html`. Verified by: open page, tap CTA, land on `p2-login.html`.
- [AC4] `prototype/x1-lookup.html` exists: sample text = Bài 1 dialogue lines, one grammar example and one word card from `data/h1-01.js`, plus 2 lines with words Bài 1 does not teach: 爸爸坐飞机去北京。 (untaught) and 我喝奶茶。 (奶茶 = seeded saved word, `lexicon.js:27-29`); every hanzi is tappable. Tap opens the X1 sheet with hanzi, pinyin, Hán Việt, meaning and a play button, from `data/dict.json`.
- [AC4] X1 never covers the tapped text: if the tapped line's bottom is in the upper half of the viewport, the sheet anchors below the line; otherwise it docks at the top above it. Verified by: tap a word on the first line and on the last line, the tapped glyph's box does not intersect the sheet's box.
- [AC4] X1 picks the longest dictionary match among all windows (≤4 chars) that contain the tapped character (tap the 2nd 谢 in 谢谢 → 谢谢; tap 机 in 飞机 → 飞机). A chip row lists the match plus its shorter sub-words, at any position, that have a `dict.json` row (飞机 · 飞; 北京 · 北); with none (谢谢: no 谢 row), no chip row shows.
- [AC4] X1 actions: a word taught in a lesson shows "Xem chi tiết" → `w1-word.html?w=<hz>`; an untaught word not in the Lexicon shows "Thêm vào từ của tôi", which calls the existing `addWord` and toasts "Đã thêm <hz> vào Từ của tôi"; a word already in the Lexicon shows neither add button nor toast. Esc or scrim tap closes.
- [AC4] `prototype/m2-mock.html` exists: the M2 Mock Test runner for HSK 1 in the HSK 3.0 Level 1 format — 40 questions: listening 4 parts × 5 (phrase → picture A/B/C; question → answer A/B/C; dialogue → picture A–F; statement + question → A/B/C), reading 4 parts × 5 (sentence → picture A–F; question → reply A–F; gap → word bank A–F; sentence + ★ question → A/B/C) (DISCUSSION Q2 → B, facts block).
- [AC4] Every mock word is HSK level 1 in `data/dict.json`. Listening audio uses the browser zh-CN voice (stand-in, as `w1-word.html:173`).
- [AC4] The mock's picture questions (listening parts 1 and 3, reading part 1) use ~20 new pictures in the Cast style under `assets/words/mock-h1/` (Q4 → B); no picture is reused from HSK2–5 lessons.
- [AC4] Entry: the HSK 1 row in `t3-practice.html` Thi thử keeps its lock reason and adds "· làm thử bản demo"; `p2-skill.html?k=thi&lv=1` keeps the lock line and shows a mode choice — **Exam** (default) and **Practice** — and "Bắt đầu" opens `m2-mock.html?mode=exam|practice` (Q3 → A). The "Chưa có đề trong bản demo" note goes away for HSK 1 only.
- [AC4] Exam mode: a timer per section (listening 12:00, reading 20:00) counts down in the top bar; each listening item plays at most 2 times, then its play button disables; no right/wrong shown until the end; at 0:00 the section auto-submits and the next section starts (or the paper ends). Leaving (✕) asks to confirm; confirm discards the attempt and returns to `t3-practice.html`.
- [AC4] Practice mode: no timer, unlimited plays, the right answer and a one-line Vietnamese explanation show after each answer of all 8 part types, picture parts included ("Kiểm tra" → "Tiếp"). Leaving needs no confirm.
- [AC4] `prototype/m3-result.html` exists: the M3 result for the attempt just finished — total out of 200 (each section scored /100, HSK scale), pass mark 120, per-section score bar, and "Xem lại đáp án" listing all 40 questions with the learner's answer vs the right one. Every finished Exam updates the best Exam score (`localStorage`, max), shown back on the M2 intro card.
- [LOCK] Prototype is static HTML served from the repo root; no build step; shared helpers come from `step.js`, `lesson.css`, `onboard.css`, `data/lexicon.js`.

## Not this slice
- Real HSK1 mock content and the `MockSection` type → CHY-56. Landing page in the app → CHY-29. Lookup in the app's lessons → CHY-38.
- Tap-to-lookup inside `l3/l4/l5` lesson screens (Q1 → B: standalone only).
- HSK 2–5 mocks, the Nói mock, M1 list redesign (exists in `t3-practice.html`).
- `docs/screens.md` / `CONTEXT.md` edits → S2.

## Seam
`prototype/{p1-landing,x1-lookup,m2-mock,m3-result}.html` (new), `prototype/data/mock-h1.js` (new, the 40 questions), `prototype/p2-skill.html` `thi` card; art in `assets/words/mock-h1/` via `scripts/gen-image.py`.

## Test contract
- [AC4] node check: `data/mock-h1.js` exports 2 sections × 4 parts × 5 items = 40; every `ans` is one of its `opts`; every word in prompts/options is level 1 in `dict.json`; every picture key has a file in `assets/words/mock-h1/`.
- [AC4] browser (agent-browser on the served prototype, 390×844): P1 CTA → P2; X1 first-line and last-line taps keep the tapped glyph uncovered; 2nd 谢 → 谢谢 with no chip row; 机 → 飞机 → chip 飞; taught (你好) / untaught (爸爸) / saved (奶茶) buttons; add → toast and the word shows in `t3-words.html`.
- [AC4] browser: Exam — timer shows 12:00 at start, play button disables after 2 plays, no feedback shown, ✕ asks to confirm; forcing time to 0 auto-submits the section. Practice — no timer, feedback after each answer. Finishing → M3 shows total /200, two section bars, 40 review rows.
- [AC4] browser: every page renders with no console error; screenshots of P1, X1 (top and bottom anchor), M2 each part type, M3.

## Open assumptions
- [AC4] Scoring: each section /100, total /200, pass 120 — the old HSK1 scale; the HSK 3.0 Level 1 scale is not in the CTI sample. Wrong pick costs one constant in `m3-result.html`.
- [AC4] Exam play limit 2 (old HSK1 "每题听两次"); the new-format sample is silent. Wrong pick costs one constant.
