# CHY-39 — Báo lỗi sheet (X2)

<!-- ONE page. Refined in .refined-epics/M-5-lesson-player/report.md (wave plan, seams, Q rows). -->

## Goal (business why, 1-2 sentences)
As a learner, I want to report a content error in two taps, so that the admin can fix it.

## Context an agent can't derive from code
- No `error_reports` table yet. Admin inbox is M-10 task "Error Reports inbox (A1)".
- Open in refinement: Q2 store row status new; inbox stays M-10 (default A). Defaults are proposals, not locked — confirm at discuss.

## Locked decisions (BA/Loc already ruled — never re-open)
- Slice split + wave plan approved in the M-5 refinement (2026-11-13).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Two taps; "Gửi" disabled until a category; toast "Đã gửi. Cảm ơn bạn!". | low | S1 |
| AC2 | 5 category chips. | low | S1 |
| AC3 | Stores lesson, step, word, content sha, category, optional note. | low | S1 |
| AC4 | Appears in the Admin inbox (E10) as "Mới". | low | S1 |
| AC5 | Offline → queued, sent on reconnect. | low | S1 |


## Out of scope
- Admin inbox UI (M-10) unless Q2 = B
