# CHY-23 S2 — spec
ACs: AC4, AC5, AC7  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 7e52b9f; builds on S1)

## Behaviour
- [AC4] New file `supabase/migrations/20261110000100_learner_grants.sql` revokes `update, delete, truncate` on `attempts` from `anon` and `authenticated`. Linh's `update` or `delete` of her own Attempt then fails with SQLSTATE 42501, and the row is unchanged.
- [AC5] The Attempt write is `insert into attempts (…) values (…) on conflict (learner_id, id) do nothing`. Running it twice for `id` `a-001` succeeds both times (1 row affected, then 0), and `attempts` holds exactly one row with `id` `a-001` for Linh. A plain second `insert` fails with 23505 and still leaves one row.
- [AC5] Nam may hold his own `a-001`; Linh's insert of `a-001` neither fails nor touches it.
- [AC7] The same file revokes `insert, update, delete, truncate` on `content_versions`, `chars`, `lessons`, `words`, `word_chars`, `sentences`, `grammar_points`, `lesson_words`, `lesson_grammar`, `questions` from `anon` and `authenticated`, and grants `select` on the same 10 tables to `authenticated` (the content migration relied on the old default grants; WAVE-PLAN C-M3-4). Linh's `select` from `lessons` and `words` returns rows; her `insert`, `update` or `delete` on `lessons` fails with SQLSTATE 42501, and an `insert` into each of the 10 tables fails with 42501.
- [CHORE] `pnpm check`, `pnpm lint`, `pnpm test` stay green; S1's tests still pass with both files applied.

## Not this slice
- AC1-AC3, AC6 (tables, policies, columns) → S1. The Ledger's use of the insert (CHY-24).

## Seam
`supabase/migrations/20261110000100_learner_grants.sql`; tests in `src/lib/db/learner-grants.test.ts` on S1's `migrate`.

## Test contract
Fixture: S1's (`migrate`, Linh and Nam with one Attempt each), plus as owner one `lessons` row `h1-01` and one `words` row `你好`.
- [AC4] "attempts are append-only": as Linh, `update attempts set correct = false where id = 'Linh-1'` → 42501; `delete from attempts where id = 'Linh-1'` → 42501; as owner the row is deep-equal to before. Negative control: run the same file set without `20261110000100_learner_grants.sql` (`migrate(db, tmp)`) → both statements resolve with `affectedRows` 0, which is why the revoke is needed.
- [AC5] "attempt insert is idempotent by id": as Linh, `insert into attempts (id, question_id, content_sha, ms, at) values ('a-001', 'card:你:the', 'sha1', 1200, '2026-11-09T02:00:00Z') on conflict (learner_id, id) do nothing` twice → `affectedRows` 1 then 0, no error; `select count(*) from attempts where id = 'a-001'` → 1. A plain `insert` of `a-001` → 23505; count still 1. Nam inserts his own `a-001` → as owner, 2 rows with `id` `a-001`, one per learner.
- [AC7] "content tables are read-only for learners": as Linh, `select id from lessons` → `[h1-01]`; `select id from words` → `[你好]`; `insert into lessons …`, `update lessons set title = 'x'`, `delete from lessons` → each 42501; an `insert` into each of the 10 content tables → 42501. As owner, `lessons` still holds `h1-01` with its title.
- [AC7] On the Mac: `supabase db reset` exits 0 with both new files (S1 Task 4 command).

## Open assumptions
- [AC5] The insert the AC means is the Ledger's on-conflict write (DISCUSSION). If Loc wants a plain `insert` to be idempotent too, add a `before insert` trigger; the tests above stay and one more asserts the plain insert succeeds.
