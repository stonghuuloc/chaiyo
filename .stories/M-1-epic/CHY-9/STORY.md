# CHY-9 — Linter: 9 contract checks

## Goal (business why, 1-2 sentences)
A content author (and the importer, CHY-8) learns about a bad lesson before it ships: the 9 rules of `docs/content-schema.md` "Linter" run over the content tree and report file, path, check number and message.

## Context an agent can't derive from code
- Rules: `docs/content-schema.md` Linter table + Primer lint bullet. Vault source rules: `~/Documents/second-brain/mandarin/_lesson-contract.md` (Mac only, not in CI).
- Schemas + `parseContent` are on main (CHY-7). Lint runs on parsed values, never raw YAML; schema errors are check 0.
- C1 (lint API, owner CHY-9) is in `handoffs/M-1/CONTRACTS.md`. CHY-8 `import(dir)` calls `lintDir`; any error writes nothing. CHY-8 exports `deriveSpoken` (`src/lib/content/derive/spoken.ts`) for check 4.
- `scripts/check-lesson.py` is the old Python linter for prototype lessons; not replaced here.
- Real `content/` is not lint-clean yet (h1-01 has an empty gate pool and no chars); making it clean is CHY-10/11/12, so this story proves checks on its own fixtures.

## Locked decisions (BA/Loc already ruled — never re-open)
- CHY-6 S2 (Loc, 2026-11-02): a single char beside its compound is listed only when taught on its own (lint 8 clause); `std: []` = vocabulary pattern.
- CHY-7 (Loc, 2026-11-03): schemas strict; errors carry file + dotted/indexed path.

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Each of the 9 checks fails on its own fixture, exactly 1 error | high | S1 |
| AC2 | A clean Bài 1 fixture reports 0 errors | high | S1 |
| AC3 | Primer skips checks 1–7 and word-count part of 8 | high | S1 |
| AC4 | CLI exits non-zero, one readable line per error | high | S2 |

## Out of scope
- Importer, derive steps, sinks (CHY-8); authoring real lessons/chars/words (CHY-10/11/12); the old Python `check-lesson.py`.
