# CHY-6 S2 — summary
ACs: AC2, AC3  ·  Commits: 61017bb (docs), state commit follows  ·  PR: set at open

## Shipped
- [AC2] `docs/content-schema.md:349` decision 1 marked decided 2026-11-02 (list next to compound only when taught on its own; Bài 1 numbers). Test: T1 ✓
- [AC2] `:344` lint 8 gains the one char clause (gate pool excluded). Test: T2 ✓, 9 lint rows kept
- [AC3] `:350` decision 2 lint: ≥1 item at lesson level only when `std` non-empty; `std: []` exempt. Test: T5 ✓, no hunk at `:102` (T6)
- [AC3] `:107` `why?: string`. Test: T4 ✓

## Deviated from plan
- None. Plan Task 5 commit message used as written; branch `CHY-6` reset to origin/main (ca1a241) per Captain.

## Not done / follow-up
- Parked (PARKED.md): content-classes.html `std?`, h3-g01 std [130], h5-01 17 words.

## Bài 1 walk (hand, lint 8 one char clause)
| Source | Chars inside a listed compound | Pattern token `你 / 您 / 你们 + 好` | Section-question tests.words | Result |
|---|---|---|---|---|
| doc example `:184` | 你, 好 | 你 ✓, 好 ✓ | 好 ✓ (listenSpeak `:211`) | 2 pass, 0 fail |
| `h1-01.yaml:36` (0 questions) | 你, 好 | 你 ✓, 好 ✓ | none | 2 pass, 0 fail |

## Verification run (final tree)
- T1 `grep '^1\. ~~'` → 1 hit with Decided 2026-11-02, 你好, pattern, tests.words
- T2 row 8 → 1 row with one char + tests.words; lint rows still 9
- T3 `git diff --quiet -- content/ docs/diagrams/` → exit 0; Bài 1 ids line count 1
- T4 `why?: string` → :107; `why: string` → 0
- T5 decision 2 → :350 has non-empty + exempt; T6 hunk at :102 → 0
- `git diff --stat` → 1 file, 4 insertions, 4 deletions
- `pnpm lint` (prettier --check + eslint) → exit 0
- Review nits applied (pre-push round 1): clause now keys on the word's `hanzi` length (polyphone ids like `行-hang`), pattern split set adds brackets and full-width punctuation.
