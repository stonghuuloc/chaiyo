# CHY-23 S2 — discussion
ACs: AC4, AC5, AC7 · design lead CHAA-103 · 2026-11-09

## Answered here (≥80% rule, CREW.md)
- [AC4] Q: how does Postgres "reject" an update or delete of an own Attempt? A: `revoke update, delete, truncate on attempts from anon, authenticated` → SQLSTATE 42501 "permission denied for table attempts". Without the revoke, the same statements change 0 rows and raise nothing (checked on PGlite 0.5.15 with S1's SQL), which the AC's "rejects" does not allow. Confidence 90%.
- [AC5] Q: which insert is idempotent? A: the Ledger's write, `insert … on conflict (learner_id, id) do nothing` (supabase-js `upsert(rows, { onConflict: 'learner_id,id', ignoreDuplicates: true })`). It needs only the insert privilege, so it still works after the AC4 revoke (checked). A plain second `insert` hits the primary key and fails with 23505, so either way the table holds one row. Confidence 80%: a trigger that swallows plain duplicates would add a second mechanism for the one writer the app has. Written into WAVE-PLAN C-M3-1 for CHY-24.
- [AC5] Q: can Linh's "a-001" collide with Nam's "a-001"? A: no: the key is `(learner_id, id)` (S1). Confidence 90%.
- [AC7] Q: the content tables already have no write policy; is that enough? A: no, for two reasons. With the legacy default grants (local CLI 2.101.0), an insert fails with 42501 but an update or delete changes 0 rows silently (checked). Revoking `insert, update, delete, truncate` on all 10 content tables from `anon` and `authenticated` makes every write raise 42501. And with no default grants (hosted since 2026-10-30), `authenticated` cannot even select them, so the file also grants `select` on the 10 tables to `authenticated` (advisor r1, run on PGlite: without it `select id from lessons` → 42501). The importer runs as the table owner (`postgres`), so it is not affected. Confidence 85%.
- [AC7] Q: "rejects it with an RLS violation" vs "permission denied"? A: both are SQLSTATE 42501 (insufficient_privilege); the test asserts the code, and the message is "permission denied for table lessons". Confidence 85%; same reading as S1 AC3 (STORY Context).
- [AC7] Q: why a new file, not an edit of the content migration? A: that file belongs to the content lane and may already be applied on the hosted project; a migration that has run is never edited. Confidence 90%.

## Open — needs an answer before execute
None in this file.

## Locked (do not re-open)
- Append-only Attempts; content select-only (STORY.md).
