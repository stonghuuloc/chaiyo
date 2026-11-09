# CHY-24 S2 — discussion
ACs: AC2, AC5, AC7 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q7 A: the server proof runs on local Supabase with two test users made by the service role; CI uses the in-memory store. Q6 A: saves go to `lexicon_saves`. The others do not touch this slice.

## Answered here (≥80% rule, CREW.md)
- [AC2] Q: what makes "sync exactly once" hold? A: three layers: the Ledger pushes only pending inputs and marks them synced after the server answers; the server keeps one row per `(learner_id, id)` (`on conflict do nothing`, CHY-23 S2); a reopen reads the synced flags from IndexedDB, so it pushes nothing. A crash between the server's answer and the flag write re-sends rows that the server ignores. Confidence 90%.
- [AC2] Q: what is "the phone goes online"? A: the browser `online` event, plus one sync when the Ledger opens (`syncWhenOnline`). `navigator.onLine` can be true with no network, so a failed sync just waits for the next event; retry timers are not in any AC. Confidence 80%.
- [AC7] Q: what about a 4xx (RLS 42501, expired session)? A: same path as a 500: the push rejects and inputs stay pending. Dropping inputs on a 4xx could lose study; the login screen (CHY-26) refreshes sessions. Confidence 85%.
- [AC5] Q: how are the other device's Attempts merged? A: `pull()` returns every row of the learner; the Ledger adds unknown keys and refolds in time order (C-M3-2), so the merge is order-independent. Confidence 85%.
- [AC5] Q: pull everything on each sync? A: yes in M-3: a learner has hundreds of Attempts a month, and pages of 1000 keep each request under PostgREST's cap. An incremental pull (`received_at` cursor) waits for a measured need. Confidence 80%.
- [AC2] Q: why normalise `at`? A: PostgREST returns `2026-11-09T02:00:00+00:00`; the client wrote `2026-11-09T02:00:00.000Z`. Study reads `new Date(at)`, so the fold is equal either way, but equal strings keep `state()` deep-equal across devices (AC5's assertion). Confidence 85%.
- [AC2] Q: who signs in before M-4? A: nobody in the app. The `.local` test signs test users in with a password; the app's client has no session until CHY-26, so a sync from the browser fails and keeps inputs pending, which S3 relies on. Confidence 85%.
- [CHORE] Q: why does this slice, not S1, edit docs/architecture.md:31? A: no two lanes write one file in a wave: L1 edits :30 in wave C (CHY-20 S1) and wave E (CHY-21 S1); wave D's L1 slice (CHY-20 S2) leaves the file alone. Confidence 90%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Append-only Attempts; Store seam has two adapters (STORY.md).
