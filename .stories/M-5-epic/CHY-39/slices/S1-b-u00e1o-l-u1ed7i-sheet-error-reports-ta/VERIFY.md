# CHY-39 S1 — verify
Env: 2026-11-17, dev server :5199 on the M-5 ticket stack tip (CHY-39), local Supabase, real login (OTP from Mailpit,
`verify-c-1@example.test`), agent-browser session `verify-c`. Rows read with `psql` as `postgres` (table owner).
Local DB lacked the table: `20261116000000_error_reports.sql` applied by hand before the run (local only).
Screenshots: scratchpad `verify-c/c39-*.png`.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | "Báo lỗi" button in the StepRunner top bar on `/lesson/h1-01/grammar` (step 1/8) and `/lesson/h1-01/listenSpeak` (1/3), and on `/word/家?lesson=h1-04`. Click → sheet heading "Báo lỗi", "Gửi" disabled; pick a chip → enabled; "Gửi" → sheet closes, toast "Đã gửi. Cảm ơn bạn!" (also with the push blocked). "Huỷ" and Escape close it; reopen → 0 chips pressed, note empty; no row stored by either. |
| AC2 | ✅ | Sheet chips in order: Nghĩa sai, Pinyin sai, Hán Việt sai, Âm thanh lỗi, Khác. Press Pinyin sai then Hán Việt sai → only `Hán Việt sai aria-pressed=true`. |
| AC3 | ✅ | Word page, Hán Việt sai, note " Hán Việt lệch " → row `lesson ∅ · step ∅ · word 家 · sha 867bbad8c308… · hanviet · "Hán Việt lệch"`. Grammar step → `h1-01 · h1-g01 · word ∅ · other · note ∅`. Speak step → `h1-01 · q-h1-01-s01 · word ∅ · audio`. Placeholder "Ghi chú (không bắt buộc)". |
| AC4 | ✅ | All 4 stored rows `status = new` (owner SQL). |
| AC5 | ✅ | `POST /rest/v1/error_reports` aborted via `network route --abort`; "Gửi" → toast shown, IDB `chaiyo-reports-<uid>` pending = 1, server rows with note "offline test" = 0. Route lifted + `online` event → pending 0, server rows 1 (`∅ · ∅ · 你 · pinyin · new`); 2nd `online` → still 1. |
| NFR | ✅ | Learner JWT via REST: select → 42501, update → 42501, delete → 42501, insert with another `learner_id` → 42501 (RLS). |

**The ⚠️ is scoped:** none raised. Two coverage notes, not mismatches:
1. Chrome rejected offline emulation (`Network.emulateNetworkConditions` unsupported), so the run blocked the report
   endpoint and fired `online` itself. `navigator.onLine` stayed `true`.
2. No rendered lesson step carries `card` yet: dev `/dev/step` choice steps have none, and real choice cards ship with
   CHY-32.S1. Lesson-step `word = card.word` is proven by `StepRunnerReport.svelte.test.ts` only. Non-choice steps
   store `word ∅` live, which proves the stack fix `fix(report): read the card word only on choice steps`.

## Tests
`vitest --run --coverage` on the stack tip → 130 files, 3164 passed, 0 failed; branches 79.19 %.

## Residual risk
- Hosted Supabase needs `20261116000000_error_reports.sql` pushed before the report button can store anything there.
