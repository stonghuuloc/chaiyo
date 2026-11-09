# CHY-24 S2 — spec
ACs: AC2, AC5, AC7  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-24 S1 and CHY-20 S1**)

## Behaviour
- [AC2] `src/lib/ledger/supabase.ts` exports `supabaseStore(client: SupabaseClient): Store`. `push(inputs)` sends the Attempts with `client.from('attempts').upsert(rows, { onConflict: 'learner_id,id', ignoreDuplicates: true })`, then the WordSaved inputs with `client.from('lexicon_saves').upsert(rows, { onConflict: 'learner_id,word', ignoreDuplicates: true })`. Any `error` in a response makes `push` reject with an `Error` carrying the HTTP `status`; a later call re-sends the same rows and the server keeps one of each.
- [AC2] Row shape (C-M3-1): `{ id, at, question_id, content_sha, word: card?.word ?? null, skill: card?.skill ?? null, correct, ms, answer: answer ?? null, step: step ?? null }`; saves `{ word, saved_at: at }`. `learner_id` and `received_at` are never sent (column defaults `auth.uid()`, `now()`).
- [AC5] `pull()` reads `attempts` (`select('id, at, question_id, content_sha, word, skill, correct, ms, answer, step')`, `.order('at').order('id')`) and `lexicon_saves` (`.order('saved_at').order('word')`) in pages of 1000 with `.range(from, from + 999)` until a page is shorter (supabase/config.toml:18 `max_rows = 1000`). Rows map back with `at = new Date(row.at).toISOString()`, `card` only when `word` is set, `answer` / `step` only when not null. RLS returns only the signed-in learner's rows.
- [AC2] `syncWhenOnline(ledger, target = window): () => void` calls `ledger.sync()` at once and on every `online` event of `target`; a rejected sync is swallowed (inputs stay pending) and the next `online` retries. The returned function removes the listener.
- [AC7] A 500 (or a network error) on `push` leaves every input pending; the next `sync()` pushes the same ids again.
- [CHORE] docs/architecture.md:31 Ledger row: interface `openLedger({ initial, store, db })` → `record(input)` (Attempt or WordSaved), `state()`, `subscribe(fn)`, `sync()`, `pending()`; hidden: IndexedDB holds every input with a synced flag, push with `on conflict do nothing`, paged pull. Touch no other row. `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Not this slice
- AC3, AC4, AC6 (record, fold, subscribe) → S1. AC1 (device reopen) → S3. A login screen (CHY-26).

## Seam
`Store` (S1): `supabaseStore` is its second adapter; `syncWhenOnline` in `src/lib/ledger/online.ts`.

## Test contract
CI (`sync.test.ts`, memory store or a fake `fetch`; S1 fixtures; `T` = 2026-11-09T02:00:00Z):
- [AC2] "back online, sync exactly once": `store.online = false`; record `a-01`…`a-10` (T + 1 … 10 min); `stop = syncWhenOnline(ledger, target)` with `target = new EventTarget()`; `await new Promise((r) => setTimeout(r))` → `pending()` 10, `rows()` 0, `pushes` 0. `store.online = true`; `target.dispatchEvent(new Event('online'))`; `await vi.waitFor(() => expect(ledger.pending()).toBe(0))` (the test never calls `sync()` itself) → `rows()` 10, `pushes` 1. Reopen (`openLedger` on the same `idb`) → `pending()` 0; its `sync()` → `pushes` 1. `stop()`; record `a-11`; dispatch `online`; one macrotask → `pending()` 1, `pushes` 1. Negative control: drop `addEventListener` → `waitFor` times out.
- [AC5] "another device's Attempts are merged": devices A and B (`db` 'A' / 'B', one store). A records `a1`…`a3` (T + 1, 3, 5 min) without syncing; B records `b1`…`b4` (T + 0, 2, 4, 6 min) and syncs → `rows()` 4. A `sync()` → `rows()` 7; A's `state()` deep-equals the fold of `b1 a1 b2 a2 b3 a3 b4`; 7 distinct keys. B `sync()` → B's `state()` deep-equals A's.
- [AC7] "a failed upload keeps the Attempts": `supabaseStore(createClient('http://127.0.0.1:56321', 'test-key', { auth: { persistSession: false }, global: { fetch } }))` with a `vi.fn` fetch: the first POST → 500 `{"message":"boom"}`, later POSTs → 201, GETs → 200 `[]`. Record `a-01`, `a-02`; `sync()` rejects (status 500); `pending()` 2; that POST went to `/rest/v1/attempts?on_conflict=learner_id%2Cid…` with `Prefer` containing `resolution=ignore-duplicates` and body ids [a-01, a-02], no `learner_id` key. Next `sync()` resolves; the second POST body has the same 2 ids; `pending()` 0.
- [AC5] "pull pages": a fake fetch answers GET `/rest/v1/attempts` with 1000, 1000, then 3 rows (chosen by `offset`) and GET `/rest/v1/lexicon_saves` with `[]` → `pull()` yields 2003 inputs; the attempts GETs carry `offset=0&limit=1000`, `offset=1000&limit=1000`, `offset=2000&limit=1000` (postgrest-js 2.118.0 `range()` sets query params, PostgrestTransformBuilder.ts:568-572).

Local Supabase (`supabase.local.test.ts`, `describe.skipIf(!process.env.LEDGER_SUPABASE)`; WAVE-PLAN Q7 A). Each test makes its own users with the service role (`auth.admin.createUser({ email, password, email_confirm: true })`), signs each device in with `signInWithPassword` on a publishable-key client, and deletes the users after (cascade):
- [AC2] Linh records 10 while her fetch wrapper throws `TypeError('Failed to fetch')`; `sync()` rejects, `pending()` 10; wrapper back on → `sync()` → `select('*', { count: 'exact', head: true })` on `attempts` as Linh = 10, `pending()` 0; reopen + `sync()` → 0 POSTs.
- [AC5] Linh's device B records 4 and syncs; device A records 3 offline, then syncs → A's `state()` = fold of the 7 server rows, server count 7. Nam's ledger `sync()` pulls 0 of them.
- Run (tester, Mac, one heavy suite at a time): `supabase db reset && env $(supabase status -o env | grep -E '^(API_URL|PUBLISHABLE_KEY|SERVICE_ROLE_KEY)=' | xargs) LEDGER_SUPABASE=1 pnpm vitest run src/lib/ledger/supabase.local.test.ts` → all pass. Never print the keys.

## Open assumptions
- None: Q7 is decided (A).
