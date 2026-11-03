# CHY-11 — Author Bài 0 Primer + syllables as YAML

## Goal (business why, 1-2 sentences)
Bài 0 (the pinyin Primer) and the Pinyin Table's syllable list live in `content/` as YAML that passes the Primer lint rules, so the importer (CHY-8) can build them without the prototype JS.

## Context an agent can't derive from code
- Sources: `prototype/data/h0-00.js` (5 sections, 29 cards, 4 drills each = 20, gate pool 24, draw 10) and `prototype/data/syllables.js`.
- `content/syllables.yaml` already exists from CHY-7: 405 rows, identical key set to `prototype/data/syllables.js` (verified). Nothing is authored there unless lint finds a gap.
- Target shape: `Primer` Zod schema (`src/lib/content/schemas.ts:209`) and docs/content-schema.md "Pinyin Primer (Bài 0)" (277-313). Prototype questions use a different shape (`t/key/opts/ans/why`) from the schema `Question`, so the content is converted, not copied.
- Primer lint rules (docs/content-schema.md:313): syllables and pairs exist in syllables.yaml; each section has ≥ 1 drill; gate pool ≥ 2 × draw and covers all 5 sections. The lint module is CHY-9's (contract C1); the importer is CHY-8's (C2).
- Lane fence (CONTRACTS.md): this story writes only `content/lessons/hsk1/h0-00.yaml` and edits to `content/syllables.yaml`.

## Locked decisions (BA/Loc already ruled — never re-open)
- ADR 0002: one static JSON bundle per lesson; Primer is not in the Lexicon and makes no review cards (content-schema.md:311).
- CHY-7 Q1 (Loc, 2026-11-03): `syllables.yaml` rows are `{syllable, initial, final}`; schemas are strict.

## AC index

| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Primer + syllables pass Primer lint rules, 0 errors, exit 0 | high | S1 |
| AC2 | Every card syllables/pairs entry exists in syllables.yaml; missing fails | high | S1 |
| AC3 | Each of 5 sections has ≥ 1 drill | high | S1 |
| AC4 | Gate pool ≥ 20 (≥ 2 × draw 10), covers all 5 sections | high | S1 |

## Out of scope
- The lint module and CLI (CHY-9/CHY-8), importer, audio rendering, bundle build, Bài 1 (CHY-10), words/chars (CHY-12), fonts (CHY-13).
