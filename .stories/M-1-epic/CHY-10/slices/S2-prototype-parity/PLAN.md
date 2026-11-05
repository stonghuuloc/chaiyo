# CHY-10 S2 — plan
ACs: AC2, AC3  ·  Spec rev 2  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-10 off main after S1, PR #35 (CHY-8 S3) and CHY-12's step-0 `parts[].pinyin` fix · run `pnpm install` first

## Files touched
- create: `src/lib/content/h1-01.parity.test.ts`
- create: `src/lib/content/fixtures/h1-01.prototype-questions.json` (19 questions transcribed from the prototype pages)
No product code, no prototype edits, no schema edits, no `content/` edits.
Depends on:
- S1 content, including Task 4 (`s-h1-01-18` pinyin → `bù kèqi` + spoken `bú kèqi`, which the citation check needs);
- CHY-8 S3 on main: `buildBundle`, `scopeFor`, `scripts/build-content.sh`, `pnpm import:content`;
- CHY-12's 3 `parts[].pinyin` tone marks. Without them the scoped import returns `{ errors }` and the test is red.

## Anchors (verified 2026-11-05 on main 9b7ab62 and PR #35 head 00f4ce9)
- `prototype/data/h1-01.js:12` `WORDS`, `:37` `SENTENCES`, `:49` `DIALOGUE`, `:54` `GRAMMAR`. The file is plain ESM, so vitest can `import()` it. Prototype word `chars` rows are `[hz, py, hv, vi]` (↔ Word `parts`); prototype `parts` rows are `[hz, name, vi]` (↔ Word `components`, e.g. `content/words/你.yaml`). `say` = `[spoken1, ' rest', note]`, so the spoken form is `say[0] + say[1]`.
- Question sources: `prototype/l4-grammar.html:118-125,126-150` (drills, order), `l5-dialogue.html:135-146` (dialogue), `l6-listen.html:90-235` (5 items), `l8-gate.html:150-166` (10 gate).
- Page → section map for AC3: warmup `l2-warmup.html:33-39` (PLAN of 6 cards), words `l3-words.html:62-64` (CHECK) and `:123` (render), grammar `l4-grammar.html:118` (DRILLS), dialogue `l5-dialogue.html:135` (showQ), listenSpeak `l6-listen.html:243` (render), writing `l7-writing.html:57` (CHARS), gate `l8-gate.html:155` (QUESTIONS).
- C2 on main: `src/lib/content/import/index.ts` exports `importContent(dir, sink, opts?: { refs?, only? })` and `createMemorySink()` (`sink.content` = the written `ImportedContent`). `derive/spoken.ts:26` `resolveSpoken` = authored `spoken` ?? `deriveSpoken(pinyin, hanzi)`, so every imported Word and Sentence has `spoken`. `derive/gate.ts` `gateCoverage` keys = all `sections.words.ids`, values = pool question ids.
- C3 (PR #35): `import/index.ts` also exports `buildBundle(content, id): Bundle`. `Bundle` = `{ sha, lesson (no gateCoverage/thin), sentences, questions: Question[], grammar, words: ImportedWord[], chars, gateCoverage, thin }`. `words` and `chars` keep `content` order. `chars` = Char entries whose hanzi occurs in a taught word (all 15 for h1-01). `scopeFor(dir, roots)` lives in `import/scope.ts` and is not re-exported from the barrel. `scripts/build-content.sh` = bundle import of `--only lessons/hsk1` into `static/content`, then `pnpm -s fonts static/content/<sha> static/fonts/lessons`.
- Lint refs: `lint/refs.ts:81` reads `CHAIYO_VAULT`; a missing dir makes `mnemonics` undefined, and check 7 is skipped. The `vi.stubEnv('CHAIYO_VAULT', …)` pattern is at `lint/refs.test.ts:7`.
- `vite.config.ts:56`: the vitest node project includes `src/**/*.{test,spec}.{js,ts}`. The CI `test:coverage` step runs every test, and CI has no vault.
- C4 (agreed rev 1): preserved on re-run = image, parts, components, spoken, collocations, authored hanviet, existing examples (kept first, max 3), hand senses (no `pos`, kept first and verbatim). Rewritten = pinyin, level, pos, generated senses/examples.

## Task 1 [AC2] Transcribe the 19 prototype questions into a fixture
File: `src/lib/content/fixtures/h1-01.prototype-questions.json` (new)
- Change: one object per prototype question, `{ id, section, page, kind, prompt, options?, answer }`, in page order (3 + 1 + 5 + 10). `id` is the S1 question id it must equal (`q-h1-01-g01..g03`, `d01`, `l01..l03`, `s01`, `f01`, `x01..x10`). Text is copied from the pages above: option strings, correct option, pinyin answers (zàijiàn, xièxie) and vi texts (e.g. 谢谢 "cảm ơn"). `prompt` holds the stem the learner sees (hanzi, vi, or the audio target text); an audio stem records the word or sentence text the clip says, and a vi prompt records the vi text only (x03 `không sao`), never the question title (`“không sao” viết thế nào?`).
- Test first: the Task 2 question comparison fails on an empty fixture, then passes.
- Verify: `pnpm test -- h1-01.parity`.

## Task 2 [AC2] Parity test: words, sentences, dialogue, grammar, questions
File: `src/lib/content/h1-01.parity.test.ts` (new)
- Change: `beforeAll`:
  1. `vi.stubEnv('CHAIYO_VAULT', join(tmpdir(), 'no-such-vault'))`.
  2. `const sink = createMemorySink()`, then `const r = await importContent('content', sink, { only: scopeFor('content', ['lessons/hsk1']) })`. Assert `'sha' in r`; on `errors`, fail with the error list.
  3. `const b = buildBundle(sink.content!, 'h1-01')`.
  `afterAll` calls `vi.unstubAllEnvs()`. All comparisons live in a pure `parity(b: Bundle, fixture): string[]` that returns mismatch names (e.g. `你 vi`); the `it.each` rows assert that their names are absent. Rows:
  - words, found by `hanzi` in `b.words`: `py` (NFC, whitespace removed), `hv`, `vi` ↔ `senses[0].vi`, `say[0] + say[1]` ↔ `spoken`. Prototype `chars` ↔ `parts`: hanzi, hanviet and vi exact. Pinyin is exact when the prototype syllable has a tone mark, else compared after NFD-stripping U+0300–U+036F from the word's value (`bù` → `bu`). Prototype `parts` ↔ `components` (hanzi, name, vi).
  - word `ex` ↔ the `b.sentences` entry with id `examples[0]`: hanzi and vi equal. `ex[1]` equals that sentence's `spoken` when the word has `say`, else its `pinyin`. Separately, the `不客气` example's `pinyin` equals the citation `bù kèqi`.
  - sentences `s01..s09` ↔ `s-h1-01-01..09` in `b.sentences`: hz, py, vi, speaker. `spoken` only where the prototype has it.
  - `DIALOGUE` ↔ `b.lesson.sections.dialogue.parts` (title; lines mapped s0N → s-h1-01-0N).
  - `GRAMMAR` ↔ `b.grammar[0]`: `pattern` joined with " + ", `explain` + "\n\n" + `more`, `examples` mapped s08/s09, and `wrong`/right ↔ `pitfalls[0]`.
  - questions: `b.questions` by fixture `id`. A resolver per type maps a question to `{ prompt, correct }` and compares it with the fixture row:
    - choice/fill: `options[answer]` equals the prototype answer, and the option *set* equals the prototype's. Authored order may differ: x03, x05, x07 and x09 list the answer elsewhere. `ref` prompts (audio, hanzi, image) resolve to the word or sentence hanzi; `vi` prompts resolve to their text.
    - order: the tiles as a multiset equal the prototype answer's characters (`[...tiles].sort()` equals `[...'你们好'].sort()`), and the answer sentence's hanzi, stripped of `！。`, equals `你们好`. Tile order is never compared: S1 and the prototype (`l8-gate.html:159`) both author it scrambled (`[们, 你, 好]`).
    - tone: the tone number of the prototype answer (`hǎo` → 3) equals `answer`, `prompt.ref` resolves to 好, and `syllable` is 0 (the prototype's four tone options are derived, not authored).
    - typePinyin: `answer` equals the prototype pinyin (`zàijiàn`, `xièxie`).
    - readAloud: `sentence` resolves to 不客气。.
    - freeAnswer: the prompt `vi` text equals the prototype stem, and `rubric` names 对不起.
- Test first: if CHY-12's fix is not on main yet, the import step goes red with the 3 `#3` errors; otherwise the first red is the empty fixture (Task 1).
- Verify: `pnpm test -- h1-01.parity`. Negative control: `parity(clone, fixture)`, where `clone = structuredClone(b)` with 你's `senses[0].vi` changed, equals exactly `['你 vi']`.
- Draft code (UNEXECUTED): `const { WORDS, SENTENCES, DIALOGUE, GRAMMAR } = await import(pathToFileURL(resolve('prototype/data/h1-01.js')).href)`; `import { scopeFor } from './import/scope'`.

## Task 3 [AC3] Section coverage table
File: `src/lib/content/h1-01.parity.test.ts` (same file, second `describe`)
- Change: a pure `coverage(b: Bundle): string[]` (gap names) over a 7-row table `{ section, page, check(b) }`:
  - Khởi động `l2-warmup.html`: `b.lesson.sections.warmup` equals `{}`; the 6 PLAN words ⊆ `sections.words.ids`.
  - Từ mới `l3-words.html`: for each id of `sections.words.ids`, `b.words.find(w => w.id === id)` exists with `image.file`, `pinyin`, `hanviet`, ≥ 1 sense, `parts` or `components`, and `examples[0]` in `b.sentences`.
  - Ngữ pháp `l4-grammar.html`: `b.grammar` ids = [h1-g01], its 2 `examples` in `b.sentences`, `drills.length === 3`.
  - Hội thoại `l5-dialogue.html`: 2 parts (Gặp nhau 4 lines, Chia tay 3), every line in `b.sentences` with a `speaker`, `questions.length === 1`.
  - Nghe nói `l6-listen.html`: `items` types in order tone, choice, choice, readAloud, freeAnswer.
  - Luyện viết `l7-writing.html`: `writing.chars` = [你, 好, 们], each in `b.chars` with `strokes` and `readings.length ≥ 1`.
  - Gate Test `l8-gate.html`: `pool.length === 20`, `draw === 10`, the 10 fixture gate ids present, and every `b.gateCoverage[id]` has length ≥ 2.
- Test first: run with S1 content before Task 3 is wired. Expect the rows to name missing fields, if any.
- Verify: `pnpm test -- h1-01.parity`. Negative control: `coverage` is a pure function of the bundle. Pass it a `structuredClone(b)` with `lesson.gate.pool = []` and every `gateCoverage` list emptied. An on-disk copy would fail lint check 8, and the import would return `{ errors }`. Expect gaps only in the Gate Test row.
- The 3 mini-checks after words 3, 6 and 9 in `l3-words.html:62-64` are derived like the warm-up (CHY-32 "Mini-check"), not authored, and not diffed here.

## Task 4 [AC2, AC3] Prove it
- On one tree, all green: `pnpm test`, `pnpm check`, `pnpm lint`. `pnpm -s import:content content --sink memory --only lessons/hsk1` exits 0 and prints a 64-hex sha.
- Manual, Mac (CHY-13 AC3 real-bundle item): first make fontTools importable (`source ~/.capy/work/ft/bin/activate`, CHY-13's venv, or `pip install -r scripts/requirements-fonts.txt` into a venv; bare `python3` exits 1 with `ModuleNotFoundError: fontTools`), and run `pnpm install` after PR #35 (`scripts/import-content.ts` needs `pg`). Then `scripts/build-content.sh` exits 0. `static/content/<sha>/` holds `h1-01.json`, `h0-00.json`, `manifest.json` and `audio-manifest.json`, and `static/fonts/lessons/` holds `ukai-h1-01.woff2` and `ukai-h0-00.woff2`. Both dirs are git-ignored; `git status` stays clean. Report to the Captain that CHY-25's `vercel.json` gate is now met.

## Mutation paths covered
- Read-only test: it never writes `content/`. The negative controls edit an in-memory `structuredClone` only. The memory sink writes nothing to disk. `build-content.sh` writes only git-ignored `static/content/` and `static/fonts/lessons/`. CHY-12 rewrites words (C4), and the whitespace and tone-strip rules above absorb its pinyin edits.

## Rollback
`git revert` of this slice's commits; no migration.
