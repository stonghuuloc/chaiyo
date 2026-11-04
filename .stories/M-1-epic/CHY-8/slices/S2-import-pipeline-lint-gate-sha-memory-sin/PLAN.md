# CHY-8 S2 — plan
ACs: AC1, AC2  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-8 (after S1 and S4 are on it, and CHY-9's `lintDir` are merged) · run `pnpm install` first

## Anchors (verified 2026-11-04 on main 63d1735; items marked ⏳ come from lanes not merged yet)
- `src/lib/content/parse.ts:4-9` `ContentError`; `:16` `parseContent`. `schemas.ts:23` `Char`, `:43` `Word`, `:79` `Sentence`, `:91` `GrammarPoint`, `:128` `Question`, `:185` `Lesson`, `:227` `Primer` (`kind: 'primer'`), `:245` `Syllables`.
- C1 (CONTRACTS.md, merged): `src/lib/content/lint/` exports `lintDir(dir, opts?: { refs?, only? }) → { set; errors: LintError[]; notices: string[] }` (errors already sorted by file, path, check), `lint`, `loadContentDir`, `loadRefs` and types `ContentSet`, `LintError`, `LintRefs`. `ContentSet = { lessons, words, chars, grammar, sentences, syllables }` with `file` per item; `LintCheck` includes `10 = 'Derive'` (importer only). `CHECK_NAMES` and `issue` are not exported from the barrel: build check-10 errors as literals or import from `../lint/types` and `../lint/util`. `loadRefs` resolves against `process.cwd()`, not `dir`.
- S1 exports on main in `src/lib/content/derive/index.ts`: `deriveSpoken`, `resolveSpoken`, `deriveBacklinks` (takes `(Lesson | Primer)[]`: call with `set.lessons.map((l) => l.value)`), `gateCoverage`, `deriveHanViet` (takes `chars` as a `Record<string, Char>`: build `Object.fromEntries(set.chars.map((c) => [c.value.hanzi, c.value]))`). `gateCoverage` and `deriveBacklinks` return `Object.create(null)` objects; JSON handles them. ⏳ S4 exports (derive/index.ts has only the S1 ones today): `deriveSeg`, `bundleHanzi`, `thinEntries`, `lessonWordEntries`, `parseDictionary`.
- Role mapping: `docs/content-schema.md:339` (drill / dialogue / listen / gate / mock): `sections.grammar.drills` → drill, `sections.dialogue.questions` → dialogue, `sections.listenSpeak.items` → listen, `gate.pool` → gate; Primer `sections.*.drills` → drill, `gate.pool` → gate.
- `.github/workflows/ci.yml` runs `pnpm check`, `pnpm lint`, `pnpm test:coverage` (thresholds `vite.config.ts:38`). `package.json` `imports` map `#lib/*`.
- No `rg`: use `grep`. Dependencies added: none (node `crypto`, `fs`, `os`).

## Task 1 [AC2] Sink contract + memory sink
Files: new `src/lib/content/import/sink.ts`, new `src/lib/content/import/sink.test.ts`
- Test first: `createMemorySink()` → `has(sha)` false; `write(c)` with `c.sha = 'A'` → `has('A')` true, `versions` = `[{ sha: 'A', createdAt }]`; then `write` B → `has('A')` false and `has('B')` true (has = current), `versions` length 2; writing A again → `has('A')` true, `versions` still length 2; `content` equals `c`; a failing write (`c` that throws while cloning, via a getter) leaves `versions` and `content` untouched.
- Change: `ImportedContent` type (fields as in SPEC, `sha` on it), `Sink` interface, `createMemorySink()`: `has(sha)` = `content?.sha === sha`; `write` builds the next state first (`structuredClone`), then assigns `content` and upserts the version row (new row per distinct sha, refreshed `createdAt` for a repeat) in one step.
- Verify: `pnpm vitest --run src/lib/content/import/sink.test.ts`

## Task 2 [AC2] Derive stage `assemble`
Files: new `src/lib/content/import/assemble.ts`, new `src/lib/content/import/assemble.test.ts`, new `src/lib/content/import/fixtures/ok/**`
- Fixture: `cp -r src/lib/content/lint/fixtures/clean` plus `lint/fixtures/primer/lessons/hsk1/h0-00.yaml` into `import/fixtures/ok/`, add `sentences/ok.yaml` (`s-w-1`, listed in `words/你好.yaml` `examples`) and a 20-row `dictionary.json` from `prototype/data/dict.json` holding 们, 你, 你们 and 好. Run `pnpm prettier --write src/lib/content/import/fixtures` after creating it (`.prettierignore` does not exclude it). First run `lintDir(fixtures/ok, { refs: fixtureRefs })` in a throwaway test: it must return `errors: []` (CHY-9's `clean.test.ts` proves the clean part, `lint.test.ts:358` proves clean + Primer). If not, STOP and report the check ids to the Captain; never edit lint or loosen a check.
- Test first: on `fixtures/ok`: every lesson/word/char/sentence/question appears; the free sentence `s-w-1` has `spoken`, `seg`, no `lessonId`; the Primer yields `gateCoverage: {}`, `thin: []`; a deep walk finds no `Map`/`Set`; 你好 `taughtIn` h1-01; sentences carry `spoken` (authored wins, else derived) and `seg`; questions carry roles per the Anchors mapping; every lesson has `gateCoverage` keys = its `sections.words.ids` and `thin` entries; delete the `hanviet:` line of `words/你们.yaml` and delete `chars/们.yaml` → `{ errors: [{ check: 10, name: 'Derive', path: 'hanviet', file: 'words/你们.yaml' }] }` (deriveHanViet gets nǐ+men, finds 你, misses 们 → `{ missing: ['们'] }`; no lint check reads `writing.chars`, so lint passes).
- Change: `assemble(set: ContentSet, dictionary: ReadonlyMap<string, ThinEntry>): { content: Omit<ImportedContent, 'sha'> } | { errors: LintError[] }`: backlinks over `set.lessons`; chars map from `set.chars`; per Word `resolveSpoken`, authored-else-`deriveHanViet` (a `{ missing }` → one check-10 error on the word's file); per non-Primer lesson `lessonWordEntries` (its keys are the `lessonWords` set for `deriveSeg`, since `sections.words.ids` may be ids like `打-da2`, not hanzi), `gateCoverage`, `thinEntries(bundleHanzi(...))` (grammar points looked up by `sections.grammar.ids`); a Primer gets `gateCoverage: {}`, `thin: []` and calls no S1/S4 function; free `set.sentences` are segmented with an empty lesson-word set; all `Map`s become plain objects before returning; sentences from lessons then from `set.sentences`, `deriveSeg` + `resolveSpoken`; questions flattened with role; every list sorted by key (lessons by level, order).
- Verify: `pnpm vitest --run src/lib/content/import/assemble.test.ts`

## Task 3 [AC1][AC2] `importContent` + canonical sha
Files: new `src/lib/content/import/import.ts`, new `src/lib/content/import/import.test.ts`
XXFIX (`content/lessons/hsk1/h1-01.yaml`, its `content/words`, `content/chars`, `content/grammar/h1-g01.yaml`, `content/syllables.yaml` trimmed only if lint allows) plus a 20-row `dictionary.json` extract that includes 们 and 你; one free `content/sentences/ok.yaml` (1 sentence, id `s-w-1`) listed in one word's `examples` so lint 8 resolves it; CHY-11's `h0-00.yaml` once merged (assert Primer handling in `assemble.test.ts` with a literal Primer otherwise). First run `lintDir(fixtures/ok)` in a throwaway test: it must return `errors: []`. If not, STOP and report the check ids to the Captain; never edit lint or loosen a check.
- Test first (`import.test.ts`, helper `withTemp(fixture, mutate)` = `mkdtempSync` + `cpSync`; every test calls `vi.stubEnv('CHAIYO_VAULT', '/nonexistent')` and passes `refs: fixtureRefs` (`import { fixtureRefs } from '../lint/fixtures/refs'`), the same refs `clean.test.ts` uses; the stub env is only a safety net, `loadRefs` resolves against `process.cwd()`, not `dir`): AC1 bad pinyin `ni hao` → `{ errors }` with check 3, stub sink spy `has`/`write` not called, memory sink empty; derive error (no `hanviet:` line in `words/你们.yaml` and `chars/们.yaml` deleted) → one check 10 error `{ file: 'words/你们.yaml', path: 'hanviet' }`, nothing written; a broken `lessons/hsk2/x.yaml` in the temp dir → `{ errors }` without `only`, `{ sha }` with `only: ['lessons/hsk1', 'chars', 'sentences', 'syllables.yaml', 'words/…', 'grammar/…']` (C2 list: the `words/<id>.yaml` and `grammar/<id>.yaml` those lessons list); a stub sink whose `write` throws → the call rejects with that error; malformed `dictionary.json` row → check 10 on `dictionary.json`; AC2 A → B → A (revert) rewrites A: results `{sha:A}`,`{sha:B}`,`{sha:A}`, 3 writes, `versions` length 2; twice → `toEqual({ sha: A })`, `write` once, `versions` length 1; comment-only YAML edit → same sha; `senses[0].vi` edit, an edit of the 们 row's pinyin or meaning (not a lesson word, so its entry comes from the Dictionary; other columns are not in `ThinEntry` and do not change the sha) → different sha; no `dictionary.json` → success.
- Change: `importContent(dir, sink, opts?: { refs?: LintRefs; only?: string[] }): Promise<{ sha: string } | { errors: LintError[] }>`: `lintDir(dir, opts)`; errors → `return { errors }` (lintDir already sorts); read `<dir>/dictionary.json` if present → `parseDictionary` (a malformed row becomes a check-10 error on `dictionary.json`); `assemble`; errors → return (check-10 errors from `assemble` and `dictionary.json` are sorted by a local comparator in import.ts: file, then path, then check); `sha = createHash('sha256').update(canonical(content)).digest('hex')` where `canonical` = `JSON.stringify` with recursively sorted object keys; `if (await sink.has(sha)) return { sha }`; `await sink.write({ ...content, sha })`; return `{ sha }`.
- Verify: `pnpm vitest --run src/lib/content/import && pnpm prettier --check src/lib/content/import`

## Task 4 [CHORE] Barrel + checks
File: new `src/lib/content/import/index.ts` (`export { importContent } from './import'; export { createMemorySink, type Sink, type ImportedContent } from './sink'`)
- Verify: `pnpm vitest --run src/lib/content && pnpm check && pnpm lint && pnpm test:coverage` → green, thresholds hold; `git status` shows only `src/lib/content/import/**`.

## Mutation paths covered
- Read-only on the content folder; the one writer is the sink (`write`), reached only after lint and derive pass. Re-run path: `has(sha)` short-circuits before `write`. Temp-dir mutations in tests are the only file edits; they never touch `content/`.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
```ts
const canonical = (v: unknown): string => JSON.stringify(v, (_k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);
export async function importContent(dir: string, sink: Sink, opts?: { refs?: LintRefs; only?: string[] }) {
  const { set, errors } = lintDir(dir, opts);
  if (errors.length) return { errors };
  const dict = loadDict(dir); // no file → `{ ok: true, value: new Map() }`; else parseDictionary('dictionary.json', JSON.parse(text)); !ok → return { errors } as LintError check 10 'Derive', file dictionary.json; a JSON.parse throw → one check-10 error; sort with the local comparator
  if (!dict.ok) return { errors: dict.errors };
  const built = assemble(set, dict.value);
  if ('errors' in built) return { errors: built.errors };
  const sha = createHash('sha256').update(canonical(built.content)).digest('hex');
  if (!(await sink.has(sha))) await sink.write({ ...built.content, sha });
  return { sha };
}
```
A fixture that cannot satisfy lint, or a C1 shape that differs from the anchors, is reported to the Captain, not hacked to green.

## Rollback
git revert of this slice's commits; removes `src/lib/content/import/`. No dependency, no migration, no change to `content/`.
