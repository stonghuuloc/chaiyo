# CHY-8 S2 — plan
ACs: AC1, AC2  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-8 (after S1 and S4 are on it, and CHY-9's `lintDir` and CHY-10's Bài 1 content are merged) · run `pnpm install` first

## Anchors (verified 2026-11-03 on main 9007e33; items marked ⏳ come from lanes not merged yet)
- `src/lib/content/parse.ts:4-9` `ContentError`; `:16` `parseContent`. `schemas.ts:172` `Lesson`, `:209` `Primer` (`kind: 'primer'`), `:22` `Char`, `:42` `Word`, `:70` `Sentence`, `:81` `GrammarPoint`, `:115` `Question`, `:227` `Syllables`.
- ⏳ C1 (CONTRACTS.md): `src/lib/content/lint/` exports `lintDir(dir, opts?: { refs?, only? }) → { set: ContentSet; errors: LintError[]; notices }`; `ContentSet = { lessons, words, chars, grammar, sentences, syllables }` with `file` per item; `LintCheck` gains `10 = 'Derive'` (importer only). Read the merged file before coding; adapt names to what is on disk.
- ⏳ S1/S4 exports from `src/lib/content/derive/index.ts`: `resolveSpoken`, `deriveBacklinks`, `gateCoverage`, `deriveHanViet`, `deriveSeg`, `bundleHanzi`, `thinEntries`, `lessonWordEntries`, `parseDictionary`.
- Role mapping: `docs/content-schema.md:339` (drill / dialogue / listen / gate / mock): `sections.grammar.drills` → drill, `sections.dialogue.questions` → dialogue, `sections.listenSpeak.items` → listen, `gate.pool` → gate; Primer `sections.*.drills` → drill, `gate.pool` → gate.
- `.github/workflows/ci.yml` runs `pnpm check`, `pnpm lint`, `pnpm test:coverage` (thresholds `vite.config.ts:38`). `package.json` `imports` map `#lib/*`.
- No `rg`: use `grep`. Dependencies added: none (node `crypto`, `fs`, `os`).

## Task 1 [AC2] Sink contract + memory sink
Files: new `src/lib/content/import/sink.ts`, new `src/lib/content/import/sink.test.ts`
- Test first: `createMemorySink()` → `has(sha)` false; `write(c)` with `c.sha = 'A'` → `has('A')` true, `versions` = `[{ sha: 'A', createdAt }]`; then `write` B → `has('A')` false and `has('B')` true (has = current), `versions` length 2; writing A again → `has('A')` true, `versions` still length 2; `content` equals `c`; a failing write (`c` that throws while cloning, via a getter) leaves `versions` and `content` untouched.
- Change: `ImportedContent` type (fields as in SPEC, `sha` on it), `Sink` interface, `createMemorySink()`: `has(sha)` = `content?.sha === sha`; `write` builds the next state first (`structuredClone`), then assigns `content` and upserts the version row (new row per distinct sha, refreshed `createdAt` for a repeat) in one step.
- Verify: `pnpm vitest --run src/lib/content/import/sink.test.ts`

## Task 2 [AC2] Derive stage `assemble`
Files: new `src/lib/content/import/assemble.ts`, new `src/lib/content/import/assemble.test.ts`
- Test first: on `fixtures/ok`: every lesson/word/char/sentence/question appears; the free sentence `s-w-1` has `spoken`, `seg`, no `lessonId`; a literal Primer yields `gateCoverage: {}`, `thin: []`; a deep walk finds no `Map`/`Set`; 你好 `taughtIn` h1-01; sentences carry `spoken` (authored wins, else derived) and `seg`; questions carry roles per the Anchors mapping; every lesson has `gateCoverage` keys = its `sections.words.ids` and `thin` entries; a word whose char file is missing → `{ errors: [{ check: 10, name: 'Derive', path: 'hanviet', file: 'words/…' }] }`.
- Change: `assemble(set: ContentSet, dictionary: ReadonlyMap<string, ThinEntry>): { content: Omit<ImportedContent, 'sha'> } | { errors: LintError[] }`: backlinks over `set.lessons`; chars map from `set.chars`; per Word `resolveSpoken`, authored-else-`deriveHanViet` (a `{ missing }` → one check-10 error on the word's file); per non-Primer lesson `lessonWordEntries` (its keys are the `lessonWords` set for `deriveSeg`, since `sections.words.ids` may be ids like `打-da2`, not hanzi), `gateCoverage`, `thinEntries(bundleHanzi(...))` (grammar points looked up by `sections.grammar.ids`); a Primer gets `gateCoverage: {}`, `thin: []` and calls no S1/S4 function; free `set.sentences` are segmented with an empty lesson-word set; all `Map`s become plain objects before returning; sentences from lessons then from `set.sentences`, `deriveSeg` + `resolveSpoken`; questions flattened with role; every list sorted by key (lessons by level, order).
- Verify: `pnpm vitest --run src/lib/content/import/assemble.test.ts`

## Task 3 [AC1][AC2] `importContent` + canonical sha
Files: new `src/lib/content/import/import.ts`, new `src/lib/content/import/import.test.ts`, new `src/lib/content/import/fixtures/ok/**`
- Fixture: copy CHY-10's merged Bài 1 (`content/lessons/hsk1/h1-01.yaml`, its `content/words`, `content/chars`, `content/grammar/h1-g01.yaml`, `content/syllables.yaml` trimmed only if lint allows) plus a 20-row `dictionary.json` extract that includes 们 and 你; one free `content/sentences/ok.yaml` (1 sentence, id `s-w-1`) listed in one word's `examples` so lint 8 resolves it; CHY-11's `h0-00.yaml` once merged (assert Primer handling in `assemble.test.ts` with a literal Primer otherwise). First run `lintDir(fixtures/ok)` in a throwaway test: it must return `errors: []`. If not, STOP and report the check ids to the Captain; never edit lint or loosen a check.
- Test first (`import.test.ts`, helper `withTemp(fixture, mutate)` = `mkdtempSync` + `cpSync`; every test calls `vi.stubEnv('CHAIYO_VAULT', '/nonexistent')` and passes `refs` per C1; before relying on temp dirs, read C1's `loadRefs` and confirm refs do not resolve relative to `dir`): AC1 bad pinyin `ni hao` → `{ errors }` with check 3, stub sink spy `has`/`write` not called, memory sink empty; derive error (char file removed) → check 10, nothing written; a stub sink whose `write` throws → the call rejects with that error; malformed `dictionary.json` row → check 10 on `dictionary.json`; AC2 A → B → A (revert) rewrites A: results `{sha:A}`,`{sha:B}`,`{sha:A}`, 3 writes, `versions` length 2; twice → `toEqual({ sha: A })`, `write` once, `versions` length 1; comment-only YAML edit → same sha; `senses[0].vi` edit, a edit of the 们 row (not a lesson word, so its entry comes from the Dictionary) → different sha; no `dictionary.json` → success.
- Change: `importContent(dir, sink, opts?: { refs?: LintRefs; only?: string[] }): Promise<{ sha: string } | { errors: LintError[] }>`: `lintDir(dir, opts)`; errors → return sorted; read `<dir>/dictionary.json` if present → `parseDictionary` (a malformed row becomes a check-10 error on `dictionary.json`); `assemble`; errors → return; `sha = createHash('sha256').update(canonical(content)).digest('hex')` where `canonical` = `JSON.stringify` with recursively sorted object keys; `if (await sink.has(sha)) return { sha }`; `await sink.write({ ...content, sha })`; return `{ sha }`.
- Verify: `pnpm vitest --run src/lib/content/import`

## Task 4 [CHORE] Barrel + checks
File: new `src/lib/content/import/index.ts` (`export { importContent } from './import'; export { createMemorySink, type Sink, type ImportedContent } from './sink'`)
- Verify: `pnpm vitest --run src/lib/content && pnpm check && pnpm lint && pnpm test:coverage` → green, thresholds hold; `git status` shows only `src/lib/content/import/**`.

## Mutation paths covered
- Read-only on the content folder; the one writer is the sink (`write`), reached only after lint and derive pass. Re-run path: `has(sha)` short-circuits before `write`. Temp-dir mutations in tests are the only file edits; they never touch `content/`.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
```ts
const canonical = (v: unknown): string => JSON.stringify(v, (_k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x);
export async function importContent(dir: string, sink: Sink, opts?: { refs?: LintRefs }) {
  const { set, errors } = lintDir(dir, opts);
  if (errors.length) return { errors };
  const built = assemble(set, loadDictionary(dir));
  if ('errors' in built) return { errors: built.errors };
  const sha = createHash('sha256').update(canonical(built.content)).digest('hex');
  if (!(await sink.has(sha))) await sink.write({ ...built.content, sha });
  return { sha };
}
```
A fixture that cannot satisfy lint, or a C1 shape that differs from the anchors, is reported to the Captain, not hacked to green.

## Rollback
git revert of this slice's commits; removes `src/lib/content/import/`. No dependency, no migration, no change to `content/`.
