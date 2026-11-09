# CHY-23 — Postgres: learner tables + RLS

## Goal (business why, 1-2 sentences)
Give each learner their own profile, settings, follows and append-only Attempts in Postgres, with row-level security so a learner can only touch their own rows and only read content.

## Context an agent can't derive from code
- One migration is on main: supabase/migrations/20261105000000_content_tables.sql (10 content tables, RLS on, `select` for `authenticated`, no write policy). This story adds two files after it; the content file is the content lane's and stays untouched.
- Supabase no longer grants new `public` tables to `anon`/`authenticated` (changelog 45329: new projects from 2026-05-30, all projects from 2026-10-30; existing tables keep their grants). The Mac's CLI 2.101.0 still does locally (`pg_default_acl` on `supabase_db_chaiyo`), so migrations grant explicitly and behave the same on both. `auth.uid()` reads the JWT `sub`; PGlite has no `auth` schema, so tests run a shim first (`src/lib/db/migrate.ts`), with no default grants. The current content test only does `create role authenticated` (src/lib/content/import/postgres-sink.test.ts:29).
- Postgres semantics behind the AC words (checked on PGlite 0.5.15 with the planned SQL): an INSERT that fails a policy raises SQLSTATE **42501** "new row violates row-level security policy"; an UPDATE or DELETE on rows the policy hides raises nothing and changes **0 rows**; a revoked privilege raises **42501** "permission denied". So "rejects with an RLS violation" is tested as SQLSTATE 42501 where Postgres raises, and as "0 rows changed, Nam's row unchanged" for AC3's update of Nam's settings. Updating Linh's own row to Nam's id does raise 42501.
- Attempt columns follow WAVE-PLAN C-M3-1, shared with CHY-19's `Attempt` type. Change one, change both.
- Learner deletion erases everything (CONTEXT.md "Learner"): every learner table references `auth.users(id) on delete cascade`.
- `supabase` 2.101.0 and Docker Desktop are on the Mac, so `supabase db reset` can prove AC1 on the real stack; CI has no Supabase (.github/workflows/ci.yml env comment), so PGlite carries the CI tests.

## Locked decisions (BA/Loc already ruled — never re-open)
- Attempts are append-only and reference `question_id` + `content_sha` (CONTEXT.md "Attempt"; docs/content-schema.md:350-352).
- Content tables: `select` for authenticated learners, no writes (docs/content-schema.md:352).
- The client is trusted with its own Progress; RLS stops writes to anyone else's rows (docs/architecture.md:42).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Migrations apply cleanly; four tables exist with RLS on | high | S1 |
| AC2 | A learner cannot read another learner's Attempts or settings | high | S1 |
| AC3 | A learner cannot write to another learner's rows | high | S1 |
| AC4 | Attempts are append-only | high | S2 |
| AC5 | Attempt insert is idempotent by Attempt id | high | S2 |
| AC6 | Attempts record which content they answered | high | S1 |
| AC7 | Content tables are read-only for learners | high | S2 |

## Out of scope
- Saved words storage (WAVE-PLAN Q6, CHY-24), Ledger sync (CHY-24), Public Profile fields beyond name/photo/hidden (CHY-52), reminder settings (CHY-47, CHY-53), Admin and analytics access (M-10), the 7-day pending deletion (account work).
