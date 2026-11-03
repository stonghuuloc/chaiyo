# CHY-10 S2 — plan
ACs: AC2, AC3  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-10

## Files touched
- create: `src/lib/content/h1-01.parity.test.ts`
- create: `src/lib/content/fixtures/h1-01.prototype-questions.json` (19 questions transcribed from the prototype pages)
No product code, no prototype edits, no schema edits. Depends on: S1 content (including Task 5, `s-h1-01-18` pinyin → `bù kèqi` + spoken `bú kèqi`, which the citation check needs), CHY-8 `import(dir, sink)` with the memory sink (C2), C3 bundle field names.

## Anchors (verified 2026-11-03)
- `prototype/data/h1-01.js:12` `WORDS`, `:37` `SENTENCES`, `:49` `DIALOGUE`, `:54` `GRAMMAR`; the file is plain ESM, so vitest can `import('../../../prototype/data/h1-01.js')`.
- Question sources: `prototype/l4-grammar.html:118-125,126-150` (drills, order), `l5-dialogue.html:135-146` (dialogue), `l6-listen.html:90-235` (5 items), `l8-gate.html:150-166` (10 gate).
- Page → section map for AC3: warmup `l2-warmup.html:33-39` (PLAN of 6 cards), words `l3-words.html:62-64` (CHECK) and `:123` (render), grammar `l4-grammar.html:118` (DRILLS), dialogue `l5-dialogue.html:135` (showQ), listenSpeak `l6-listen.html:243` (render), writing `l7-writing.html:57` (CHARS), gate `l8-gate.html:155` (QUESTIONS).
- `src/lib/content/content.test.ts:14-19` — `yamlFiles` helper pattern for reading `content/` in tests; `vite.config.ts:33` vitest node project includes `src/**/*.test.ts`.
- Contracts read 2026-11-03: C2 `import(dir, sink)` + `Sink`; C3 bundle `{ sha, lesson, sentences, questions, grammar, words, chars, gateCoverage, dictionary }`. C4 (written 2026-11-03, agreed rev 1): preserved on re-run = image, parts, components, spoken, collocations, authored hanviet, existing examples (kept first, max 3), hand senses (no `pos`, kept first and verbatim); rewritten = pinyin, level, pos, generated senses/examples.

## Task 1 [AC2] Transcribe the 19 prototype questions into a fixture
File: `src/lib/content/fixtures/h1-01.prototype-questions.json` (new)
- Change: one object per prototype question `{ section, page, kind, prompt, options?, answer }` in page order (3 + 1 + 5 + 10). Text copied from the pages above: option strings, correct option, pinyin answers (zàijiàn, xièxie), vi texts (e.g. 谢谢 "cảm ơn"). `prompt` holds the stem the learner sees (hanzi, vi, or audio target text); audio stems record the word or sentence text the clip says.
- Test first: the Task 2 question comparison fails on an empty fixture, then passes.
- Verify: `pnpm test -- h1-01.parity`.

## Task 2 [AC2] Parity test: words, sentences, dialogue, grammar, questions
File: `src/lib/content/h1-01.parity.test.ts` (new)
- Change: import `h1-01.js`; run `import('content', memorySink)`, assert `{ sha }`, read the stored lesson/words/sentences/grammar/questions from the sink. Tables (`it.each`):
  - words: `hz`, `py` (citation, NFC-normalised, whitespace removed: CHY-12 rewrites `pinyin`), `hv`, `vi` ↔ `senses[0].vi`, `say` spoken ↔ derived `spoken`, `chars` ↔ `parts` (hz, py, hv, vi), `parts` ↔ `components` (hz, name, vi);
  - word `ex` ↔ the sentence `examples[0]` resolves to (existing examples stay first, C4): hanzi and vi equal; `ex` pinyin equals the sentence's `spoken ?? pinyin`, and separately the sentence's `pinyin` equals the citation (`bù kèqi`, so a citation/spoken mix-up fails);
  - sentences `s01..s09` ↔ `s-h1-01-01..09` (hz, py, spoken, vi, speaker); DIALOGUE ↔ `sections.dialogue.parts`; GRAMMAR ↔ grammar point (`pattern` joined with " + ", `explain` + "\n\n" + `more`, `examples` mapped s08/s09, `wrong`/right ↔ `pitfalls`);
  - questions: a resolver per type maps an imported question to `{ prompt, correct }` and compares with the fixture row:
    - choice/fill: `options[answer]` equals the prototype answer and the option *set* equals the prototype's (authored order may differ: x03, x05, x07, x09 list the answer elsewhere); `ref` prompts (audio, hanzi, image) resolve to the word or sentence hanzi, `vi` prompts to their text;
    - order: `tiles` joined must equal the prototype answer (`你们好`); the sentence's hanzi stripped of `！。` must equal it too;
    - tone: the tone number of the prototype answer (`hǎo` → 3) equals `answer`, `prompt.ref` resolves to 好, `syllable` is 0 (the prototype's four tone options are derived, not authored);
    - typePinyin: `answer` equals the prototype pinyin (`zàijiàn`, `xièxie`); readAloud: `sentence` resolves to 不客气。; freeAnswer: prompt `vi` text equals the prototype stem and `rubric` names 对不起.
- Test first: write the table against the current content; run before the importer exists to see the red import step.
- Verify: `pnpm test -- h1-01.parity`; negative control: clone the imported content in memory, change one `vi`, expect exactly that mismatch named.
- Draft code (UNEXECUTED): `const { LESSON, WORDS, SENTENCES, DIALOGUE, GRAMMAR } = await import(pathToFileURL(resolve('prototype/data/h1-01.js')).href)`.

## Task 3 [AC3] Section coverage table
File: `src/lib/content/h1-01.parity.test.ts` (same file, second `describe`)
- Change: a 7-row table `{ section, page, check(bundle) }`:
  - Khởi động `l2-warmup.html`: `warmup` equals `{}`; the 6 PLAN words ⊆ `words.ids`;
  - Từ mới `l3-words.html`: 10 words in `words.ids` order, each with `image.file`, `pinyin`, `hanviet`, `senses`, `parts` or `components`, `examples[0]` resolvable;
  - Ngữ pháp `l4-grammar.html`: grammar point, its 2 example sentences, `drills.length === 3`;
  - Hội thoại `l5-dialogue.html`: 2 parts (Gặp nhau 4 lines, Chia tay 3), every line has a `speaker`, `questions.length === 1`;
  - Nghe nói `l6-listen.html`: `items` types in order tone, choice, choice, readAloud, freeAnswer;
  - Luyện viết `l7-writing.html`: `chars` = [你, 好, 们], each has a Char with `strokes` and `readings`;
  - Gate Test `l8-gate.html`: `pool.length === 20`, `draw === 10`, the 10 prototype questions present, `gateCoverage` has all 10 words.
- Test first: run with S1 content before Task 3 is wired, expect the rows to name missing fields if any.
- Verify: `pnpm test -- h1-01.parity`; negative control: the coverage table is a pure function of the imported content, so the test passes it a `structuredClone` with `gate.pool` emptied (an on-disk copy fails lint check 8 and the import returns `{ errors }`) → only the Gate Test row fails.
- The 3 mini-checks after words 3, 6 and 9 in `l3-words.html:62-64` are derived like the warm-up (CHY-32 "Mini-check"), not authored, and not diffed here.

## Task 4 [AC2] Prove it
- `pnpm test`, `pnpm check`, `pnpm lint` green on the same tree; `pnpm import:content --sink memory` exits 0 (C2 CLI).
- Field names for the bundle are taken from C3 once CHY-8 freezes it; until then the test reads the memory sink's `ImportedContent` through one adapter function at the top of the file.

## Mutation paths covered
- Read-only test: it never writes `content/`; the negative controls edit an in-memory clone only. CHY-12 rewrites words (C4) and CHY-8 may change field names (C3), so the adapter at the top of the file is the single place that moves.

## Rollback
`git revert` of this slice's commits; no migration.
