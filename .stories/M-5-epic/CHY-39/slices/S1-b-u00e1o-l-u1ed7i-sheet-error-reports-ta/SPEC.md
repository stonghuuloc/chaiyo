# CHY-39 S1 — spec
ACs: AC1, AC2, AC3, AC4, AC5  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC1] A "Báo lỗi" button (flag icon) shows in the StepRunner top bar on every lesson step, and on the Word Page.
  Tapping it opens a sheet titled "Báo lỗi". Verified by: button present on both, sheet opens on click.
- [AC1] In the sheet, "Gửi" is disabled while no category is picked, and enabled once one is picked.
- [AC1] Tap 1 = a category chip, tap 2 = "Gửi": the sheet closes and the toast "Đã gửi. Cảm ơn bạn!" shows.
  The toast shows whether the device is online or offline (DISCUSSION.md → Answered here).
- [AC1] "Huỷ", the scrim, or Escape closes the sheet and stores nothing. Reopening starts with no chip and an empty note.
- [AC2] The sheet shows exactly 5 chips, in this order: "Nghĩa sai", "Pinyin sai", "Hán Việt sai", "Âm thanh lỗi", "Khác".
  At most one chip is pressed (`aria-pressed="true"`); tapping another chip moves the selection.
- [AC3] A sent report stores: lesson id, step id, word id, content sha, category, note, reporter, created time.
  Lesson step: lesson = StepRunner `lesson`, step = current step `id`, word = step `card.word` or null.
  Word Page: lesson = null, step = null, word = the page's word id. Content sha is never null.
- [AC3] The note field has placeholder "Ghi chú (không bắt buộc)". Empty or whitespace-only note → stored as null.
  Example: lesson `h1-01`, step `w03`, word `你好`, category "Hán Việt sai", note "Hán Việt lệch" → one row with those 5 values + sha.
- [AC4] The stored row has `status = 'new'` (the M-10 inbox shows `new` as "Mới"). Verified by: SQL read as table owner.
- [NFR] A learner can insert only rows with their own `learner_id`; select/update/delete → 42501 (insert-only grant; admin read = M-10).
- [AC5] Each report gets a client id at "Gửi" and is written to an IndexedDB queue before any network call.
- [AC5] Offline at "Gửi": the row stays queued (pending = 1), no row reaches the server.
  When the window fires `online`, the queue pushes it; then pending = 0 and the server has exactly 1 row.
- [AC5] A push of the same client id twice stores 1 row; the duplicate insert's 23505 counts as sent (idempotent replay).
  Plain insert, not upsert: `on conflict do nothing` needs a SELECT grant and then fails RLS (probed in PGlite 2026-11-16).
- [AC5] The queue flushes on app load (signed-in `(app)` layout), on every "Gửi", and on every `online` event — also when the learner left the lesson.
- [AC5] A push failure keeps the row queued; it never drops a report.
- [LOCK] Epic Q2 = A: no inbox UI in this slice; AC4 is proven by a SQL read.

## Not this slice
- Admin inbox UI, "Mới"/"Đã xử lý" tabs, admin read RLS, resolve/undo → M-10 CHY-54.
- Báo lỗi on the Word Page's real content (POS groups, examples) → CHY-32.S2 builds the page; this slice adds only the button.
- Lesson section routes that mount StepRunner with real content → CHY-25.S2 / CHY-31 / CHY-33 / CHY-34. The button rides StepRunner, so every mount gets it.
- Report from a tapped-hanzi popup (X1) → not in CHY-39.

## Seam
New module `src/lib/report/` — `ReportButton.svelte` (button + sheet + toast) taking one `context` prop,
and `openReports(session)` (IDB queue + Supabase push + `online` flush). New table `public.error_reports`.

## Test contract
- [AC1] client test (jsdom): mount `ReportButton` → click button → sheet open, "Gửi" disabled; pick chip → enabled; click "Gửi" → sheet gone, toast text "Đã gửi. Cảm ơn bạn!".
- [AC1] client test: "Huỷ" closes, queue pending stays 0; reopen → no chip pressed, note empty.
- [AC1] client test: `StepRunner` top bar renders the "Báo lỗi" button; on step 2 it reports `step = 'q1'`.
- [AC2] client test: 5 chips, labels in order; pressing chip 2 then chip 3 leaves only chip 3 pressed.
- [AC3] unit test: `send(context, 'hanviet', ' Hán Việt lệch ')` → queued row has lesson/step/word/sha/category, note "Hán Việt lệch"; note "  " → null.
- [AC3][AC4] PGlite test: migrate, insert as learner Linh → owner `select status, lesson_id, step_id, word_id, content_sha, category, note` = expected row, status `new`.
- [NFR] PGlite test: Linh inserts with Nam's `learner_id` → 42501; Linh select/update/delete → 42501; second insert of one id → 23505.
- [AC5] unit test (fake-indexeddb + memory store): offline send → pending 1, store rows 0; dispatch `online` → pending 0, store rows 1.
- [AC5] unit test: store answers 23505 → row marked sent (pending 0); store throws other error → pending stays 1.
- [AC5] unit test: reopen the queue on the same IDB name → the unsent row is still pending (survives reload).

## Open assumptions
- none. Q1 (mount ownership) answered A — see DISCUSSION.md → Resolved in grilling.
