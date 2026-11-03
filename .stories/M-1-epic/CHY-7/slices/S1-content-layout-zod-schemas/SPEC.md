# CHY-7 S1 — spec
ACs: AC1, AC2, AC3, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] Listing `content/` shows cast.yaml, chars/, words/, grammar/, levels/, lessons/hsk1/, syllables.yaml and mock/hsk1/. Verified by: a test that asserts each path exists.
- [AC1] cast.yaml, levels/hsk1.yaml and mock/hsk1/ are placeholders with no schema (Q2 A): cast.yaml = `[]`, levels/hsk1.yaml = level 1 with an empty topic list, mock/hsk1/ and chars/ hold only a keep file.
- [AC1] syllables.yaml holds the full Mandarin base-syllable table as rows `{ syllable, initial, final }` (Q1 B), toneless, zero initial = `""`. Row count is 400–420; the source is cited in the commit.
- [AC2] Each of the 8 types (Lesson, Word, Char, Sentence, GrammarPoint, Question, Primer, syllables) has a Zod schema. Parsing a valid fixture of that type succeeds and returns the typed object (TS type inferred from the schema).
- [AC2] Schemas follow docs/content-schema.md Types, with the S1 decisions: Sentence `spoken?: string` (Q5 A); Word `hanviet?: string` and `parts?: { hanzi, pinyin, hanviet, vi }[]` (Q6 A); `image.cast` and `image.prompt` optional (Q8 A, Q11 A); Word `components?: { hanzi, name, vi }[]` for radical components of single-char words (Q12 B); Lesson `goal: string` required (Q9 A); Lesson `sections.reading?: { title, lines: SentenceId[] }` (Q10 A); Level stays 1–5 (Q7 B).
- [AC2] All 84 existing files under content/ (67 words, 12 grammar, 5 lessons) parse with 0 errors (Q3 B). Data fixes, and only these: words/你好.yaml level 0 → 1 (Q7 B); words/你, 刻, 好, 您 rename `parts` → `components` (Q12 B); lessons/hsk3/h3-01.yaml 3 `unknown: [ 阿 ]` → `[{ hanzi: 阿, pinyin: ā, vi: A (tiền tố tên) }]` (Q13 A). Any further drift found during execute is a stop-and-ask to the Captain, never a silent widening.
- [AC2] Embedded types (Sentence, Question) validate inside a Lesson and also standalone, so each has its own fixture.
- [AC3] Parsing an invalid fixture returns an error list, never a throw. Each error carries the file name and the field path, e.g. `{ file: "words/你好.yaml", path: "level", message }`. Nested paths use dot and index form: `sentences[3].hanzi`.
- [AC3] Unknown keys are errors (Q4 A): `collocatons: [...]` in words/你好.yaml → 1 error at path `collocatons`.
- [AC3] Malformed YAML (syntax error) also returns an error list with the file name and a line/column instead of a field path.
- [CHORE] docs/content-schema.md Types gain the same 8 field changes plus a `Syllable` type, so doc and schema agree.

## Not this slice
- Importer, Postgres rows, bundle build, derived fields (spoken sandhi, Hán Việt from chars, taughtIn) → CHY-8+.
- Cross-file checks (ids exist, topic id vs label, cast refs, gate pool ≥ 2×draw, scene path) and the 9 contract lints → CHY-9.
- Schemas for cast, levels, mock (deferred types) · lessons/hsk1/h0-00.yaml content.

## Seam
`src/lib/content/`: one schemas module (8 Zod schemas + inferred types) and one `parseContent(type, file, yamlText)` entry that returns `{ ok: true, value } | { ok: false, errors }`.

## Test contract
- [AC1] vitest: every AC1 path exists under content/; syllables.yaml parses and has 400–420 rows.
- [AC2] vitest: for each of the 8 types, `fixtures/<type>.valid.yaml` parses ok and the result equals the expected object.
- [AC2] vitest: every file under content/words, content/grammar and content/lessons parses with 0 errors (84 files).
- [AC3] vitest: for each of the 8 types, `fixtures/<type>.invalid.yaml` returns ok:false with ≥1 error whose `file` is the fixture name and whose `path` is the wrong field (a wrong-typed value, e.g. Word `level: "one"` → path `level`).
- [AC3] vitest: unknown key → error at that key; YAML syntax error → error with file and line.
- [AC4] `pnpm test` runs one valid and one invalid test per type (16) and all pass, with the layout and real-content tests also green.

## Open assumptions
- [AC1] syllables source: prototype/data/syllables.js (INITIALS, FINALS, SYL, cell — drives the W3 Pinyin Table, prototype/w3-pinyin.html:70). Assumed complete; if its count is outside 400–420, the implementer reports it instead of padding. Wrong source costs 1 file swap.
