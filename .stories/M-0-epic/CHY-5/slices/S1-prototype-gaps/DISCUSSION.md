# CHY-5 S1 — discussion
ACs: AC4

## Current behaviour (verified, with anchors)
- [AC4] W2 is already prototyped: `prototype/w1-word.html:161` renders the thin entry when the word is not taught, with "Thêm vào từ của tôi" (`:284`). **Not a gap.**
- [AC4] X2 is already prototyped as a sheet inside `w1-word.html:133-141` (chips Nghĩa sai … Khác, Gửi disabled until a chip, toast "Đã gửi. Cảm ơn bạn!" `:321`). **Not a gap.**
- [AC4] M1 mock list exists as the "Thi thử" block of `t3-practice.html:103-123` (level tabs, lock reason per level).
- [AC4] M2 runner does not exist: `p2-skill.html?k=thi` is an intro card that says "Chưa có đề trong bản demo" (`p2-skill.html:62`). **Gap → TASK.**
- [AC4] M3 mock result: no file. **Gap → TASK.**
- [AC4] P1 Landing: no prototype file. App scaffold exists: `src/routes/+page.svelte` (logo, title, lede only). Brief: `docs/screens.md` P1 row (Vietnamese-first, Hán Việt, Cast, 2–3 illustrations, CTA "Bắt đầu học" → P2). **Gap → TASK.**
- [AC4] X1 Tra nhanh: no file and no tap-to-lookup anywhere (CHY-38 notes L5 has none). Data is there: `prototype/data/dict.json` (695 KB). **Gap → TASK.**
- [AC4] Question bank for a mock: `prototype/data/placement.js` (HSK-level question blocks), lesson data `data/h1-01.js` … `h5-01.js`. No HSK1 mock content exists (CHY-56 waits on `MockSection`).

- [AC4] HSK 3.0 Level 1 paper (CTI 汉考国际, released 2025-12, in force 2026-07): listening 4 parts × 5 = 20 q, ~12 min; reading 4 parts × 5 = 20 q, 20 min; ~40 min total. Types: L1 phrase → pick picture A/B/C · L2 question → pick answer A/B/C · L3 dialogue → match picture A–F · L4 statement + question → A/B/C · R1 sentence → match picture A–F · R2 question → match reply A–F · R3 gap → word bank A–F · R4 sentence + ★ question → A/B/C. Source: Konfuzius-Institut Heidelberg PDF "新版HSK（1-6级）考试结构与样题示例".
- [AC4] Picture questions: L1 (5 × 3 pictures), L3 (6), R1 (6) → **~27 distinct pictures**. Art on disk: 8 HSK1 greeting scenes (`assets/words/*.png`: nihao, xiexie…), 57 HSK2–5 word scenes (`assets/words/h2-01…h5-01`). Concrete HSK1 nouns (apple, book, hospital) have none.

## Answered here (no human needed)
| Q | A | Source |
|---|---|---|
| Listening audio | browser zh-CN voice as stand-in, as `w1-word.html:173` does | prototype convention |
| How pictures are made | `scripts/gen-image.py OUT.png "prompt"` (opencode-go gpt-image-2, Cast lineup `assets/ref/cast.png` as reference, no per-image bill) | NOTES.md:85-90, `scripts/gen-image.py` |
| Mock score scale | each section /100, total /200, pass 120; HSK 3.0 L1 scale not in the CTI sample | old HSK1 paper (chinesetest.cn HSK1.pdf) |
| Play limit in Exam | 2 plays per item; new-format sample is silent | old HSK1 paper "每题听两次" (chinesetest.cn HSK1.pdf) |
| Which screens does S1 build? | P1, X1, M2, M3 | facts above; Loc Q1 "make prototypes for those" |
| Look and feel | same tokens/CSS as siblings (`lesson.css`, `onboard.css`, `step.js`) | prototype convention |
| M1 list | keep `t3-practice.html` Thi thử block; M2 starts from it | `t3-practice.html:123` links `p2-skill.html?k=thi` |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC4] | X1 home | B — standalone `x1-lookup.html` with sample text | Loc 2026-10-30 |
| 1 | Q2 [AC4] | mock length | B — full HSK 3.0 Level 1 paper, 40 questions | Loc 2026-10-30 |
| 1 | Q3 [AC4] | modes | A — Exam and Practice, chosen on the intro card | Loc 2026-10-30 |
| 2 | Q4 [AC4] | pictures for 15 picture questions | B — generate ~20 new HSK1 pictures in the Cast style now ("gotta do it sooner or later") | Loc 2026-10-30 |

### Q1 [AC4] Owner: Loc — X1 as its own demo page, or wired into the lesson screens?
Setup: X1 is a sheet that opens over any tapped hanzi. W2 and X2 live inside `w1-word.html`, not in their own files.

| | A — wire into `l5-dialogue`, `l4-grammar`, `l3-words` + a shared `lookup.js` | B — standalone `x1-lookup.html` with sample text |
|---|---|---|
| files touched | **4** (1 new + 3 lessons) | 1 |
| shows "never covers the tapped text" in real lesson layout | yes | only on sample text |
| matches CHY-38 examples (dialogue, grammar, word card) | 3 of 3 | 0 of 3 |

**Gap: 3 lesson screens.**
➡️ A — X1 only means something on top of lesson text; CHY-38's own examples are those 3 screens.

### Q2 [AC4] Owner: Loc — What questions does the M2 mock run?
Setup: HSK1 mock content does not exist. A full HSK1 paper is ~40 questions (listening + reading).

| | A — short demo mock: 2 sections × 5 questions from `h1-01` + `placement.js` | B — full-length HSK1 shape: 40 questions |
|---|---|---|
| questions to write | **10** | 40 |
| shows timer, play limit, auto-submit, M3 per-section score | yes | yes |

**Gap: 30 questions.**
➡️ A — the prototype proves the flow; real mock content is CHY-56's job.

### Q3 [AC4] Owner: Loc — Does M2 prototype both Exam and Practice mode?
Setup: CHY-56: Exam = timer, play limit, answers at end; Practice = no timer, answer shown after each question.

| | A — both, chosen on the intro card | B — Exam only |
|---|---|---|
| modes | 2 | **1** |
| M3 review | after Exam; Practice ends on the same M3 | after Exam |

**Gap: 1 mode.**
➡️ A — the mode choice is on M1 in the brief; one runner with a flag costs little.

### Q4 [AC4] Owner: Loc — Where do the ~27 pictures for the picture questions come from?
Setup: 15 of the 40 questions show pictures (L1, L3, R1). Disk has 8 HSK1 greeting scenes + 57 scenes from HSK2–5 lessons; no apple, book, hospital etc.

| | A — reuse existing art, write those 15 questions around what's drawn | B — generate ~20 new HSK1 noun pictures in the Cast style | C — emoji/icon stand-ins |
|---|---|---|---|
| new images | 0 | **~20** | 0 |
| questions limited to HSK1 words | no — some pictures show HSK2–5 scenes | yes | yes |
| looks like the real app | yes | yes | no |

**Gap: ~20 images.**
➡️ A — the prototype proves the runner, not the art; CHY-56 makes the real mock content. If the Cast look matters here, pick B.
