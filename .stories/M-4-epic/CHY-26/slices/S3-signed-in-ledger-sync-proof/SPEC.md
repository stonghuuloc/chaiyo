# CHY-26 S3 — spec
ACs: CHY-24:AC2, CHY-24:AC5 (carried: CHY-24 proved them with password users in vitest, never in the browser)  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb; **builds on CHY-26 S1**)

## Behaviour
- [CHY-24:AC2] `/dev/ledger` opens its Ledger in a database per learner: `ledgerDb(uid)` = `chaiyo-ledger-dev-<uid>` when `supabase.auth.getSession()` returns a session, else `chaiyo-ledger-dev` (today's name, src/routes/dev/ledger/+page.svelte:20). Without it, inputs Linh left pending would push under Nam's session after a sign-out and sign-in on the same browser (`learner_id` defaults to `auth.uid()`, learner_tables.sql:24).
- [CHY-24:AC2] The page shows one more line, `data-testid="who"`: "Tài khoản: {email}" or "Chưa đăng nhập". The three existing lines and the button stay as they are (CHY-24 S3).
- [CHY-24:AC2] No change to `src/lib/ledger/**`: `supabaseStore(supabase)` + `syncWhenOnline` already push when the client holds a session. A defect found by the proof is fixed in its owning file with a CI test, after a note to the lead.
- [CHY-24:AC5] Same page on a second device of the same learner pulls the server rows on open (`syncWhenOnline` calls `sync()` at once), so "Từ mới: xong" shows there too.

## Not this slice
- An app-wide Ledger for real screens (CHY-28 S3 adds `src/lib/learner`), lesson screens (M-5).

## Seam
None new.

## Test contract
CI (vitest, `src/routes/dev/ledger/ledger-page.test.ts`):
- [CHY-24:AC2] `ledgerDb('0b6c…')` → `chaiyo-ledger-dev-0b6c…`; `ledgerDb(undefined)` → `chaiyo-ledger-dev`.
Local proof (tester, Mac: `supabase db reset`, `pnpm dev --host 127.0.0.1`, Playwright Chromium in ~/.capy/work; sign-in = S1's magic link read from Mailpit; counts by psql on 56322):
- [CHY-24:AC2] context A signs in linh@example.test, opens `/dev/ledger` (who = "Tài khoản: linh@example.test"), waits for `navigator.serviceWorker.ready`, reloads, `setOffline(true)`, taps → "Chưa đồng bộ: 10"; `select count(*) from attempts a join auth.users u on u.id = a.learner_id where u.email = 'linh@example.test'` → 0. `setOffline(false)` → within 10 s "Chưa đồng bộ: 0" (the test does not reload or call sync); count → 10. Reload → pending 0, count 10.
- [CHY-24:AC5] A `setOffline(true)`, taps (pending 10, server 10). Context B (fresh storage) signs in Linh with a new link, opens `/dev/ledger` → "Từ mới: xong" with no tap of its own (pulled), taps → server 20. A `setOffline(false)` → within 10 s pending 0; count 30, 30 distinct ids; A reloads → pending 0, count 30. Context C signs in nam@example.test → "Từ mới: chưa xong", Nam's count 0.
- [CHY-24:AC2] same browser: A taps offline (10 pending), signs out with `(await import('/src/lib/supabase.ts')).supabase.auth.signOut()` in the dev console (auth-js 2.118.0 drops the local session even when the call fails), Nam signs in, opens `/dev/ledger` online → Nam's count stays 0 and Linh's stays 30; Linh signs in again online → her pending reaches 0 and her count is 40.
Hosted (Loc, iPhone, preview of the head; needs M-3 + 20261112000000 on hosted): sign in by email link, `/dev/ledger`, airplane mode, tap, airplane off → "Chưa đồng bộ: 0"; the Captain reads the count in the hosted SQL editor → 10.

## Open assumptions
- None.
