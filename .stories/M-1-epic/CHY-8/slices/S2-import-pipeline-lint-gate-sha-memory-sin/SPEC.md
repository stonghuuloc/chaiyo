# CHY-8 S2 — spec
ACs: AC1, AC2  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `importContent(dir, sink, opts?: { refs?, only? })` first calls `lintDir(dir, opts)` (C1; `refs` makes tests identical with and without the Mandarin vault, `only` scopes the production build to `lessons/hsk1`, 8.Q5 B). Any returned error → the result is `{ errors }` (the lint errors, sorted by file, path, check) and the sink receives no `has` and no `write` call. Verified by: a folder where `words/你好.yaml` has `pinyin: ni hao` returns `{ errors: [ { file: 'words/你好.yaml', path: 'pinyin', check: 3, … } ] }` and the memory sink holds 0 versions and no content.
- [AC1] A derive-time failure returns `{ errors }` too, as `LintError` with `check: 10, name: 'Derive'`, for a word whose Hán Việt cannot be derived (path `hanviet`). Nothing is written.
- [AC1] If `sink.write` throws, `importContent` rejects with that error (it does not catch); the memory sink's own atomicity is tested in `sink.test.ts`.
- [AC2] On success `importContent` builds `ImportedContent` (below), computes `sha` = sha256 hex of its canonical JSON (keys sorted, entities in key order, no timestamp), and returns exactly `{ sha }`. Verified by: `expect(result).toEqual({ sha })`.
- [AC2] If `sink.has(sha)` is true the importer returns `{ sha }` without calling `write`. Re-running on unchanged files returns the same sha, `write` ran once in total, and the memory sink holds exactly 1 `content_versions` row for it. `has(sha)` means "`sha` is the content the sink holds now", not "seen before": import A, edit to B, revert to A writes A again, and the sink then holds 2 rows (A, B), not 3.
- [AC2] The sha ignores YAML comments and whitespace (same sha after adding a comment line) and changes when any derived or authored value changes: a `senses[0].vi`, a lesson word list, or a `dictionary.json` row a lesson uses that only the Dictionary supplies (e.g. 们, a char of the lesson word 你们 that is not itself a lesson word).
- [AC2] `ImportedContent` holds: lessons (Primers included) each non-Primer lesson with `gateCoverage` (S1) and `thin` entries (S4), each Primer with `gateCoverage: {}` and `thin: []` (a Primer has no words); words with resolved `spoken`, resolved `hanviet`, `taughtIn`, `listedIn`; sentences from lessons and `content/sentences` with resolved `spoken` and `seg` (segmented with the lesson's own words as lesson words; a free `content/sentences` sentence uses none); chars; grammar points; questions flattened as `{ id, lessonId, role, body }` with role drill / dialogue / listen / gate; syllables. It holds only plain objects and arrays (no `Map`/`Set`), so the canonical JSON cannot silently drop a field.
- [AC2] `Sink` = `{ has(sha): Promise<boolean>; write(content: ImportedContent): Promise<void> }`, `write` all-or-nothing. `createMemorySink()` implements it and exposes `versions` (one `{ sha, createdAt }` per distinct sha; rewriting an earlier sha refreshes its row) and `content` (the current one).
- [AC2] A missing `<dir>/dictionary.json` means an empty Dictionary, not an error.

## Not this slice
- AC3 (JSON bundle sink, Postgres sink, same content in each) and AC7 (audio manifest), the `pnpm import:content` CLI, and the Vercel build chain → S3.
- AC4–6, AC8 derive functions → S1; AC9 seg/thin functions → S4. This slice only calls them.
- The 9 lint checks and `lintDir` → CHY-9 (C1).

## Seam
`src/lib/content/import/`: `assemble.ts` (derive stage: lint set → `ImportedContent`), `import.ts` (`importContent`, canonical sha), `sink.ts` (`Sink`, `createMemorySink`).

## Test contract
- [AC1] vitest `import.test.ts`: copy `fixtures/ok` to a temp dir (`CHAIYO_VAULT` stubbed to a missing path), set one word's pinyin to `ni hao` → `{ errors }` whose first error is check 3 on that file; memory sink `versions` length 0 and `content` undefined; a stub sink asserts `has` and `write` were never called.
- [AC1] vitest: remove the Char file of a word with no authored `hanviet` → check 10 error at `hanviet`, nothing written;  a stub sink whose `write` throws makes `importContent` reject with that error; a malformed `dictionary.json` row → check 10 on `dictionary.json`.
- [AC2] vitest: import `fixtures/ok` twice with one memory sink → both results `toEqual({ sha: A })`, `write` call count 1, `versions` length 1.
- [AC2] vitest: import A, edit a `senses[0].vi` (B), revert (A) → three results `{ sha: A }`, `{ sha: B }`, `{ sha: A }`, `write` ran 3 times, `content.sha` is A, `versions` length 2.
- [AC2] vitest: comment-only edit → same sha; `senses[0].vi` edit → different sha; edit of the 们 row in `dictionary.json` → different sha; no `dictionary.json` → success.
- [AC2] vitest `assemble.test.ts`: for `fixtures/ok` (which carries a free `content/sentences` sentence referenced by a word) the content has every lesson, word, char, sentence (with `spoken` and `seg`) and question; 你好 has `taughtIn` h1-01; each question has a role; the Primer is present with `gateCoverage: {}` and `thin: []`; the free sentence has `spoken` and `seg` and no lesson id; a deep walk finds no `Map` or `Set`.

## Open assumptions
- [AC1] Check 10 is in C1 (CHY-9 accepted 2026-11-03), so no pick remains.
- [AC2] The fixture `ok` is lint-clean against CHY-9's checks 1–9 as shipped. If not, the executor reports the failing check; it never loosens a lint check (DISCUSSION).
