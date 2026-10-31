# CHY-5 S2 — discussion
ACs: AC1, AC2, AC3

## Current behaviour (verified, with anchors)
- [AC1] `docs/screens.md:8` tab bar = Hôm nay · Lộ trình · Từ điển · Tôi; prototype tab bar = Hôm nay · Lộ trình · Luyện tập · Tôi (`prototype/t3-practice.html` text). **AC1 fails → TASK.**
- [AC1] Inventory `docs/screens.md:12-51` lists 36 rows. Prototype screens reached from `home-glass.html`: 32 files. Rows with no file: P1, M1, M2, M3, W2, X1, X2, R1, R2, T3 (Từ điển). Files with no row: `t3-practice`, `p1-session`, `p2-skill`, `t3-words`, `l0-gate`.
- [AC1] After S1 (PR #15, verified c3c6395): P1 = `p1-landing.html`, X1 = `x1-lookup.html`, M2 = `m2-mock.html`, M3 = `m3-result.html` exist. W2 and X2 already lived in `w1-word.html` (`:161`, `:133-141`), M1 in the `t3-practice.html` Thi thử block. Rows still with no file: R1, R2, T3 (Từ điển) — all three leave the doc (AC3). Prototype now has 47 `.html` files.
- [AC1] Before S1, Mock Test was in the prototype only as: `t3-practice.html` "Thi thử" block → `p2-skill.html?k=thi&m=…&lv=…`. No mock result file.
- [AC1] Non-screen files in `prototype/`: index pages `bai0`, `bai1`, `onboard`; `home.html` (orphan, superseded by `home-glass.html`, which every screen links to); `lesson.html` + `lessons.html` (link only to each other); design boards `palettes`, `logo-ideas`, `lesson-images`, `wireframes-core-loop`, `talk-sample`; `reset.html` (demo reset).
- [AC2] Memory is per skill: `p1-session.html` keys a card as `${skill}:${hz}`; skills `the` (flashcard), `nghe`, `viet` (`t3-practice.html` links `p1-session.html?skill=…`). `p2-skill.html` = Nói, Viết đoạn, Thi thử.
- [AC2] `CONTEXT.md:112-131` Dictionary/Lexicon: no search wording, but Lexicon says "each with the Learner's own review state" (one state per word, not per skill). `CONTEXT.md:163` Pinyin Table "always open in the Từ điển tab". **AC2/AC3 fail → TASK.**
- [AC3] `screens.md` hits: "Từ điển" ×4, "R1" ×7 lines, "R2" ×4 lines, "Tra từ" ×2. `CONTEXT.md` hits: "Từ điển" ×1 (`:163`); `:109` "từ điển Hán Việt" is a generic phrase (a Hán Việt dictionary), not the tab.
- [AC3] Backlog still holds tickets for screens with no prototype: CHY-29 Landing P1, CHY-38 Tra nhanh X1, CHY-56 Mock Test runner.

## Answered here (no human needed)
| Q | A | Source |
|---|---|---|
| Which home file is T1? | `home-glass.html` | every screen links to it; `home.html` links nowhere |
| Source of truth? | the prototype | STORY.md Locked |
| Other docs (NOTES, DESIGN, PRODUCT)? | untouched | STORY.md Out of scope |
| Pinyin Table entry point? | L0 hub only | `w3-pinyin.html` links only `l0-hub.html` |
| Screen that lives inside another file (M1, W2, X2)? | its row keeps its code; File column names the host file + part (`w1-word.html` sheet, `t3-practice.html` Thi thử) | Q3 → A added the File column; AC1 says "matches the screens", not one file per row |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | planned screens with no file | C — build prototypes for P1, X1, W2, X2, M3 so every row has a file | Loc 2026-10-30 |
| 1 | Q4 [AC2] | Dictionary term | A — keep, as lookup source only; no search | Loc 2026-10-30 |
| 2 | Q2 [AC1] | content preview page | A — tool, listed under "Not screens" | Loc 2026-10-30 |
| 3 | Q3 [AC1] | codes for practice screens | A — keep codes; K1 Luyện hôm nay, K2 Luyện kỹ năng; add File column | Loc 2026-10-30 |
| 2 | Q5 [AC1] | where prototype work lives | A — new S1 prototype gaps (its own AC); docs sync is S2 | Loc 2026-10-30 |

### Q1 [AC1] Owner: Loc — Planned screens with no prototype file: drop them from the inventory or keep them?
Setup: AC1 says "every screen listed has a prototype file". P1 Landing (CHY-29), X1 Tra nhanh (CHY-38), W2 Dictionary entry, X2 Báo lỗi and M3 mock result have tickets or briefs but no prototype file.

| | A — move out of the table | B — keep rows, file = "—" |
|---|---|---|
| inventory rows without a file | **0** | 5 |
| AC1 "every screen listed has a file" | passes | fails |
| briefs for P1/X1/W2/X2/M3 | kept in a "Not prototyped yet" list under the table, each with its ticket | kept in the table |

**Gap: 5 rows.**
➡️ A — AC1 holds literally and the briefs for planned tickets survive.

### Q2 [AC1] Owner: Loc — Is the content preview page (`lessons.html` → `lesson.html`) an app screen? (round 2)
Setup: `lessons.html` lists the first lesson of HSK 1–5 (h1-01 … h5-01). Tap one → `lesson.html?l=h2-01` shows that whole lesson on one long page: words, grammar, dialogue, reading, writing, test. No app screen links to it; the Learner reaches lessons through `l1-hub.html`.

| | A — tool, not a screen | B — a Learner screen |
|---|---|---|
| who opens it | us, to proof lesson content | a Learner |
| screens.md | one line under "Not screens" | **2** new inventory rows + briefs |

**Gap: 2 rows.**
➡️ A — it is a content-checking page for authors, like `palettes.html`.

### Q3 [AC1] Owner: Loc — Screen codes for the 2 new practice screens? (round 2)
Setup: screens.md gives every screen a short code (P1 = Landing, P2 = Login, R1 = review session). The prototype adds 2 practice screens, and their file names start with the same letters: `p1-session.html` (Luyện hôm nay), `p2-skill.html` (Luyện kỹ năng). R1/R2 must leave the doc (AC3), so the practice screens need new codes.

| | A — new code K1 / K2 | B — reuse the file prefix |
|---|---|---|
| Luyện hôm nay | **K1** | P1 → now two screens called P1 |
| Luyện kỹ năng | **K2** | P2 → now two screens called P2 |
| Landing / Login keep P1 / P2 | yes | no, must be renamed |

**Gap: 2 code clashes.**
➡️ A — K = Luyện tập; nothing else changes, and a File column shows `p1-session.html` next to K1.

### Q5 [AC1] Owner: Loc — Where does the prototype work from Q1 live?
Setup: 5 new prototype screens (P1, X1, W2, X2, M3) is design + HTML work; the docs edit is ~300 lines of Markdown. AC1 needs the files before screens.md can list them.

| | A — new slice S1 "prototype gaps", docs move to S2 | B — all in one slice S1 |
|---|---|---|
| PRs | 2, prototype first | 1 |
| PLAN size | 2 × ≤250 lines | **1 plan** with 5 screens + 2 docs (over 250-line cap likely) |

**Gap: 1 extra PR.**
➡️ A — each screen needs your look-and-feel review; docs then describe what you approved.

### Q4 [AC2] Owner: Loc — Does CONTEXT.md keep the Dictionary term?
Setup: no Dictionary search in the prototype. But Lexicon "tự thêm" words still come from the Dictionary (`prototype/data/lexicon.js:53`), and X1 Tra nhanh (CHY-38) looks words up in it.

| | A — keep, as lookup source only | B — delete the term |
|---|---|---|
| Dictionary entry | "words X1 can look up; no search screen" | removed; Lexicon/Word Page links rewritten |
| "tự thêm" words | still explained | **0** source left for them |

**No numeric gap** — the risk is CHY-38 losing its domain term.
➡️ A — AC2 bans the search, not the word list behind lookup.
