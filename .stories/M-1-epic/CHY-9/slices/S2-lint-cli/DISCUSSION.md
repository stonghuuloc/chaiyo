# CHY-9 S2 — discussion
ACs: AC4

## Current behaviour (verified, with anchors)
- [AC4] No lint CLI exists. `package.json:6-25` scripts: `tokens`, `icons` run `node scripts/*.mjs`; no TypeScript runner (`tsx` absent from devDependencies), Node 24 in CI (`.github/workflows/ci.yml`).
- [AC4] `src/lib/content` uses extensionless relative imports (`parse.ts:2` `./schemas`), so Node's native type stripping cannot load it; agreed runner is `tsx` (C1, CHAA-20, 2026-11-03).
- [AC4] S1 (this story) provides `lintDir(dir, opts?: { refs?, only? }) → { set, errors, notices }` (the CLI passes no opts) with `LintError { file, path, check, name, message }`.
- [AC4] CI runs `pnpm check`, `pnpm lint`, `pnpm test:coverage` only (`ci.yml:31`, `:32`, `:34`). Real `content/` is not lint-clean (CHY-10/11/12), so a CI lint-content step would be red today.

## Answered here (no human needed)
- [AC4] Q: output format? A: one stdout line per error: `<file>  <path>  #<check> <name>  <message>` (two spaces between columns, `-` for an empty path), sorted as `lint()` sorts. Summary (`N errors in M files`) and S1 notices go to stderr, so stdout is exactly the error lines the AC counts. 90%.
- [AC4] Q: exit codes? A: 0 clean, 1 any error or unreadable directory (one failure code: callers only test non-zero, advisor r1). 90%.
- [AC4] Q: runner? A: `tsx` devDependency + `scripts/lint-content.ts`, script `lint:content`; agreed with CHY-8 (CHAA-20). 90%.
- [AC4] Q: add `lint:content` to CI? A: no, real content is not clean yet; whoever makes it clean (CHY-10/11/12 lead) adds the CI step. 85%.
- [AC4] Q: how is the CLI tested? A: vitest spawns `pnpm -s lint:content <dir>` with `CHAIYO_VAULT` pointing nowhere (deterministic on every machine) against an on-disk fixture with 3 violations in 2 files. 85%.

## Advisor round 1 (2026-11-03)
4 findings applied (`pnpm -s` entry spawned in the test, last-stderr-line assertion, stale package.json/eslint anchors, exit-2 dropped). Parked: `scripts/lint-content.ts` is not type-checked by `pnpm check` (tsconfig covers `src` only), no AC requires it.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
(none — frontier empty)

## Locked (do not re-open)
- Runner = tsx; check 0 = schema error; LintError shape (C1).

## Issue #49 (LOC-109) — check errors in lessons hsk2–hsk5

Status: closed by Loc's 2026-11-08 review of PR #58.

- **Cause (verified on `fd2b67a`, rebased onto `7e2a5cc`).** `pnpm lint:content content` reported 92 errors in 4 files: 79 check 5, 5 check 4, 8 check 8. Only the 79 check-5 errors are the unauthored prerequisite curriculum: check 5's known(L) per S1 = chars of `Word.hanzi` for `sections.words.ids` of every lesson with lower (level, order) plus L. On main only level-1 lessons `h0-00` (primer, no words) and `h1-01` (10 words) exist, so each HSK2–5 preview sees only that chain. The h2–h5 files are the "first lesson of each HSK level" previews migrated from `prototype/data/h{2..5}-01.js` (`docs/lesson-preview-format.md`), authored against ★3 "hanzi belongs to a dict word of level ≤ L"; their chars are taught by the missing curriculum (HSK1 Bài 2–40 = CHY-59, then the later levels), so `unknown` entries would mark known chars as unknown.
- **The other 13 were real content defects, fixed in `content/lessons/hsk2…hsk5`** (Loc's review, 2026-11-08): 5 wrong `spoken` sandhi values (check 4); 3 h3, 2 h4 and 2 h5 `order` questions whose `answer` held sentence text instead of a `SentenceId` (check 8); h5-01's 17 `sections.words.ids` trimmed to 15 (check 8). The 7 order answers now point at the inline sentences whose full text the tiles rebuild (the h1-01 convention); h5-01 drops 随着 and 尽管 from its word list because h5-g01/h5-g02 teach them as grammar. The full run after the fixes: 79 errors, all check 5.
- **Decision (Loc, 2026-11-08).** A bare `pnpm lint:content` loads every file, then drops the errors reported in the non-production lesson folders: all 603 words, 12 grammar points, chars, sentences and syllables are checked and the lesson references in them resolve, while the preview lessons (`lessons/hsk2…hsk5`) cannot gate the run before their curricula exist. The skipped files and their error count are printed to stderr, so nothing is silently hidden. `scripts/lint-content.ts` also gains `--only <roots>` (comma-separated, trimmed, normalized to a directory-relative path, expanded by `scopeFor` like `import:content`; a root that is empty, missing, resolves outside the directory or matches nothing fails with one stderr line), and a directory argument still lints that tree in full. `levels/` and `cast.yaml` are not read by the loader in any mode (no check consumes them), so no lint run covers them; that pre-dates this PR. `pnpm lint:content content` keeps the 79 check-5 errors until CHY-59 lands.
- **Paid by tests.** `cli.test.ts`: default run (real content, 0 errors, empty stdout, stderr names the skipped lesson folders and their skipped-error count), `--only keeps the files the roots reference loaded` (clean fixture; a raw `only` would trip check 5 because the shared words would not load), `--only selects the named root and drops the rest`, and the root-rejection cases (missing, outside, no-match).
- **Open question: none.** Loc chose the narrow-scope option in his 2026-11-08 review; the level-based known set stays rejected (it would drop CHY-59's "a lesson uses a word not taught in this or an earlier lesson fails" and contradict `docs/content-schema.md` check 5).
