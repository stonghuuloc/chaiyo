# CHY-10 S2 — discussion
ACs: AC2, AC3

## Current behaviour (verified, with anchors)
- [AC2] `prototype/data/h1-01.js` (59 lines) holds 10 words, 9 sentences, 2 dialogue parts, 1 grammar point; no questions.
- [AC3] l2-warmup.html:35 reviews Bài 1 words as Bài 2's warm-up ("Ôn lại Bài 1"); docs/content-schema.md rule 5 derives warm-ups.
- [AC3] No section screens exist: `src/routes/(app)/lesson/[id]/[section]/+page.svelte` is one heading; CHY-31..35 build them.

## Answered here (no human needed)
- [AC3] S2 proves AC3 at bundle level: per section, every field the prototype page reads exists in the imported bundle; CHY-31..35 own the in-app render. Source: Captain default 2026-11-03. 85%.
- [AC2] Parity compares citation pinyin; spoken only where the prototype carries `say`/`spoken`. 85%.

- [AC2] CHAA-24 (CHY-12) keeps existing `senses` first and verbatim and appends generated ones, so `senses[0].vi` equals the prototype gloss (C4, 2026-11-03). 90%.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 10.Q2 [AC3] | Bài 1 Khởi động | A — `warmup: {}`; S2 proves the row by word coverage | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |
| 1 | 10.Q3 [AC2] | questions diff source | A — transcribe the 19 into a fixture, prototype stays frozen | Captain under Loc 80% rule, 2026-11-03 (Loc can veto at PICTURE) |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- 10 word ids (CHY-6 S2). One JSON bundle per lesson (ADR 0002).
