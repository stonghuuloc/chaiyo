# CHY-23 S1 — plan
ACs: AC1, AC2, AC3, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-23  ·  Lane L2 (WAVE-PLAN)

## Anchors (verified 2026-11-09 on main 7e52b9f)
- `supabase/migrations/20261105000000_content_tables.sql:1-116` — the only migration; content RLS `select … to authenticated using (true)` at :88-116. New files must sort after it.
- `src/lib/content/import/postgres-sink.test.ts:11-31` — PGlite pattern: `vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })` (LOC-110 flake), `new PGlite()`, `create role authenticated`, `readFileSync(MIGRATION)`.
- `package.json` devDependencies — `@electric-sql/pglite ^0.5.15` already present; no new dependency.
- `vite.config.ts:56` — vitest runs `src/**/*.test.ts` only, so the test lives in `src/lib/db/`.
- `eslint.config.js:13` — `supabase/` is ignored by ESLint; SQL is not linted.
- `supabase/config.toml:5` — `project_id = "chaiyo"` → local DB container `supabase_db_chaiyo`.
- Supabase `auth.uid()` body: `coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''), (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid`.

## Task 1 [AC1] Test harness
File: `src/lib/db/migrate.ts` (new)
- Change: `migrate(db, dir = <repo>/supabase/migrations)` per SPEC; `asLearner(db, id)`, `asOwner(db)`. Resolve the default dir from `import.meta.dirname` (`../../../supabase/migrations`), as postgres-sink.test.ts:15-18 does with `__dirname`.
- Test first: `src/lib/db/learner-tables.test.ts` "migrations apply cleanly" with the `zz_bad.sql` negative control (`mkdtempSync` under `os.tmpdir()`, copy the real files, add the bad one).
- Verify: `pnpm vitest run src/lib/db` → the AC1 test fails only on the missing learner tables (red), before Task 2.

## Task 2 [AC1] [AC6] Learner tables
File: `supabase/migrations/20261110000000_learner_tables.sql` (new)
- Change: the four `create table` statements and the index from SPEC, then `enable row level security` on each, then the `revoke all … from anon, authenticated` / `grant select, insert, update, delete … to authenticated` pair.
- Test: AC1 green; "attempts record which content they answered" (23502 ×2, 23514 ×2).
- Verify: `pnpm vitest run src/lib/db -t "content they answered"` → pass.

## Task 3 [AC2] [AC3] Policies
File: `supabase/migrations/20261110000000_learner_tables.sql`
- Change: the policies from SPEC [AC2], each `to authenticated`, using `(select auth.uid())`.
- Tests: "a learner reads only her own rows" (+ Nam control, + hidden profile), "a learner cannot write to another learner's rows".
- Verify: `pnpm vitest run src/lib/db` → all S1 tests pass. Negative controls: drop `attempts_select`'s `using` clause to `using (true)` → the AC2 test fails; drop the `grant` line → the fixture's first insert raises 42501 `permission denied for table profiles`; revert both.

## Task 4 [AC1] Real Supabase on the Mac
- Run (tester, Mac, Docker Desktop up): `supabase start`, `supabase db reset` → exit 0; the `docker exec … psql` line in SPEC → 4 lines ending `=true`; `docker exec supabase_db_chaiyo psql -U postgres -Atc "select has_table_privilege('anon','public.attempts','SELECT')"` → `f`. Paste both outputs in VERIFY.md.

## Task 5 [CHORE] Gates
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test` → exit 0; `pnpm vitest run src/lib/content/import/postgres-sink.test.ts` still green.

## Mutation paths covered
- Insert own (fixture), insert as other (AC3 ×4 tables), update own to other's id (AC3), update other's row (AC3, 0 rows), select own/other (AC2), hidden profile toggle (AC2). Update/delete of own Attempts → S2.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/db/migrate.ts
import type { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const SHIM = `
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;`;
export async function migrate(db: PGlite, dir = join(import.meta.dirname, '../../../supabase/migrations')) {
	await db.exec(SHIM);
	const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
	for (const f of files) {
		try { await db.exec(readFileSync(join(dir, f), 'utf8')); }
		catch (e) { throw new Error(`${f}: ${(e as Error).message}`); }
	}
	return files;
}
export const asLearner = (db: PGlite, id: string) =>
	db.exec(`set role authenticated; select set_config('request.jwt.claims', '{"sub":"${id}"}', false)`);
export const asOwner = (db: PGlite) => db.exec('reset role');
```
```sql
-- 20261110000000_learner_tables.sql (excerpt; the full DDL is SPEC [AC1]/[AC6])
create table attempts (
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	id text not null,
	question_id text not null,
	content_sha text not null,
	skill text check (skill in ('the', 'nghe', 'viet')),
	word text,
	correct boolean,
	answer jsonb,
	ms int not null check (ms >= 0),
	at timestamptz not null,
	received_at timestamptz not null default now(),
	primary key (learner_id, id),
	check ((skill is null) = (word is null))
);
create index attempts_learner_at on attempts (learner_id, at);
alter table attempts enable row level security;
create policy attempts_select on attempts for select to authenticated using (learner_id = (select auth.uid()));
create policy attempts_insert on attempts for insert to authenticated with check (learner_id = (select auth.uid()));
-- … other tables and policies …
revoke all on profiles, settings, follows, attempts from anon, authenticated;
grant select, insert, update, delete on profiles, settings, follows, attempts to authenticated;
```
Every SQL line above ran on PGlite 0.5.15 during design and gave the SPEC results; report any difference to the lead instead of changing an expected code.

## Rollback
`git revert`; before any hosted push, delete the file. After a hosted push: a new migration that drops the four tables (no learner data exists before CHY-24).
