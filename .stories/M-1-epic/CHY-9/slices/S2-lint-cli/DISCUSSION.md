# CHY-9 S2 — discussion
ACs: AC4

## Current behaviour (verified, with anchors)
- [AC4] No lint CLI exists. `package.json:8-24` scripts: `tokens`, `icons` run `node scripts/*.mjs`; no TypeScript runner (`tsx` absent from devDependencies), Node 24 in CI (`.github/workflows/ci.yml`).
- [AC4] `src/lib/content` uses extensionless relative imports (`parse.ts:2` `./schemas`), so Node's native type stripping cannot load it; agreed runner is `tsx` (C1, CHAA-20, 2026-11-03).
- [AC4] S1 (this story) provides `lintDir(dir, opts?: { refs?, only? }) → { set, errors, notices }` (the CLI passes no opts) with `LintError { file, path, check, name, message }`.
- [AC4] CI runs `pnpm check`, `pnpm lint`, `pnpm test:coverage` only (`ci.yml:27-29`). Real `content/` is not lint-clean (CHY-10/11/12), so a CI lint-content step would be red today.

## Answered here (no human needed)
- [AC4] Q: output format? A: one stdout line per error: `<file>  <path>  #<check> <name>  <message>` (two spaces between columns, `-` for an empty path), sorted as `lint()` sorts. Summary (`N errors in M files`) and S1 notices go to stderr, so stdout is exactly the error lines the AC counts. 90%.
- [AC4] Q: exit codes? A: 0 clean, 1 any error or unreadable directory (pnpm folds all failures to 1, advisor r1). 90%.
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
