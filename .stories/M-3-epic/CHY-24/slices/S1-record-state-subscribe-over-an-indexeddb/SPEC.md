# CHY-24 S1 — spec
ACs: AC3, AC4, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-19 S2 and CHY-23 S2, not on main yet**)

## Behaviour
- [AC4] `src/lib/ledger/index.ts` exports `openLedger`, `memoryStore` and the types `Ledger`, `Store`, `Input = Attempt | WordSaved` (from `#lib/study/index.js`). `openLedger({ initial, store, db = 'chaiyo-ledger', idb = indexedDB }): Promise<Ledger>` opens IndexedDB `db` (version 1, object store `inputs`, `keyPath: 'key'`) and loads every row `{ key, input, synced }`. Key: `a:<id>` for an Attempt, `s:<word>` for a WordSaved.
- [AC4] `Ledger` = `{ record(input): Promise<void>; state(): State; subscribe(fn): () => void; sync(): Promise<void>; pending(): number }`.
- [AC4] `state()` = `initial` folded with Study `apply(state, input, new Date(input.at))` over every known input, ordered by `Date.parse(at)`, then WordSaved before Attempt, then Attempt `id` (string order) / WordSaved `word` (WAVE-PLAN C-M3-2). The result is cached until the input set changes.
- [AC3] `record(input)`: a key already known (synced or not) resolves and changes nothing. Otherwise it writes `{ key, input, synced: false }` and waits for the IndexedDB transaction to complete before the input counts in `state()` and `pending()`.
- [AC6] `subscribe(fn)` returns an unsubscribe function. After each `record` or `sync` that adds at least one input, every current listener is called once with the new `state()`. A no-op `record` calls nobody.
- [AC3] `sync()`: one run at a time (a second call while one runs gets the same promise). If `pending() > 0` it calls `store.push(unsynced, in fold order)`; a rejection rejects `sync()` and marks nothing. On success those rows become `synced: true`. Then `store.pull()`: unknown inputs are stored `synced: true`, a known unsynced one becomes synced. With nothing pending, `push` is not called.
- [AC3] `memoryStore()` (tests and dev): `{ push, pull, rows(), online: true, pushes: 0 }`. `push` and `pull` reject with `Error('offline')` while `online` is false and count nothing; a resolved `push` adds 1 to `pushes` and adds only keys it lacks (C-M3-1: on conflict do nothing); `pull` returns copies in arrival order.
- [NFR] Reopen: a second `openLedger` on the same `idb` + `db` gives a deep-equal `state()` and the same `pending()` (CHY-24 AC1 rests on it).
- [CHORE] New migration `supabase/migrations/20261111000000_ledger.sql` (after CHY-23's `20261110000100`): table `lexicon_saves (learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade, word text not null, saved_at timestamptz not null, received_at timestamptz not null default now(), primary key (learner_id, word))`, RLS on, policies `select` and `insert` `to authenticated` with `learner_id = (select auth.uid())`, `revoke all … from anon, authenticated`, `grant select, insert … to authenticated` (C-M3-4); and `alter table attempts add column step jsonb` (C-M3-1, CHY-20 S1).
- [CHORE] `fake-indexeddb@^6.2.8` joins devDependencies. `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Fixture (src/lib/ledger/fixtures.ts)
`T` = 2026-11-09T02:00:00Z. `att(id, at, word, skill, correct)` builds a card Attempt (`questionId` `card:<word>:<skill>`, `contentSha` `sha1`, `ms` 1000). Server five: `s1` T − 4 d 你·the ✓, `s2` T − 3 d 好·the ✓, `s3` T − 2 d 你·the ✓, `s4` T − 1 d 您·the ✗, `s5` T − 12 h 好·nghe ✓. Outbox three: `o1` T − 3.5 d 你·the ✗ (between `s1` and `s3`), `o2` T − 6 h 你好·the ✓, `o3` T − 1 h 谢谢·nghe ✓. Each test: `idb = new IDBFactory()`, `initial = initialState()`.

## Not this slice
- AC2, AC5, AC7 (Supabase store, online event, other device, 500) → S2. AC1 (offline reopen on a device) → S3. The architecture row edit → S2 (lane rule: L1 edits docs/architecture.md in wave C).

## Seam
`src/lib/ledger/ledger.ts` (`openLedger`), `src/lib/ledger/idb.ts` (the only IndexedDB code), `src/lib/ledger/memory.ts` (`memoryStore`).

## Test contract (`ledger.test.ts`, `ledger-migration.test.ts`)
- [AC3] "duplicate replays never create duplicate Attempts": `store.push([a001])` first (server has `a-001`); ledger `record(a001)` → `pending()` 1; `sync()` → `store.rows()` has one `a-001`, `pending()` 0; `record(a001)` again → `pending()` 0; `sync()` twice → still one `a-001`, `rows()` length 1, `pushes` 2 (the seed push and the first sync; the two later syncs push nothing). Negative control: drop `record`'s known-key check → `pushes` 3.
- [AC4] "state() is Study.apply folded in time order": store holds the server five; `sync()` → `pending()` 0; `store.online = false`; `record` o1, o2, o3 → `pending()` 3; `state()` deep-equals the test's own fold of `initialState()` with `apply` over `s1, o1, s2, s3, s4, s5, o2, o3`. Negative control: make the Ledger fold in arrival order → this test fails; revert.
- [AC6] "subscribe notifies on every change": `fn = vi.fn()`; `record(a100)` → 1 call, argument deep-equals `state()`; `record(a100)` again → still 1; `unsubscribe()`; `record(a101)` → still 1.
- [NFR] "survives a reopen": after AC4's records, `openLedger` again on the same `idb` → `state()` deep-equal, `pending()` 3.
- [CHORE] Migration (PGlite via `migrate` from `#lib/db/migrate.js`, CHY-23 S1; Linh/Nam as in CHY-23): Linh's `insert into lexicon_saves (word, saved_at) … on conflict (learner_id, word) do nothing` twice → `affectedRows` 1 then 0; a plain repeat → 23505; Linh inserting Nam's id → 42501 (RLS); Linh's `update` / `delete` of her row → 42501 `permission denied for table lexicon_saves`; Linh selects only her row; `anon` select → 42501; an Attempt with `step` `{"kind":"gate","lesson":"h1-01","run":"r1","of":10}` inserts and reads back `toEqual` (object compare, not string: jsonb reorders keys); `update attempts set step = null` → 42501. All ran on PGlite 0.5.15 during design (~/.capy/work/m3-scratch/w2-ledger.mjs).

## Open assumptions
- None: Q6 is decided (A, this migration).
