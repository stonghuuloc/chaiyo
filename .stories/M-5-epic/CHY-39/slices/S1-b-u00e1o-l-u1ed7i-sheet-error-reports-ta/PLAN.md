# CHY-39 S1 — plan
ACs: AC1, AC2, AC3, AC4, AC5  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-39-S1
Base: .@a65f4297

Lint drift on this Base is the known stacked-branch false positive: `origin/main` merged then reverted the wave-1 stack
(`6af1ccd5`, `84504bbf`, `560783de`); anchors were read on this branch tip, which still has wave-1 code. CHY-30.S2 has the same Base.
Lands last in wave 2: Tasks 1–5 build on `a65f4297`; Task 6 rebases onto `origin/main` after CHY-30.S2 and CHY-32.S2 merge
(Q1 = A, DISCUSSION.md). Node: `source ~/.nvm/nvm.sh && nvm use 24`. Tests: `pnpm vitest --run <file>`.

## Anchors (verified 2026-11-16 on a65f4297)
- `supabase/migrations/20261113000000_reminders.sql:1` — newest migration; new file sorts after it.
- `src/lib/db/migrate.ts:19` `migrate(db)` · `:37` `asLearner(db, id)` · `:42` `asOwner(db)` — PGlite harness.
- `src/lib/db/reminders.test.ts:10-16` — beforeEach migrate + seed `auth.users` pattern.
- `src/lib/ledger/idb.ts:13-31` — `open`/`all`/`put` IDB helpers (pattern only; engine lane, not imported).
- `src/lib/ledger/online.ts:3-8` — `online` listener + immediate run (pattern).
- `src/lib/learner/index.ts:10-48` — one store per signed-in uid, `SIGNED_OUT` teardown (pattern).
- `src/lib/ledger/supabase.ts:48-49` — `fail(e, status)` error shape (pattern).
- `src/lib/ui/Sheet.svelte:7` props `{open, title, onclose, children}` · `src/lib/ui/Toast.svelte:5-13` props `{open, message, onclose}`.
- `src/lib/lesson/StepRunner.svelte:9-19` props · `:21` `index` · `:39` top-bar grid `grid-cols-[44px_1fr_auto]` · `:61` "n/N" label.
- `src/lib/lesson/steps/Choice.svelte:7,15` — step `id`, optional `card.word`.
- `src/routes/(app)/word/[id]/+page.svelte:5` — stub `<h1>` (CHY-32.S2 replaces it).
- `src/routes/(app)/+layout.ts:8` — `learnerLedger(data.session)` call site.
- `messages/vi.json:135` — last `lesson_*` key; new `report_*` block goes after it.
- `src/lib/assets/icons.svg` — `i-fill-flag` symbol exists (`scripts/build-icons.mjs:22`).
- PGlite probe (2026-11-16): insert-only grant + `on conflict (id) do nothing` → 42501; plain insert → ok, repeat → 23505.

## Task 1 [AC3][AC4] `error_reports` migration
File: new `supabase/migrations/20261116000000_error_reports.sql` (sorts after `20261113000000_reminders.sql:1`)
- Change: table + RLS + insert-only grant (draft below). `status` default `'new'`; insert policy pins `status = 'new'`
  and `learner_id = auth.uid()`. `category` check on 5 codes. `lesson_id`/`step_id` both null or both set. `note` null or 1–1000 chars.
- Test first: new `src/lib/db/error-reports.test.ts` (setup as `reminders.test.ts:10-16`):
  - `stores a lesson-step report as new` [AC3][AC4] — Linh inserts h1-01 / w03 / 你好 / sha1 / hanviet / "Hán Việt lệch";
    owner select → exactly that row, `status = 'new'`, `learner_id = LINH`.
  - `stores a word-page report with no lesson` [AC3] — lesson/step null, word 你好 → 1 row.
  - `learner cannot spoof, read, change or resolve` [NFR] — Nam's learner_id → 42501; status 'resolved' → 42501;
    select/update/delete → 42501.
  - `replayed id is a duplicate` [AC5] — same id twice → second throws 23505; owner count = 1.
  - `rejects a sixth category and a lesson without a step` [AC2][AC3] — 'spelling' → 23514; lesson set, step null → 23514.
- Verify: `pnpm vitest --run src/lib/db/error-reports.test.ts`

## Task 2 [AC5] IndexedDB report queue
Files: new `src/lib/report/types.ts`, new `src/lib/report/queue.ts`
- Change: `openQueue({ push, db, idb })` → `{ add(r), flush(), pending() }`. IDB db `db`, store `reports` keyPath `id`.
  `add` writes the row, then calls `flush()` without awaiting it. `flush` is single-flight (second call while running → rerun once,
  like `ledger.ts:96-99`); pushes rows oldest `at` first; deletes a row only after its push resolves; stops at the first throw (row kept).
- Test first: new `src/lib/report/queue.test.ts` (fake-indexeddb, a fake `push` with `online` flag):
  - `offline add stays pending, online flush sends once` [AC5] — offline add → pending 1, pushed 0; online, flush → pending 0, pushed 1.
  - `failed push keeps the row` [AC5] — push throws → pending 1; next flush succeeds → 0.
  - `rows survive reopening the database` [AC5] — add offline, open a 2nd queue on the same `IDBFactory` + name → pending 1.
  - `two adds during a running flush are both sent` [AC5] — 2 rows pushed, pending 0.
- Verify: `pnpm vitest --run src/lib/report/queue.test.ts`

## Task 3 [AC3][AC5] Supabase push + per-learner wiring
Files: new `src/lib/report/supabase.ts`, new `src/lib/report/index.ts`
- Change: `pushReport(client, learnerId)` returns `push(r)`: session check like `learner/index.ts:22-25`, then plain
  `insert` of the snake_case row; `error.code === '23505'` → resolve (already stored); other error → throw `fail(error, status)`.
  `openReports(session, { client, idb })` caches per uid (pattern `learner/index.ts:7-16`), opens `chaiyo-reports-<uid>`,
  adds `online` listener + immediate flush (pattern `online.ts:3-8`), tears down on `SIGNED_OUT` (`learner/index.ts:36-41`).
  `report(context, category, note)` → `client.auth.getSession()`, then `await openReports(session)` (cache hit after the layout
  opened it; opens it itself on a route outside `(app)` or before the layout's open resolved), builds
  `{ id: crypto.randomUUID(), ...context, category, note: note.trim() || null, at: new Date().toISOString() }` and `add`s it.
  No session → rejects. Row mapping: `id→id, lesson→lesson_id, step→step_id, word→word_id, contentSha→content_sha,
  category, note, at→created_at` (no `learner_id`: column default `auth.uid()`).
- Test first: new `src/lib/report/report.test.ts` (fake fetch client as `ledger/sync.test.ts:16-25`):
  - `report stores its context` [AC3] — `report({lesson:'h1-01',step:'w03',word:'你好',contentSha:'sha1'}, 'hanviet', ' Hán Việt lệch ')`
    → POST body `{id:<uuid>, lesson_id:'h1-01', step_id:'w03', word_id:'你好', content_sha:'sha1', category:'hanviet',
    note:'Hán Việt lệch', created_at:<ISO>}` — assert all 8 keys, `id` a uuid, `created_at` parses.
  - `word-page report has no lesson` [AC3] — `{lesson:null, step:null, word:'你好', contentSha:'sha1'}` → body `lesson_id:null, step_id:null, word_id:'你好'`.
  - `report opens the queue itself` [AC1][AC5] — no prior `openReports`; `report(...)` with a session → pending 1.
  - `blank note is null` [AC3] — note `'   '` → `note: null`.
  - `409 23505 counts as sent` [AC5] — fetch answers 409 `{code:'23505'}` → pending 0.
  - `queued report goes out on online` [AC5] — fetch rejects (offline) → pending 1; `window.dispatchEvent(new Event('online'))`
    with fetch ok → pending 0, 1 POST.
- Verify: `pnpm vitest --run src/lib/report/report.test.ts`

## Task 4 [AC1][AC2] ReportButton sheet + copy
Files: new `src/lib/report/ReportButton.svelte`; `messages/vi.json:135` (insert after `lesson_review_hint`)
- Change: prop `{ context: ReportContext }`. Flag button (`i-fill-flag`, label `m.report_open()`), `Sheet` (`Sheet.svelte:7`)
  titled `m.report_title()`, `role="group"` of 5 `<button aria-pressed>` chips (codes meaning·pinyin·hanviet·audio·other),
  `<textarea maxlength=1000 placeholder={m.report_note()}>`, "Gửi" `disabled={!category}`, "Huỷ". On Gửi: `await report(...)`,
  close, reset, `Toast` (`Toast.svelte:5`) `m.report_sent()`. Close/Huỷ resets category + note.
  `report()` rejects (no session) → catch, `console.error`, sheet stays open, no toast — never an unhandled rejection.
- Copy (vi.json): `report_open` "Báo lỗi", `report_title` "Báo lỗi", `report_group` "Loại lỗi", `report_meaning` "Nghĩa sai",
  `report_pinyin` "Pinyin sai", `report_hanviet` "Hán Việt sai", `report_audio` "Âm thanh lỗi", `report_other` "Khác",
  `report_note` "Ghi chú (không bắt buộc)", `report_send` "Gửi", `report_cancel` "Huỷ", `report_sent` "Đã gửi. Cảm ơn bạn!".
- Test first: new `src/lib/report/ReportButton.svelte.test.ts` (jsdom, `mount` as `StepRunner.svelte.test.ts:27-45`,
  queue opened with fake-indexeddb + offline fetch):
  - `Gửi is disabled until a category is picked` [AC1]
  - `two taps send and show the toast` [AC1] — chip "Pinyin sai" → Gửi → no dialog, `role=status` text "Đã gửi. Cảm ơn bạn!", pending 1.
  - `five chips, one pressed at a time` [AC2] — labels in AC2 order; press 2 then 3 → only 3 `aria-pressed=true`.
  - `cancel stores nothing and resets` [AC1] — pick, Huỷ → pending 0; reopen → none pressed, note "".
- Verify: `pnpm vitest --run src/lib/report/ReportButton.svelte.test.ts`

## Task 5 [AC5] Start the queue from the app shell
File: `src/routes/(app)/+layout.ts:8` (unowned; listed in DISCUSSION.md)
- Change: inside the same `if (data.session)` as `learnerLedger(...)`: `void openReports(data.session).catch(() => undefined);`
  — flush on load + `online` even before any report is sent this visit.
- Test first: covered by Task 3 `queued report goes out on online`; this task is one call line. Check: `pnpm check`.
- Verify: `pnpm check && pnpm vitest --run src/lib/report`

## Task 6 [AC1][AC3] Mount on lesson steps and the Word Page (after rebase)
Pre: CHY-30.S2 and CHY-32.S2 merged to `main`; `git fetch && git rebase origin/main` (only option — rebasing onto one lane's
branch then the other would carry the engine commits into this PR). Re-read both files, re-anchor.
File A: `src/lib/lesson/StepRunner.svelte:39-61` (engine lane, ≤4 lines)
- Change: grid template `grid-cols-[44px_1fr_auto]` → `grid-cols-[44px_1fr_auto_44px]` (`:39`), and a 4th cell after the
  "n/N" label: `<ReportButton context={{ lesson, step: steps[index].id,
  word: steps[index].card?.word ?? null, contentSha }} />`. Destructure `lesson`, `contentSha` from props (`:19`) if CHY-30.S2 has not.
- Test first: in `src/lib/report/StepRunnerReport.svelte.test.ts` (own file, not the engine test file):
  `reports the current step` [AC1][AC3] — mount StepRunner (fixture as `StepRunner.svelte.test.ts:7-24`) with CHY-30.S2's required
  `ledger` prop (`openLedger({ initial, store: memoryStore(), idb: new IDBFactory() })`; CHY-30.S2 SPEC @5ee5658e: top bar untouched), advance to step 2,
  report → queued row `step_id 'q1'`, `lesson_id 'h1-01'`.
File B: `src/routes/(app)/word/[id]/+page.svelte` (words lane, ≤2 lines, after CHY-32.S2's content)
- Change: `<ReportButton context={{ lesson: null, step: null, word: <page word>.id, contentSha: <page word>.contentSha }} />`
  — `<page word>` = whatever CHY-32.S2's `load` returns from `catalog.word(id)` (`catalog/index.ts:96-100`, always has `contentSha`).
- Test: agent-browser on port 5413, signed in (local Supabase) — `/dev/step` (report() opens the queue itself) and `/word/你好` show "Báo lỗi"; offline toggle → send → toast; online → row in
  local Supabase (`select status from error_reports` = `new`) [AC1][AC4][AC5].
- Verify: `pnpm vitest --run src/lib/report src/lib/lesson && pnpm check && pnpm lint`

## Mutation paths covered
- create: `report()` → queue `add` → `push` insert. Replay after lost response: 23505 = sent (Task 1, 3).
- No edit/delete path: learners cannot update/delete (Task 1); admin resolve = M-10.
- Cancel path stores nothing (Task 4). Sign-out tears the queue down; rows stay in that learner's IDB until next sign-in (Task 3).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk; a self-contradictory fixture → report it, don't hack it)
```sql
create table public.error_reports (
	id uuid primary key,
	learner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	lesson_id text,
	step_id text,
	word_id text,
	content_sha text not null,
	category text not null check (category in ('meaning', 'pinyin', 'hanviet', 'audio', 'other')),
	note text check (note is null or length(note) between 1 and 1000),
	status text not null default 'new',
	created_at timestamptz not null,
	received_at timestamptz not null default now(),
	check ((lesson_id is null) = (step_id is null))
);
alter table public.error_reports enable row level security;
create policy error_reports_insert on public.error_reports for insert to authenticated
	with check (learner_id = (select auth.uid()) and status = 'new');
revoke all on public.error_reports from anon, authenticated;
grant insert on public.error_reports to authenticated;
```
```ts
// src/lib/report/types.ts
export type Category = 'meaning' | 'pinyin' | 'hanviet' | 'audio' | 'other';
export type ReportContext = { lesson: string | null; step: string | null; word: string | null; contentSha: string };
export type Report = ReportContext & { id: string; category: Category; note: string | null; at: string };
```

## Rollback
`git revert` this slice's commits. Migration is additive (new table); hosted DB: `drop table public.error_reports;`
IDB `chaiyo-reports-<uid>` is orphaned harmlessly on revert.
