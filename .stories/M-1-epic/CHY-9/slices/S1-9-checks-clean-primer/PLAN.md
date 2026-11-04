# CHY-9 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 2  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-9 · run `pnpm install` first (node_modules absent)

## Anchors (verified 2026-11-04 on main e4444ec)
- `src/lib/content/parse.ts:4-11` `ContentError` {file, path, message, line?, col?}, `ParseResult` · `:13` `formatPath` (not exported; lint builds its own) · `:16` `parseContent(type, file, text)`.
- `src/lib/content/schemas.ts:23` Char (`mnemonic` :31) · `:43` Word (`senses[].example` :57, `examples` :61) · `:79` Sentence · `:91` GrammarPoint · `:116` Question `section` (in `QuestionBase`; `:128` the discriminated union) · `:185` Lesson · `:215` PrimerSection · `:227` Primer (`kind: 'primer'`, gate `testOut`) · `:245` Syllables · `:249` `Sentences` · `:251` `schemas` map.
- `src/lib/content/derive/spoken.ts:5` `deriveSpoken(pinyin, hanzi)` is on main (`('bù kèqi', '不客气。')` → `'bú kèqi'`).
- `docs/content-schema.md:60` CastId · `:174` Bài 1 example · `:322` primer lint bullet · `:354-366` Linter table (`:365` row 8 with decision-1 clause, `:366` row 9).
- `data/sources/README.md:5` csv row · `data/sources/hsk30-grammar.csv` columns `No,Level,Group,Category,Details,Content`, level "7-9" → 7; No 1 = level 1, No 277 = level 4 (read with a CSV parser; `Content` holds commas).
- `package.json:16` `"test": "vitest --run --passWithNoTests"` · `:52` yaml · `:62` zod · `vite.config.ts:45` coverage excludes `src/**/fixtures/**` · `:56` vitest include `src/**/*.{test,spec}.{js,ts}`.
- `.prettierignore` covers `/content/` but not `src/lib/content/lint/fixtures/`: `pnpm lint` (`prettier --check .`) checks the fixtures.
- Vault (Mac only): `~/Documents/second-brain/mandarin/meo.py:28` `index()` → `{char: (lesson, pinyin, hv, {HÌNH, ÂM, ĐỜI THẬT, TƯƠNG PHẢN})}`.
- `content/lessons/hsk1/h1-01.yaml` (level 1) is the Bài 1 source for the fixture; `docs/content-schema.md:155-265` the worked example. `content/grammar/h1-g01.yaml` has `std: []`. No `rg` on the Mac: use `grep`.

## Task 1 [AC2] Types and clean Bài 1 fixture tree
Files: new `src/lib/content/lint/types.ts`, `src/lib/content/lint/fixtures/clean/` — `lessons/hsk1/h1-01.yaml`, `words/*.yaml` (10), `chars/{你,好,们}.yaml`, `grammar/h1-g01.yaml`, `syllables.yaml` (the rows h1-01 needs) — plus `src/lib/content/lint/fixtures/refs.ts` (injected `LintRefs`: 好 → [hǎo, hào], 你 mnemonic equal to the fixture's, `syllabus` from the CSV levels the fixture needs)
- Change: `types.ts` = C1 types (`LintError`, `LintCheck`, `ContentSet`, `LintRefs` = {polyphones: Map<string,string[]>, syllabus: Map<number,number>, mnemonics?: Map<string, Mnemonic>}), `type Mnemonic = Omit<NonNullable<Char['mnemonic']>, 'kind'>` (not on main: defined here), `CHECK_NAMES` (index 0–9), `CAST`, `SPEAKERS`. Fixture: copy h1-01 from `content/lessons/hsk1/h1-01.yaml` (19 sentences, dialogue parts, writing 你 好 们); fix what real content lacks: gate `pool` = 20 questions (`typePinyin`/`choice`), draw 10, every one of the 10 word ids in some `tests.words`; `q-h1-01-l01` is a `listenSpeak` question (not in the gate pool) and the only non-gate question testing 好; `你` and `好` in `tests.words` of a drill/dialogue/listenSpeak question (decision-1 clause, 好 also a token of h1-g01 pattern); every dialogue line has a speaker, each part uses both redpanda and takin (back-to-back same-voice pairs kept as in the doc example); `s-h1-01-18` pinyin `bù kèqi` with `spoken: bú kèqi`; 好 char lists `hǎo` and `hào`; word `parts` toned (`bù`, `xì`, `qì`) because real `对不起/没关系/不客气` parts carry `bu`/`xi`/`qi` (`content/words/对不起.yaml:12`, `没关系.yaml:13`, `不客气.yaml:14`); 们 reading `men` (neutral). Then `pnpm exec prettier --write src/lib/content/lint/fixtures` (a verbatim h1-01 copy, `[ 你, 好 ]`, fails `pnpm lint`).
- Test first: `src/lib/content/lint/fixtures/fixtures.test.ts` — every fixture file parses under its `parseContent` type (`Sentences` for sentence files).
- Verify: `pnpm vitest --run src/lib/content/lint/fixtures/fixtures.test.ts && pnpm exec prettier --check src/lib/content/lint/fixtures`

## Task 2 [AC1][AC2] Pinyin helpers, refs, loader, orchestrator
Files: new `src/lib/content/lint/util.ts`, `refs.ts`, `load.ts`, `index.ts`
- Change: `util.ts`: `stripTones(s)` (NFD, remove U+0300/0301/0304/030C, keep ü, NFC), `badPinyin(s)`, `ideographs(s)` (U+3400–9FFF), `pathOf(parts)` (same format as parse.ts:13). `refs.ts`: `loadRefs(root = process.cwd()): { refs, notices }` reads `polyphones.yaml` (an empty map until Task 3 ships the file) + `hsk30-grammar.csv` (CSV parser, `syllabus` = No → level); the vault arrives in Task 5 (`mnemonics` undefined, one notice). `load.ts`: `loadContentDir(dir, { only? })` walks `words`, `chars`, `grammar`, `lessons/**`, `sentences`, `syllables.yaml` (missing folder → `[]`), applies `only` (an entry selects a file when it equals its relative path or is a directory prefix, `entry + '/'`) before parsing, picks type by folder (lessons: peek `kind` → Primer else Lesson; sentence files → `parseContent('Sentences', …)`), maps ContentError → `LintError` check 0, drops invalid files from the set. `index.ts`: `lint(set, refs)` runs the check functions (`(set, refs) => LintError[]`, registered as Tasks 3–7 land), sorts by file, path, check; `lintDir(dir, { refs, only })` = `loadContentDir` + (refs ?? `loadRefs`) + lint, returns {set, errors, notices}.
- Test first: `src/lib/content/lint/load.test.ts` — `only: ['lessons/hsk1',…] skips a broken lessons/hsk2 file` (the broken file is added to a `mkdtemp` + `cpSync` copy of `fixtures/clean`, never committed into it), `only: ['words/你.yaml'] loads 你 but not 你们`, `no syllables.yaml → syllables []`, `invalid YAML becomes a check 0 error and valid files still load`, `missing sentences folder yields []`; `clean.test.ts` — `lintDir(fixtures/clean, { refs: fixtureRefs }) returns no errors` (injected refs, so no notice and the vault never matters). The `word outside only` test lands in Task 6, where check 8 exists.
- Verify: `pnpm vitest --run src/lib/content/lint/load.test.ts src/lib/content/lint/clean.test.ts`

## Task 3 [AC1] Checks 1, 2, 3 + polyphone table
Files: new `checks/1-hanviet.ts`, `2-polyphones.ts`, `3-tone-marks.ts`, `data/sources/polyphones.yaml` (read by `refs.ts` from Task 2)
- Change: check 1 at `schemas.ts:23` Char `readings[].hanviet`; check 2 compares NFC-normalised `readings[].pinyin` against `refs.polyphones`; check 3 scans the fields listed in SPEC (Word `schemas.ts:43`, Sentence `:79`, Char readings) incl. `content/sentences`, error if `badPinyin` (digit, or no tone mark and the whole string is not one NEUTRAL entry). `polyphones.yaml`: 得 着 行 当 发 种 重 假 觉 长 还 差 教 了 好 的 没 见 系 (19 chars; 没: méi, mò; 见: jiàn, xiàn; 系: xì, jì) with readings from `_readings.tsv` minus junk (行: xíng, háng; 得: dé, de, děi; 了: le, liǎo; 好: hǎo, hào; 长: cháng, zhǎng).
- Test first: `lint.test.ts` cases 1–3: Char 你 hanviet `—` → check 1 `readings[0].hanviet`; `chars/好.yaml` readings set to `[hǎo]` (refs list hǎo, hào) → check 2 at `readings`, 0 other errors; sentence pinyin `ni hao` → check 3 `sentences[0].pinyin`; Word pinyin `nǐ hao3` → check 3; 们 `men` passes; `qi lai` passes, `ni` fails.
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t "check [123]"`

## Task 4 [AC1] Checks 4, 5, 6
Files: new `checks/4-sandhi.ts`, `5-known-chars.ts`, `6-real-glyphs.ts`
- Change: check 4 imports `deriveSpoken` from `../derive/spoken`, runs on lesson-inline and `content/sentences` sentences with 一/不 and `spoken` present. Check 5: order lessons by (level, order), build known set from `Word.hanzi` of listed ids, per sentence subtract `unknown[].hanzi` chars; primer skipped. Check 6: recursive string walk (`Object.entries`) over each non-primer value, regex `/[\u2E80-\u2FDF]/`, path built while walking.
- Test first: `s-h1-01-06` spoken `bù kèqi` → check 4 `sentences[5].spoken` (`deriveSpoken('bù kèqi', '不客气。')` is `bú kèqi`); sentence containing 我 (no fixture word has it) and not in unknown → check 5; `⾒` (U+2F92) in a Word `senses[0].vi` → check 6; same sentence with `unknown: [{hanzi, pinyin, vi}]` → 0 errors (negative control).
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t "check [456]"`

## Task 5 [AC1] Check 7 + vault loader
Files: new `checks/7-mnemonic.ts`, extend `refs.ts`
- Change: `loadVaultMnemonics(dir)` runs `python3 -c "import sys,json; sys.path.insert(0,DIR); import meo; print(json.dumps({c:r[3] for c,r in meo.index().items()}, ensure_ascii=False))"` via `execFileSync`, maps HÌNH→hinh, ÂM→am, ĐỜI THẬT→doiThat, TƯƠNG PHẢN→tuongPhan; dir = `process.env.CHAIYO_VAULT` ?? `~/Documents/second-brain/mandarin`; no dir or python failure → undefined + notice "check 7 skipped: vault not found". Check 7 compares trimmed strings per field.
- Test first: injected map where `你.am` differs → check 7 `mnemonic.am`; no entry for the char → 0 errors; `refs.mnemonics` undefined → 0 errors; `loadRefs` with a missing vault dir → `refs.mnemonics` undefined and one notice.
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t "check 7"`

## Task 6 [AC1][AC3] Check 8 References
Files: new `checks/8-references.ts`
- Change: build indexes once (`Map` of word ids, sentence ids lesson ∪ sentence files with duplicate detection, grammar ids, CAST). Walk lessons (Lesson and Primer), words (including `senses[].example`), grammar for the refs in SPEC (a); lesson-only: (b) count, (d) untested word, (e) decision-1 clause (tokens of `GrammarPoint.pattern` split on `/[\s/+()（）\[\]［］，。、；：？！]+/`), (f) std via `refs.syllabus` (item not in CSV or level > lesson level: error at the grammar file `std[i]`; lesson with a non-empty `std` and none at its level: error in the lesson file at `sections.grammar.ids`); (c) both kinds. Primer: each section needs ≥1 drill (`sections.<name>.drills`), each `cards[].syllables[]` / `pairs[][]` entry (`typeof e === 'string' ? e : e.say`, C6 shape) piece after `stripTones` split on spaces must be in `set.syllables` (path `sections.finals.cards[2].syllables[1]`), pool questions need `q.section` (typed on main, `schemas.ts:116`) covering the 5 names.
- Test first, one case per sub-item, each → exactly 1 check 8 error and no other check:
  - unknown word id: append `xx` to `gate.pool[0].tests.words`.
  - unknown sentence id: `warmup.extra: ['s-xx']` (not a dialogue line).
  - Word `senses[0].example: s-xx` on 你 → error at `senses[0].example` in `words/你.yaml`.
  - unknown grammar id, Cast id `scene.cast: [hachiware]`.
  - 9 words: drop 你好 from `sections.words.ids` (dropping 再见 or 您 trips check 5).
  - 16 words: add six new two-char Word entries with fresh chars and put their ids in a pool question's `tests.words` (else (d) fires six times).
  - pool 19 vs draw 10: drop a pool question whose words other questions also test.
  - word 再见 never tested: remove it from every pool `tests.words`.
  - 好 beside 你好 with 好 removed from the pattern `你 / 您 / 你们 + 好` and from `q-h1-01-l01`'s `tests.words`.
  - std: h1-g01 `std [1, 277]` → 1 error at `grammar/h1-g01.yaml` `std[1]` (277 is level 4); h1-01 `level: 2` with h1-g01 `std [1]` → 1 error at `sections.grammar.ids` (a single `std [277]` gives 2 errors, so it is not used).
  - `lintDir` with `only` leaving 再见's file out: `toContainEqual({ check: 8, path: 'sections.words.ids[9]' … })`, no count asserted (the missing word also trips the pool, `tests.words` and check 5).
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t "check 8"`

## Task 7 [AC1] Check 9 Audio
File: new `checks/9-audio.ts`
- Change: over `lesson.sentences`: `speaker` present and not in `SPEAKERS` → error at `sentences[i].speaker`; over `dialogue.parts[].lines` resolve ids to sentences (an id that does not resolve is skipped; check 8 reports it): missing speaker → error at `sections.dialogue.parts[p].lines[l]`; a part with fewer than 2 distinct speakers (counted among `SPEAKERS`) → 1 error at `sections.dialogue.parts[p]`. Same-voice neighbours are NOT an error.
- Test first: speaker `panda` set on `s-h1-01-08` → 1 check 9 at `sentences[7].speaker`, 0 check 8 (its part keeps ≥2 voices among the other lines); a line with its `speaker` removed, chosen from a repeating voice (one T of R·T·T·R) → 1 error; a part where every line is takin → 1 error; R·T·T·R → 0 errors; reading line without speaker → 0 errors; a dialogue line id replaced by `s-xx` (one T of R·T·T·R) → exactly 1 error, check 8, none from check 9.
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t "check 9"`

## Task 8 [AC3] Primer fixture and skip proof
Files: new `fixtures/primer/lessons/hsk1/h0-00.yaml` (its syllable rows are appended to `fixtures/clean/syllables.yaml`; no second file), extend `lint.test.ts`
- Change: minimal primer (5 sections, 1 card + 1 drill each, pool 10 with draw 5 covering the 5 `section` values, 2 questions per section so one deletion leaves each section covered, syllables mā má mǎ mà ma …, one `pairs` entry as an object chip `{say: …}`). Test merges it into the clean set.
- Test first: `clean + primer → 0 errors` (word-count absent); mutations: syllable `xyz` → 1 check 8; `pairs` entry `{say: 'xyz'}` → 1; `sections.tones.drills = []` → 1; pool of 9 → 1; delete `section` from `gate.pool[0]` → 1; primer card `explain` containing `⾒` (U+2F92; in `syllables` it would trip check 8) → 0 errors.
- Verify: `pnpm vitest --run src/lib/content/lint/lint.test.ts -t primer`

## Task 9 [CHORE] Docs sync
Files: `docs/content-schema.md:365-366` (add the std clause to row 8; row 9 → "≥2 distinct speaking voices per dialogue part, every line has a speaker"), `data/sources/README.md:5` (add polyphones.yaml row). The C1 edit is already in CONTRACTS.md:38-40.
- Verify: `pnpm check && pnpm lint && pnpm test` all green.

## Mutation paths covered
- Read-only linter; the one write surface is data (`polyphones.yaml`). Each check is covered through the loader path (Task 2) and the in-memory mutation path (clean tree cloned, one field changed), which are the two ways content reaches `lint`.

## Draft code (UNEXECUTED — adapt to what's on disk)
```ts
export const stripTones = (s: string) =>
  s.normalize('NFD').replace(/[\u0300\u0301\u0304\u030C]/g, '').normalize('NFC');
const MARK = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
export const badPinyin = (s: string) => {
  const t = s.normalize('NFC').toLowerCase();
  return /\d/.test(t) ? 'digit' : MARK.test(t) || NEUTRAL.has(t.trim()) ? null : 'no tone mark';
};
```
A self-contradictory fixture, or a doc rule the schema cannot express, is reported to the Captain, not hacked to green.

## Rollback
git revert of this slice's commits; removes the lint folder and `polyphones.yaml`. No migration.
