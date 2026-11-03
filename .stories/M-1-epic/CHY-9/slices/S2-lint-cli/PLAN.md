# CHY-9 S2 — plan
ACs: AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-9 (stacked on S1) · run `pnpm install` first

## Anchors (verified 2026-11-03 on main 9007e33)
- `package.json:16` `"test": "vitest --run --passWithNoTests"` · `:21` `"tokens": "node scripts/build-tokens.mjs"` (script style) · `:30` start of `devDependencies` (alphabetical; add `tsx` after `typescript-eslint`).
- `.github/workflows/ci.yml:26-29` install, check, lint, test:coverage (no lint:content step: Q-decision, real content not clean).
- `src/lib/content/parse.ts:2` extensionless import `./schemas` (why `tsx`, not native type stripping).
- `eslint.config.js:11-12` ignores only `prototype/ assets/ docs/ supabase/`, so `scripts/lint-content.ts` is linted.
- S1 deliverables used here: `src/lib/content/lint/index.ts` `lintDir`, `types.ts` `LintError`, `fixtures/clean` (S1 Task 2).
- vitest include `vite.config.ts:46` `src/**/*.{test,spec}.{js,ts}`; coverage excludes `src/**/fixtures/**` (`:35`).

## Task 1 [AC4][CHORE] Add tsx and the script
Files: `package.json` (`devDependencies` + `scripts`), `pnpm-lock.yaml`
- Change: `pnpm add -D tsx` (^4); script `"lint:content": "tsx scripts/lint-content.ts"` next to `tokens`.
- Verify: `pnpm install --frozen-lockfile && pnpm exec tsx --version`

## Task 2 [AC4] Fixture: 3 violations in 2 files
Files: new `src/lib/content/lint/fixtures/cli-three/{syllables.yaml,words/你好.yaml,chars/你.yaml}`
- Change: `syllables.yaml` = `[]`; `words/你好.yaml` valid per `schemas.ts:42` (id, hanzi, level 1, pos [phrase], senses, examples []) but `pinyin: nǐ hao3` → check 3 (digit), 1 error; `chars/你.yaml` valid per `schemas.ts:22` but `readings: [{ pinyin: ni3, hanviet: "" }]` → check 3 at `readings[0].pinyin` and check 1 at `readings[0].hanviet`; no `mnemonic`, and 你 is not in `polyphones.yaml`, so checks 2 and 7 stay quiet. Total 3 errors in 2 files.
- Test first: covered by Task 3.
- Verify: `pnpm exec tsx scripts/lint-content.ts src/lib/content/lint/fixtures/cli-three; echo $?` → 3 lines, exit 1.

## Task 3 [AC4] CLI script and test
Files: new `scripts/lint-content.ts`, `src/lib/content/lint/cli.test.ts`
- Change: `const dir = process.argv[2] ?? 'content'`; missing dir → stderr, `process.exitCode = 2`; `const { errors, notices } = lintDir(dir)`; `for (const e of errors) console.log(...)` in the SPEC format; `notices` and summary via `console.error`; `process.exitCode = errors.length ? 1 : 0`.
- Test first: `cli.test.ts` with `spawnSync('pnpm', ['exec','tsx','scripts/lint-content.ts', dir], { env: { ...process.env, CHAIYO_VAULT: '/nonexistent' } })`: `cli-three` → status 1, 3 stdout lines matching `/^\S+  \S+  #\d \S.*  .+$/`, 2 distinct files; `clean` → status 0, stdout `''`, stderr `0 errors`; `nope` → status 2.
- Verify: `pnpm vitest --run src/lib/content/lint/cli.test.ts`

## Mutation paths covered
- Read-only; the CLI mutates nothing. Two inputs reach it: a directory with errors and a clean one, plus a missing directory, all tested through the real process.

## Draft code (UNEXECUTED — adapt to what's on disk)
```ts
import { existsSync } from 'node:fs';
import { lintDir } from '../src/lib/content/lint';
const dir = process.argv[2] ?? 'content';
if (!existsSync(dir)) { console.error(`lint-content: no such directory: ${dir}`); process.exit(2); }
const { errors, notices } = lintDir(dir);
for (const e of errors) console.log(`${e.file}  ${e.path || '-'}  #${e.check} ${e.name}  ${e.message}`);
for (const n of notices) console.error(n);
console.error(`${errors.length} errors${errors.length ? ` in ${new Set(errors.map((e) => e.file)).size} files` : ''}`);
process.exitCode = errors.length ? 1 : 0;
```
A self-contradictory fixture is reported to the Captain, not hacked to green.

## Rollback
git revert of this slice's commits; removes `tsx` and the script. No migration.
