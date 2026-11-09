# CHY-23 S2 — plan
ACs: AC4, AC5, AC7  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-23  ·  Lane L2 (WAVE-PLAN)

## Anchors (verified 2026-11-09 on main 7e52b9f; S1 files are new in S1)
- `supabase/migrations/20261105000000_content_tables.sql:1-86` — the 10 content tables this slice revokes writes on (`content_versions` :1, `chars` :6, `lessons` :16, `words` :28, `word_chars` :39, `sentences` :46, `grammar_points` :58, `lesson_words` :67, `lesson_grammar` :74, `questions` :81).
- `supabase/migrations/20261105000000_content_tables.sql:88-116` — select-only policies; kept as they are.
- `src/lib/content/import/postgres-sink.ts:196-211` — the importer writes as the connection's role (the owner on the hosted DB and in its test), so the revoke does not reach it.
- S1: `src/lib/db/migrate.ts` (`migrate`, `asLearner`, `asOwner`), `supabase/migrations/20261110000000_learner_tables.sql` (`attempts` PK `(learner_id, id)`).

## Task 1 [AC4] Append-only Attempts
File: `supabase/migrations/20261110000100_learner_grants.sql` (new)
- Change: `revoke update, delete, truncate on attempts from anon, authenticated;`
- Test first: `src/lib/db/learner-grants.test.ts` "attempts are append-only" with the no-grants negative control (`migrate(db, tmp)` on a copy without this file).
- Verify: `pnpm vitest run src/lib/db -t "append-only"` → pass.

## Task 2 [AC5] Idempotent insert
File: `src/lib/db/learner-grants.test.ts`
- Test: "attempt insert is idempotent by id" (SPEC [AC5]): on-conflict insert twice, plain insert → 23505, Nam's own `a-001`. No SQL change: S1's PK makes it hold.
- Verify: `pnpm vitest run src/lib/db -t "idempotent"` → pass; and it still passes after Task 1 (the on-conflict insert needs no update privilege).

## Task 3 [AC7] Read-only content
File: `supabase/migrations/20261110000100_learner_grants.sql`
- Change: one `revoke insert, update, delete, truncate on <10 tables> from anon, authenticated;` and one `grant select on <10 tables> to authenticated;`.
- Test: "content tables are read-only for learners" (SPEC [AC7]), the 10-table insert loop included. Negative control: without the `grant select` line → `select id from lessons` raises 42501; revert.
- Verify: `pnpm vitest run src/lib/db` → all S1 + S2 tests pass; `pnpm vitest run src/lib/content/import/postgres-sink.test.ts` still green.

## Task 4 [CHORE] Real Supabase + gates
- Run (tester, Mac): `supabase db reset` → exit 0; `docker exec supabase_db_chaiyo psql -U postgres -Atc "select has_table_privilege('authenticated','public.attempts','UPDATE'), has_table_privilege('authenticated','public.lessons','INSERT'), has_table_privilege('authenticated','public.lessons','SELECT')"` → `f|f|t`.
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test` → exit 0.

## Mutation paths covered
- Attempts: insert (on-conflict, plain), update, delete, truncate (revoked with the rest). Content: select, insert, update, delete on `lessons`; insert on all 10.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```sql
-- 20261110000100_learner_grants.sql
revoke update, delete, truncate on attempts from anon, authenticated;
revoke insert, update, delete, truncate on
	content_versions, chars, lessons, words, word_chars, sentences,
	grammar_points, lesson_words, lesson_grammar, questions
from anon, authenticated;
grant select on
	content_versions, chars, lessons, words, word_chars, sentences,
	grammar_points, lesson_words, lesson_grammar, questions
to authenticated;
```
These statements ran on PGlite 0.5.15 after S1's SQL, with no default grants, during design and gave every SPEC result; report any difference to the lead.

## Rollback
`git revert`; after a hosted push, a new migration that grants the privileges back.
