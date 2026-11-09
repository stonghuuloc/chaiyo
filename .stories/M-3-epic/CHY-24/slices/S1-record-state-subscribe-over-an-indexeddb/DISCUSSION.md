# CHY-24 S1 — discussion
ACs: AC3, AC4, AC6 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q6 A: saved words live in an append-only `lexicon_saves` table, created by this slice's migration. Q7 A and Q8 A shape S2 and S3. The others do not touch this slice.

## Answered here (≥80% rule, CREW.md)
- [AC4] Q: where does the Ledger keep inputs offline? A: one IndexedDB object store `inputs` holding every known input with a `synced` flag, so `state()` after a reopen offline comes from the device alone (AC1). An "outbox only" design would lose the server's Attempts offline. Confidence 85%.
- [AC4] Q: does the Ledger know the curriculum and tz? A: no: the caller passes `initial` (`initialState({ curriculum, tz })`). The Ledger only orders and folds. Confidence 85%.
- [AC4] Q: is a new IndexedDB seam needed? A: no. IndexedDB has one real adapter; tests use `fake-indexeddb` behind the same browser API (docs/architecture.md:44: seams only where two adapters exist). The Store seam keeps its two adapters (memory now, Supabase in S2). Confidence 85%.
- [AC3] Q: "the in-memory store already has a-001" — what is deduped where? A: twice: the Ledger skips a key it knows, and the store keeps the first row for a key (Supabase: `on conflict do nothing`, CHY-23 S2). The test covers a device that never saw `a-001` before pushing it. Confidence 85%.
- [AC6] Q: notify on every state change, or every `record` call? A: every change: once per `record` or `sync` that adds an input; a duplicate `record` notifies nobody. Confidence 85%.
- [AC6] Q: notify before or after IndexedDB commits? A: after: a listener never sees a state that a reload could lose. Confidence 90%.
- [CHORE] Q: why is `attempts.step` in this migration? A: CHY-20 S1 adds `Attempt.step` (C-M3-1 amendment); CHY-23 S1-S2 are READY and may already run, and lane L3 owns the Ledger's migration. One `alter table` keeps every lane on its own files. Table-level grants cover the new column, and CHY-23 S2's revoke keeps it append-only (checked on PGlite). Confidence 85%.
- [CHORE] Q: how is "rejected" asserted (CREW.md)? A: `update` / `delete` / `anon` → revoke, SQLSTATE 42501 `permission denied`; inserting another learner's row → RLS `WITH CHECK`, 42501 `new row violates row-level security policy`; a repeat save → 0 rows via `on conflict do nothing`, 23505 for a plain insert. Confidence 90%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Append-only Attempts; client trusted with its own Progress; seams only where two adapters exist (STORY.md).
