# CHY-9 S2 — spec
ACs: AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC4] `pnpm lint:content [dir]` (default `content`) runs `lintDir(dir)` from S1 and prints one stdout line per `LintError`: `<file>  <path>  #<check> <name>  <message>`, path `-` when empty, in `lint()`'s order. 3 violations in 2 files → exactly 3 stdout lines, each with file, path, check number and message.
- [AC4] Exit code is 1 when there is any error (schema errors, check 0, included) and 0 when there are none. A directory that does not exist → exit 2 and one stderr line.
- [AC4] The summary (`3 errors in 2 files`, or `0 errors`) and every S1 notice (e.g. `check 7 skipped: vault not found`) go to stderr; stdout carries only error lines, so `pnpm lint:content > errors.txt` holds exactly the list.
- [CHORE] `tsx` is a devDependency and `lint:content` is a `package.json` script, so CHY-8's import CLI can reuse the runner (C1).

## Not this slice
- The 9 checks, loader, fixtures, API → S1. A CI step running `lint:content` → whoever makes real `content/` clean (CHY-10/11/12). JSON or colour output.
- The importer CLI `import:content` → CHY-8.

## Seam
`scripts/lint-content.ts`: parse argv, call `lintDir`, print, set `process.exitCode`. No logic beyond formatting.

## Test contract
- [AC4] vitest (`src/lib/content/lint/cli.test.ts`): spawn the CLI on `fixtures/cli-three` → exit code 1, stdout has exactly 3 lines, each matching `^\S+  \S+  #\d \S.*  .+$` and naming file, path, check number; 2 distinct files appear.
- [AC4] vitest: spawn the CLI on `fixtures/clean` → exit 0, stdout empty, stderr `0 errors` (`CHAIYO_VAULT` unset to a missing dir in every spawn).
- [AC4] vitest: spawn on a missing directory → exit 2.
- [CHORE] `pnpm check` and `pnpm lint` clean (eslint covers `scripts/lint-content.ts`).

## Open assumptions
- [AC4] The CLI test runs a child process through `tsx`, so it needs `pnpm install` done and costs ~1–2 s per spawn; if CI timing hurts, the formatter moves into a pure function tested in-process and one spawn stays. Cost: one extracted function.
