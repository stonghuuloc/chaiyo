# CHY-6 S2 — discussion
ACs: AC2, AC3

## Current behaviour (verified, with anchors)
- [AC2] `docs/content-schema.md:349` decision 1 still open on main.
- [AC2] Doc Bài 1 example (`content-schema.md:183`) and `content/lessons/hsk1/h1-01.yaml:35` both list `[你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]` = 10 ids — de facto "both".
- [AC2] `content/words/你.yaml`, `好.yaml` exist; `q-h1-01-l01` tests `words: [好]` (`content-schema.md:211`).
- [AC2] Lint 8 (`content-schema.md:343`): word count 8–15; every lesson word tested in gate pool.
- [AC3] Decision 2 decided 2026-10-26 (`content-schema.md:350`); GrammarPoint type has `std: number[]` (`:102`) — ids consistent.
- [AC3] `:102` comment allows `std: []` = vocabulary pattern; `:350` lint says ≥1 item at exactly lesson level. `h1-g01.yaml` and `h4-g01.yaml` carry `std: []`.
- [AC3] Type `pitfalls[].why: string` required (`:107`); 0 of 12 `content/grammar/*.yaml` pitfalls have `why`.

## Answered here (no human needed)
- [AC3] Pitfalls render in `prototype/l4-grammar.html:105` "Hay nhầm" as Sai/Đúng pair only; no slot for `why`.
- [AC3] Q: are grammar ids still open? A: no — locked 2026-10-26, STORY.md. Only consistency remains.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC2] | single char inside a compound in `sections.words` | A — list both (Bài 1 stays 10 ids) | Loc, 2026-11-02 |
| 1 | Q2 [AC3] | lint ≥1 std item at lesson level vs `std: []` | A — `[]` exempt; lint applies when std non-empty | Loc, 2026-11-02 |
| 2 | Q3 [AC3] | `pitfalls[].why` required? | A — optional `why?` | Loc, 2026-11-02 |
| 2 | Q4 [AC2] | which single chars inside a compound are listed | B — only chars the lesson teaches on their own (grammar pattern part, or named in a question's `tests.words`); lint-checkable | Loc, 2026-11-02 |

## Open — needs an answer before spec

## Locked (do not re-open)
- Grammar point ids = own `h<L>-gNN`; each point carries `std` GF 0025-2021 item numbers (2026-10-26).
