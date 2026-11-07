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

## Issue #49 (LOC-109) — 92 check-5 errors in lessons hsk2–hsk5

Status: cause verified, default scope fixed, spec question in the PR for Loc.

- **Cause (verified on `fd2b67a`).** `pnpm lint:content content` reports 92 errors in 4 files: 79 check 5, 5 check 4, 8 check 8, in `lessons/hsk2/h2-01.yaml` (14), `hsk3/h3-01.yaml` (26), `hsk4/h4-01.yaml` (27), `hsk5/h5-01.yaml` (25). Check 5's known(L) per S1 = chars of `Word.hanzi` for `sections.words.ids` of every lesson with lower (level, order) plus L. On main only level-1 lessons `h0-00` (primer, no words) and `h1-01` (10 words) exist, so h2-01 sees 10 + its own 12 words as known; h3-01–h5-01 see the same chain. The h2–h5 files are the "first lesson of each HSK level" previews migrated from `prototype/data/h{2..5}-01.js` (`docs/lesson-preview-format.md`), authored against ★3 "hanzi belongs to a dict word of level ≤ L". Probe of `prototype/data/dict.json`: every sentence char in h2-01, h4-01 and h5-01 is in a dict word of level ≤ L; h3-01 has one exception (阿 in the name 阿牛). So these are not unknown characters: they are taught by the unauthored prerequisite curriculum (HSK1 Bài 2–40 = CHY-59, then the later levels). Adding `unknown` entries would mark known chars as unknown, and authoring the lessons is that bulk-content work, not this ticket.
- **Decision (80%, spec delta).** A bare `pnpm lint:content` now lints the C2 production scope, `scopeFor('content', PRODUCTION_ROOTS)` — `PRODUCTION_ROOTS` is exported by `src/lib/content/import/scope.ts` and names `lessons/hsk1`, the roots `scripts/build-content.sh` and the CI import step pass with `--only lessons/hsk1`, and the same "Bài 1 scope" CHY-10 S1 uses. `scripts/lint-content.ts` gains `--only <roots>` (comma-separated, trimmed, expanded by `scopeFor`, like `import:content`); a root that does not exist under the directory or resolves outside it fails with one stderr line, so a typo cannot lint only the shared files and pass; a directory argument still lints that tree in full. So `pnpm lint:content` exits 0, while `pnpm lint:content content` keeps the 92 preview-lesson errors until their curriculum exists (CHY-10 S1's "full run cannot reach 0" still holds).
- **Paid by tests.** `cli.test.ts`: "lints the production scope when no directory is given" (real content, 0 errors, empty stdout), "--only keeps the files the roots reference loaded" (clean fixture, `--only lessons/hsk1` → 0; a raw `only` would trip check 5 because the shared words would not load), "rejects an --only root that does not exist" (a comma list with one bad, trimmed, root) and "rejects an --only root outside the linted directory" (`--only ..`).
- **Open question for Loc (asked in the PR).** A: production scope by default (taken). B: keep the whole-tree default and leave the command red until CHY-59. A level-based known set was rejected: it would drop CHY-59's "word not taught in this or an earlier lesson fails" and contradict `docs/content-schema.md` check 5.
