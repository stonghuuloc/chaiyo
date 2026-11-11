# CHY-26 S3 — discussion
ACs: CHY-24:AC2, CHY-24:AC5 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- M-3 Q7 A: CHY-24's server proofs ran on local Supabase with password users; Q8 A: `/dev/ledger` is the dev page for Ledger proofs.

## Answered here (≥80% rule, CREW.md)
- [CHY-24:AC2] Q: why a slice in CHY-26? A: the Captain asked Login to unblock the browser sync proof that CHY-24 S3 could not run (no session; every push failed on RLS). It needs only S1's sign-in, so it runs beside S2. Confidence 90%.
- [CHY-24:AC2] Q: why change `/dev/ledger` at all? A: one database for every learner pushes Linh's pending inputs under Nam's session after a switch on one browser, because the server stamps `learner_id = auth.uid()` (learner_tables.sql:24). The proof would pass on one learner and hide that. CHY-28 S3's `learnerLedger` follows the same per-learner rule (`chaiyo-ledger-<uid>`, WAVE-PLAN C-M4-6) and drops its cache on `SIGNED_OUT`. A `/dev/ledger` tab left open across a sign-out keeps its Ledger (dev only; no AC): parked in WAVE-PLAN. Confidence 85%.
- [CHY-24:AC5] Q: what counts as "another device"? A: a Playwright context with fresh storage (its own IndexedDB and session), as CHY-24 S2 used two `db` names. Loc's iPhone run adds a real second device. Confidence 85%.
- [CHY-24:AC2] Q: does `setOffline(false)` fire `online`? A: Playwright's Chromium network emulation updates `navigator.onLine` and dispatches the event; the row waits on the text, not on the event, and fails clearly if no sync runs. Confidence 80%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Attempts append-only, idempotent insert (CHY-23 S2); Store seam with two adapters (CHY-24).
