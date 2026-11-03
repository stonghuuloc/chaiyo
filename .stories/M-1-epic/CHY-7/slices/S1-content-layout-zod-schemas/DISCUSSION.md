# CHY-7 S1 — discussion
ACs: AC1, AC2, AC3, AC4

## Current behaviour (verified, with anchors)
- [AC1] content/ holds words/ 67, grammar/ 12, lessons/hsk1..hsk5 5 files. Missing: cast.yaml, chars/, levels/, syllables.yaml, mock/hsk1/, lessons/hsk1/h0-00.yaml (content-schema.md:40-51).
- [AC2] No Zod schemas, no zod dependency, no YAML loader in src/ (package.json:24-58). yaml ^2.9.1 is a devDependency.
- [AC2] Doc TS types exist for Lesson 111-129, Word 74-86, Char 61-72, Sentence 89-97, GrammarPoint 99-108, Question 138-150, Primer 270-296. syllables has no type (49, 292, 301).
- [AC2] cast.yaml, levels/, mock/ have no type (42, 46, 50; voice and MockSection deferred 351-352).
- [AC2] Sentence and Question are embedded in lesson files (119, 123-128), never their own files.
- [AC4] Vitest node project includes src/**/*.{test,spec}.{js,ts} (vite.config.ts:33).
- Real content drift vs doc types: words carry hanviet + parts (67/67, derived per 308); 你好 level 0 (type 1-5); image without cast (67/67); lessons carry goal (5/5), sections.reading (hsk3-5); topic is a label not an id; 53 sentences carry spoken (no type field).

## Answered here (no human needed)
- [AC2] Lesson topic label vs id, scene.file path, h1-01 gate pool [] with draw 10: all are strings/arrays the schema accepts either way; cross-file and count checks are CHY-9 lint. Parked, no schema impact.
- [AC3] Embedded types report the lesson file plus a nested path, e.g. lessons/hsk1/h1-01.yaml at sentences[3].hanzi. Spec detail, AC text covers it.
- [AC2] warmup.extra, gate.draw, Prompt audio ref by word id: schema follows the TS type as written; derivation timing is importer work.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC2] | syllables.yaml shape | B — rows {syllable, initial, final} | Loc, 2026-11-03 |
| 1 | Q2 [AC1] | cast/levels/mock content | A — placeholders, no schema | Loc, 2026-11-03 |
| 1 | Q3 [AC2] | existing 84 files must parse | B — real content parses in S1; one decision per drift | Loc, 2026-11-03 |
| 1 | Q4 [AC3] | unknown keys | A — reject (strict) | Loc, 2026-11-03 |
| 2 | Q5 [AC2] | Sentence spoken override | A — add spoken?: string | Loc, 2026-11-03 |
| 2 | Q6 [AC2] | Word hanviet + parts | A — optional authored override | Loc, 2026-11-03 |
| 2 | Q7 [AC2] | level 0 | B — fix 你好 to level 1, Level stays 1-5 | Loc, 2026-11-03 |
| 2 | Q8 [AC2] | image.cast | A — optional | Loc, 2026-11-03 |
| 2 | Q9 [AC2] | Lesson goal | A — goal: string required | Loc, 2026-11-03 |
| 2 | Q10 [AC2] | Lesson reading section | A — reading?: { title, lines } optional | Loc, 2026-11-03 |
| 3 | Q11 [AC2] | Word image.prompt | A — optional | Loc, 2026-11-03 |
| 3 | Q12 [AC2] | component-shaped parts | B — rename to components?: { hanzi, name, vi }[] in 4 files | Loc, 2026-11-03 |
| 3 | Q13 [AC2] | Sentence.unknown bare hanzi | A — fix h3-01 data to objects (3 entries) | Loc, 2026-11-03 |

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- std [] exempt, why optional, compounds + chars listed (CHY-6 S2). contentSha optional, entry(hanzi) (2026-11-03).
