# CHY-23 S1 — spec
ACs: AC1, AC2, AC3, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 7e52b9f)

## Behaviour
- [AC1] New file `supabase/migrations/20261110000000_learner_tables.sql` creates `profiles`, `settings`, `follows`, `attempts` in `public`, each with `enable row level security`. Every learner column references `auth.users (id) on delete cascade` and defaults to `auth.uid()`. The file ends with `revoke all on profiles, settings, follows, attempts from anon, authenticated;` and `grant select, insert, update, delete on profiles, settings, follows, attempts to authenticated;` (STORY Context: no default grants on hosted Supabase since 2026-10-30, the local CLI 2.101.0 still grants).
- [AC1] `src/lib/db/migrate.ts` exports `migrate(db, dir?)`: on a fresh PGlite it runs the Supabase shim (roles `anon`, `authenticated`, `service_role`; no default grants (the hosted default since 2026-10-30); schema `auth` with `users (id uuid primary key)` and `auth.uid()`), then every `*.sql` in `dir` (default `supabase/migrations`) in name order, and resolves to the list of files it ran. Any failing statement rejects with that file's name.
- [AC1] `asLearner(db, id)` switches the session to role `authenticated` with JWT `sub` = `id`; `asOwner(db)` resets the role.
- [AC2] Policies, all `to authenticated` with `(select auth.uid())`: `settings` select/insert/update own row; `attempts` select/insert own rows; `follows` select/insert/delete where `follower_id` is the caller; `profiles` insert/update own row, select own row or any row with `hidden = false`. No other policies, so no delete on `settings`/`profiles` and no update on `follows`.
- [AC2] Linh selecting `attempts` and `settings` gets only rows with her id; Nam's rows are absent.
- [AC3] Linh inserting an `attempts`, `settings`, `profiles` or `follows` row with Nam's id fails with SQLSTATE 42501. Linh's `update settings … where learner_id = <Nam>` changes 0 rows (Postgres hides the row; it raises nothing). Linh updating her own `settings` row to `learner_id = <Nam>` fails with 42501. Afterwards Nam's rows equal what they were.
- [AC6] `attempts` columns: `learner_id uuid not null`, `id text not null`, `question_id text not null`, `content_sha text not null`, `skill text` (`the` | `nghe` | `viet`), `word text`, `correct boolean`, `answer jsonb`, `ms int not null` (≥ 0), `at timestamptz not null`, `received_at timestamptz not null default now()`; primary key `(learner_id, id)`; check `(skill is null) = (word is null)`; index `(learner_id, at)`. No foreign key on `question_id` or `content_sha` (DISCUSSION). This is WAVE-PLAN C-M3-1.
- [AC6] An insert without `question_id` or without `content_sha` fails with SQLSTATE 23502 (not-null violation).
- [AC1] `settings` = `learner_id` PK, `tz text not null default 'Asia/Ho_Chi_Minh'`, `updated_at`. `profiles` = `learner_id` PK, `display_name text not null default ''`, `photo_url text`, `hidden boolean not null default false`, `created_at`. `follows` = `(follower_id, followee_id)` PK, `check (follower_id <> followee_id)`, `created_at`.
- [CHORE] `pnpm check`, `pnpm lint`, `pnpm test` stay green; the content test (postgres-sink.test.ts) is untouched and still passes.

## Not this slice
- AC4 (append-only), AC5 (idempotent insert), AC7 (content read-only) → S2: those are grants in `20261110000100_learner_grants.sql`. Until S2, an update or delete of Linh's own Attempt changes 0 rows without an error (no update/delete policy exists); S2 makes it raise 42501.
- Saved words table (WAVE-PLAN Q6), Ledger (CHY-24).

## Seam
`supabase/migrations/20261110000000_learner_tables.sql`; test harness `src/lib/db/migrate.ts`.

## Test contract
Fixture per test (`beforeEach`): fresh PGlite, `migrate(db)`, two `auth.users` rows Linh `11111111-1111-1111-1111-111111111111` and Nam `22222222-2222-2222-2222-222222222222`; as each learner insert a profile (display name Linh / Nam), a settings row and one Attempt (`id` `<name>-1`, `question_id` `card:你:the`, `content_sha` `sha1`, `skill` `the`, `word` 你, `correct` true, `ms` 1200, `at` `2026-11-09T02:00:00Z`).
- [AC1] `src/lib/db/learner-tables.test.ts` "migrations apply cleanly": `migrate(db)` resolves to a list that starts with `20261105000000_content_tables.sql` and includes `20261110000000_learner_tables.sql`; `select relname, relrowsecurity from pg_class where relname in ('profiles','attempts','settings','follows')` → 4 rows, all `true`. Negative control: `migrate(db, tmp)` where `tmp` holds a copy of the migrations plus `zz_bad.sql` = `create tabel x ();` → rejects naming `zz_bad.sql`.
- [AC1] On the Mac: `supabase start && supabase db reset` exits 0, and `docker exec supabase_db_chaiyo psql -U postgres -Atc "select relname||'='||relrowsecurity from pg_class where relname in ('profiles','attempts','settings','follows') order by 1"` prints `attempts=true`, `follows=true`, `profiles=true`, `settings=true`; and `select has_table_privilege('anon','public.attempts','SELECT')` → `f`.
- [AC2] "a learner reads only her own rows": as Linh, `select learner_id from attempts` and `from settings` → only Linh's id (1 row each). Negative control: as Nam → only Nam's.
- [AC2] Profiles: Linh sees both profiles; after Nam sets `hidden = true`, Linh sees only her own.
- [AC3] "a learner cannot write to another learner's rows": as Linh, insert into each of the 4 tables with Nam's id → each rejects with `code` `42501`; `update settings set tz = 'UTC' where learner_id = <Nam>` → `affectedRows` 0; `update settings set learner_id = <Nam>` → 42501. As owner, Nam's settings, profile and Attempt rows are deep-equal to their values before.
- [AC6] "attempts record which content they answered": as Linh, with `ms` and `at` set, insert without `question_id` → `code` 23502 and `column` `question_id`; without `content_sha` → `code` 23502 and `column` `content_sha`; with both → 1 row. `skill` = `listen` → 23514 (check violation); `skill` set with `word` null → 23514.

## Open assumptions
- [AC3] "Rejects with an RLS violation" is read as SQLSTATE 42501 where Postgres raises, and as "0 rows changed" for an update of a row the caller cannot see (STORY Context). If Loc wants that update to raise too, it needs a server function in place of plain `update`, which changes the Ledger's write path (CHY-24).
