# CHY-26 S3 — plan
ACs: CHY-24:AC2, CHY-24:AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-26-S3  ·  Lane L1b Ledger proof

## Depends on (execution order)
- CHY-26 S1 merged (sign-in exists). Runs beside CHY-26 S2: no shared file.

## Anchors (verified 2026-11-11 on main 18af4bb)
- `src/routes/dev/ledger/+page.svelte:20` `openLedger({ initial, store: supabaseStore(supabase), db: 'chaiyo-ledger-dev' })`; `:21-27` subscribe + `syncWhenOnline`.
- `src/routes/dev/ledger/finish.ts:1-28` (`finish`, `lines`) — add `ledgerDb` here; `src/routes/dev/ledger/ledger-page.test.ts:1-52` — its test file.
- `src/routes/dev/ledger/+page.server.ts:8-10` — dev or preview only.
- `src/lib/ledger/online.ts:3-7` (`syncWhenOnline`: sync now + on `online`); `src/lib/ledger/ledger.ts:45-71` `run()`, `:80-89` `record()`, `:90-95` `sync()` (one shared in-flight promise); `src/lib/ledger/supabase.ts` (upsert ignore-duplicates, paged pull).
- `supabase/migrations/20261110000000_learner_tables.sql:24` `learner_id … default auth.uid()`.

## Task 1 [CHY-24:AC2] per-learner database + who line
Files: `src/routes/dev/ledger/finish.ts`, `src/routes/dev/ledger/ledger-page.test.ts`, `src/routes/dev/ledger/+page.svelte`
- Change: `ledgerDb`; `onMount` awaits `getSession()` before `openLedger`; the who line.
- Test first: the CI row.
- Verify: `pnpm vitest run src/routes/dev/ledger` → pass.

## Task 1b [CHY-24:AC2] sync after a record
Files: `src/lib/ledger/ledger.ts`, `src/lib/ledger/ledger.test.ts`, `src/routes/dev/ledger/+page.svelte`
- Change: `let again = false`; `run()` becomes `do { again = false; …existing push+pull… } while (again)`; `record()` sets `again = true` inside its serial() callback after `rows.set(k, row)` when `running` is set (never at call time, never for a duplicate); `complete()` calls `void ledger.sync().catch(() => undefined)`.
- Test first: the new ledger.test.ts row → fails on main (pending 1).
- Verify: `pnpm vitest run src/lib/ledger src/routes/dev/ledger` → pass, every existing ledger case unchanged.
- Negative control: remove the loop → the new row fails; restore.

## Task 2 [CHY-24:AC2] [CHY-24:AC5] local proof
- Tester runs the SPEC local rows and pastes the Playwright log and the psql counts (never keys or tokens) into the slice VERIFY.md.
- Negative control: revert Task 1 and rerun the same-browser row → Nam's count becomes 10 (Linh's pending pushed under Nam), Linh's stays 30; restore Task 1.

## Task 3 [CHY-24:AC2] hosted proof
- Captain confirms the hosted migration list holds 20261110000000…20261112000000 (`supabase migration list --linked` on the Mac) before Loc's iPhone run.

## Task 4 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Mutation paths covered
- Session: none, Linh, Nam, switch on one browser. Network: offline record, back online, reopen, second device pull, other learner.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/routes/dev/ledger/finish.ts
export const ledgerDb = (uid?: string) => (uid ? `chaiyo-ledger-dev-${uid}` : 'chaiyo-ledger-dev');
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; a renamed database leaves the old `chaiyo-ledger-dev` data in place (dev only).
