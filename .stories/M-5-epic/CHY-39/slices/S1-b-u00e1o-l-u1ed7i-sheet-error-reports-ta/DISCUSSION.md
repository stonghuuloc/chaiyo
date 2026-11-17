# CHY-39 S1 — discussion
ACs: AC1, AC2, AC3, AC4, AC5 · source: `backlog/tasks/chy-39 - Báo-lỗi-sheet-X2.md` (gherkin)

## Current behaviour (verified, with anchors)
- [AC1] No report UI exists. Both entry points are stubs on the wave-1 tip `a65f4297`:
  `src/routes/(app)/word/[id]/+page.svelte:5` renders only `<h1>`; `src/routes/(app)/lesson/[id]/[section]/+page.svelte:5` same.
  The only running lesson step is `StepRunner` on `/dev/step` (`src/routes/dev/step/+page.svelte:27`).
- [AC1] StepRunner top bar is a 3-column grid: exit · segments · "3/6" label (`src/lib/lesson/StepRunner.svelte:39-62`).
  It owns `index` internally (`:21`), so only StepRunner knows the current step id.
- [AC1] Prototype sheet: title "Báo lỗi", context line, 5 `aria-pressed` chips, textarea, "Gửi" (disabled) + "Huỷ" (`prototype/w1-word.html:133-143`).
  Word Page trigger = flag button "Báo lỗi" under the content (`prototype/w1-word.html:272`). Icon `i-fill-flag` exists in the sprite.
- [AC1] UI kit has `Sheet` (`src/lib/ui/Sheet.svelte:7`, open/title/onclose) and `Toast` (`src/lib/ui/Toast.svelte:5`, 4500 ms).
  `Chip` (`src/lib/ui/Chip.svelte`) is a static pill, not a toggle — the sheet needs pressed chips of its own.
- [AC3] Context sources: StepRunner props `lesson`, `contentSha` (`StepRunner.svelte:13-15`), step `id` and optional `card.word`
  (`src/lib/lesson/steps/Choice.svelte:7,15`). Word Page: `catalog.word(id)` always returns `contentSha` (`src/lib/catalog/index.ts:96-100`).
- [AC4] No `error_reports` table (`supabase/migrations/` ends at `20261113000000_reminders.sql`). No admin role exists.
  Migrations are tested in PGlite with `migrate`/`asLearner`/`asOwner` (`src/lib/db/migrate.ts:19-42`).
- [AC5] The Ledger already has an IDB-backed offline queue: rows with `synced:false`, pushed by `sync()`,
  re-run on `window` `online` (`src/lib/ledger/ledger.ts:46-75`, `src/lib/ledger/online.ts:3-8`), idempotent upsert with
  `ignoreDuplicates` (`src/lib/ledger/supabase.ts:78-81`). Started per learner from `src/routes/(app)/+layout.ts:8`.

## Answered here (no human needed)
- [AC2] screens.md X2 lists 4 chips (no "Hán Việt sai", `docs/screens.md:149`); the AC lists 5. AC wins → 5 chips, prototype agrees.
- [AC1][AC5] Offline toast: AC1's scenario has no "online" Given, so "Đã gửi. Cảm ơn bạn!" shows on every "Gửi"; AC5 adds the queue. Same toast online and offline.
- [AC4] Epic Q2 = A (locked): the row is stored with `status = 'new'`; AC4 is proven by a SQL read; the inbox UI ("Mới" tab) is M-10 CHY-54.
- [AC5] Queue survives a reload and leaving the page: it must live in IndexedDB and flush from the app shell, not from the sheet.
  The Ledger's `online` pattern proves the shape; the reports queue is its own small store (the Ledger's `Input` union is engine-lane and Study-typed).
- [AC3] Word Page has no lesson/step → those columns are null there; a lesson step without `card` has no word → word null. `content_sha` is never null (both sources always carry it).
- [AC3] Reporter = `learner_id default auth.uid()`; every `(app)` route requires a session (`src/routes/(app)/+layout.ts:6`).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | who mounts the button in StepRunner + Word Page | A — CHY-39 mounts (≤6 lines), rebases on CHY-30.S2 + CHY-32.S2 tips, lands last in wave 2; owning lanes leave those lines alone | Loc via coordinator, 2026-11-16 |

## Open — needs an answer before spec
- none (Q1 answered → `Resolved in grilling`).

## Files outside the lane (Q1 = A)
- `src/lib/lesson/StepRunner.svelte` (engine) — top-bar "Báo lỗi" button with `{lesson, step, word, contentSha}` [AC1][AC3].
- `src/routes/(app)/word/[id]/+page.svelte` (words) — "Báo lỗi" button with `{word, contentSha}` [AC1][AC3].
- `src/routes/(app)/+layout.ts` (unowned) — start the report queue next to `learnerLedger` [AC5].

## Locked (do not re-open)
- Epic Q2 = A: store `status 'new'`, AC4 by SQL read, inbox UI = M-10 (Loc, 2026-11-13).
- Wave-2 lane table: no two lanes write one file in parallel.
