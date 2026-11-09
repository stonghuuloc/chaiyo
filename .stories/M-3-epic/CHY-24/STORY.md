# CHY-24 — Ledger: offline Attempts + sync

## Goal (business why, 1-2 sentences)
Keep every Attempt and saved word on the phone first, show Progress from them offline, and sync them to Supabase exactly once when the phone is online, so study in airplane mode is never lost or counted twice.

## Context an agent can't derive from code
- Interface (docs/architecture.md:31): `record(attempt)`, `state()`, `subscribe(fn)`; Store seam with an in-memory store for tests and Supabase online; an IndexedDB outbox offline. `src/lib/ledger` does not exist.
- Fold (WAVE-PLAN C-M3-2): `state()` = Study `apply` folded over Attempts and WordSaved inputs sorted by `at` (ties: WordSaved first, then Attempt `id`), `now = new Date(input.at)`, from an initial State the caller gives (`initialState({ curriculum, tz })`).
- Server side, all designed and not on main: `attempts` + RLS + `migrate()` test harness (CHY-23 S1, C-M3-3), append-only grants and the idempotent insert `on conflict (learner_id, id) do nothing` (CHY-23 S2). This story adds `lexicon_saves` (Q6 A) and `attempts.step jsonb` (C-M3-1 amendment from CHY-20 S1) in one migration with explicit grants (C-M3-4).
- supabase-js 2.x (package.json `^2.118.0`; latest 2.119.0) `upsert(rows, { onConflict, ignoreDuplicates: true })` sends `ON CONFLICT DO NOTHING`, which needs only INSERT privilege; a bulk upsert lists the union of row keys as `columns` and fills missing keys with null (`defaultToNull` true), so `learner_id` and `received_at`, never sent, take their defaults (postgrest-js PostgrestQueryBuilder.ts, checked 2026-11-09).
- PostgREST returns at most 1000 rows per request here (supabase/config.toml:18 `max_rows = 1000`), so pulls page.
- Q7 (decided A): server proofs run on local Supabase (`supabase start`, CLI 2.101.0 on the Mac) with two test users made by the service role; CI uses the in-memory store and never talks to Supabase (.github/workflows/ci.yml env comment). `supabase status -o env` prints `API_URL`, `PUBLISHABLE_KEY`, `SERVICE_ROLE_KEY` (checked on the Mac).
- Q8 (decided A): AC1 is proven on a dev-only `/dev/ledger` route, gated like /dev/audio (src/routes/dev/audio/+page.server.ts:9). Non-prerendered pages are network-first with a cache fallback in the service worker (src/service-worker/index.ts:1-2,42-52).
- `fake-indexeddb` 6.2.8 (Apache-2.0, Node ≥ 18) exports `IDBFactory`; a `new IDBFactory()` per test isolates databases.

## Locked decisions (BA/Loc already ruled — never re-open)
- Attempts are the truth, Progress is derived; Attempts are append-only (docs/architecture.md:41; CONTEXT.md "Attempt").
- The client is trusted with its own Progress; RLS stops writes to other learners (docs/architecture.md:42).
- Seams only where two adapters exist: Store (memory, Supabase) (docs/architecture.md:44).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Offline progress survives a reopen; Từ mới done, Streak counts | high | S3 |
| AC2 | Back online, 10 Attempts sync exactly once | high | S2 |
| AC3 | Duplicate replays never create duplicate Attempts | high | S1 |
| AC4 | state() equals apply folded over 8 Attempts in time order | high | S1 |
| AC5 | Another device's Attempts are merged, none twice | high | S2 |
| AC6 | subscribe notifies once per change; unsubscribe stops it | high | S1 |
| AC7 | A failed upload (500) keeps the Attempts for retry | high | S2 |

## Out of scope
- Login screen (CHY-26, M-4), the lesson and Practice screens that call `record` (M-5, CHY-41), realtime push from the server, conflict resolution beyond "append and dedupe", pagination UI, the 7-day pending deletion.
