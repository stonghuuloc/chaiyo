# CHY-24 S1 — plan
ACs: AC3, AC4, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-24  ·  Lane L3 (WAVE-PLAN)

## Depends on (execution order)
- CHY-19 S2 merged: `#lib/study/index.js` exports `apply`, `initialState`, `Attempt`, `WordSaved`, `State`.
- CHY-23 S2 merged: `src/lib/db/migrate.ts` (`migrate`, `asLearner`, `asOwner`), `attempts` with RLS, `20261110000100_learner_grants.sql` (this migration must sort after it).
- Not on CHY-20: `step` is a column here; the Ledger passes Attempts through whole. Runs in wave C next to CHY-20 S1 (no shared file).

## Anchors (verified 2026-11-09 on main 90fbe31)
- `package.json:31-62` — devDependencies (`fake-indexeddb` goes here, alphabetical after `eslint-plugin-svelte`).
- `vite.config.ts:50-58` — vitest project `server`, `environment: 'node'`, includes `src/**/*.test.ts`: IndexedDB comes only from `fake-indexeddb`.
- `src/lib/content/import/postgres-sink.test.ts:12` — `vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })` for PGlite tests (LOC-110 flake).
- `.stories/M-3-epic/CHY-23/slices/S1-learner-tables-and-rls-isolation/PLAN.md:46-65` — `migrate`, `asLearner` (not on main).
- `.stories/M-3-epic/WAVE-PLAN.md` C-M3-1, C-M3-2, C-M3-4 — row shape, fold order, explicit grants.

## Task 0 [CHORE] fake-indexeddb
File: `package.json:31-62`
- Change: `pnpm add -D fake-indexeddb@^6.2.8`.
- Verify: `pnpm ls fake-indexeddb` → 6.2.8; `git diff --stat` = package.json, pnpm-lock.yaml.

## Task 1 [AC4] IndexedDB + fold
Files: `src/lib/ledger/idb.ts`, `src/lib/ledger/ledger.ts`, `src/lib/ledger/index.ts` (all new)
- Change: `idb.ts`: `open(idb, name)`, `all(db)`, `put(db, rows)` as promises over one `inputs` store (`transaction.oncomplete` resolves). `ledger.ts`: `openLedger` per SPEC, `key(input)`, `order(a, b)` (C-M3-2), cached `state()`.
- Test first: `src/lib/ledger/fixtures.ts`, `src/lib/ledger/ledger.test.ts` "state() is Study.apply folded in time order" and "survives a reopen".
- Verify: `pnpm vitest run src/lib/ledger -t "time order"` → pass; the arrival-order negative control fails it; revert.

## Task 2 [AC3] record, sync, memoryStore
Files: `src/lib/ledger/ledger.ts`, `src/lib/ledger/memory.ts` (new)
- Change: `record` dedupes by key; `sync` per SPEC with a shared in-flight promise; `memoryStore`.
- Test: "duplicate replays never create duplicate Attempts".
- Verify: `pnpm vitest run src/lib/ledger -t "duplicate"` → pass. Negative control: let `memoryStore.push` append without the key check → `rows()` length 2; revert.

## Task 3 [AC6] subscribe
File: `src/lib/ledger/ledger.ts`
- Change: `Set<fn>`; notify after persisting.
- Test: "subscribe notifies on every change".
- Verify: `pnpm vitest run src/lib/ledger -t "subscribe"` → pass.

## Task 4 [CHORE] Migration
Files: `supabase/migrations/20261111000000_ledger.sql` (new), `src/lib/ledger/ledger-migration.test.ts` (new)
- Change: the SQL in SPEC [CHORE], exactly as below.
- Verify: `pnpm vitest run src/lib/ledger/ledger-migration.test.ts` → every SPEC code; on the Mac (tester, Docker up, after CHY-23's files are on the branch base): `supabase db reset` exit 0 and `docker exec supabase_db_chaiyo psql -U postgres -Atc "select has_table_privilege('anon','public.lexicon_saves','SELECT'), has_table_privilege('authenticated','public.lexicon_saves','UPDATE')"` → `f|f`.

## Task 5 [CHORE] Gates
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0; coverage thresholds (vite.config.ts:48) hold.

## Mutation paths covered
- record: new, duplicate (synced or pending). sync: nothing pending (no push), push ok, push rejected, pull adds unknown, pull marks known. subscribe: notify, no-op, unsubscribed. Reopen. SQL: insert own, repeat (do nothing / 23505), insert other (42501), update/delete (42501), anon (42501).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```sql
-- supabase/migrations/20261111000000_ledger.sql (every line ran on PGlite 0.5.15)
create table public.lexicon_saves (
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	word text not null,
	saved_at timestamptz not null,
	received_at timestamptz not null default now(),
	primary key (learner_id, word)
);
alter table public.lexicon_saves enable row level security;
create policy lexicon_saves_select on public.lexicon_saves for select to authenticated using (learner_id = (select auth.uid()));
create policy lexicon_saves_insert on public.lexicon_saves for insert to authenticated with check (learner_id = (select auth.uid()));
revoke all on public.lexicon_saves from anon, authenticated;
grant select, insert on public.lexicon_saves to authenticated;
alter table public.attempts add column step jsonb;
```
```ts
// src/lib/ledger/ledger.ts (core)
const key = (i: Input) => ('kind' in i ? `s:${i.word}` : `a:${i.id}`);
const order = (a: Input, b: Input) =>
	Date.parse(a.at) - Date.parse(b.at) || ('kind' in b ? 1 : 0) - ('kind' in a ? 1 : 0) || (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
export async function openLedger(o: { initial: State; store: Store; db?: string; idb?: IDBFactory }): Promise<Ledger> {
	const db = await open(o.idb ?? indexedDB, o.db ?? 'chaiyo-ledger');
	const rows = new Map((await all(db)).map((r) => [r.key, r]));
	const fns = new Set<(s: State) => void>(); let cache: State | undefined; let running: Promise<void> | undefined;
	const state = () => (cache ??= [...rows.values()].map((r) => r.input).sort(order).reduce((s, i) => apply(s, i, new Date(i.at)).state, o.initial));
	const changed = () => { cache = undefined; const s = state(); fns.forEach((f) => f(s)); };
	// record / sync / pending / subscribe per SPEC
}
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`. Before a hosted push, drop the migration file; after one, a new migration drops `lexicon_saves` and `attempts.step` (no learner data exists before CHY-24 S2).
