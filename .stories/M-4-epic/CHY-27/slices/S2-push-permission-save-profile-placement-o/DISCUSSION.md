# CHY-27 S2 — discussion
ACs: AC3, AC5, AC6 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- M-3 Q3 A: `settings.tz` from the device at first run. WAVE-PLAN Q2 (photo storage) is assumed A here.

## Answered here (≥80% rule, CREW.md)
- [AC3] Q: is "push on" a subscription? A: no, a stored choice (`remind_push`). A Web Push subscription needs VAPID keys and a sender, which CHY-48 owns; the AC asks only for the prompt and its result. Confidence 85%.
- [AC3] Q: Safari in a tab has no `Notification`? A: treated as denied with the same message, as the prototype does (o1-welcome.html:125). Push on iPhone works only in an installed web app (CHY-61). Confidence 80%.
- [AC5] Q: one row per learner or per device for push? A: one boolean per learner now; per-device push targets come with subscriptions in CHY-48. Confidence 80%.
- [AC5] Q: when is `onboarded_at` written? A: when the learner taps either offer button, after the save succeeds, so a learner who closes the tab on step 1 sees Welcome again at the next sign-in. Confidence 85%.
- [AC5] Q: the reminder columns on `settings` or a new table? A: `settings`: one row per learner already, owner-only RLS (learner_tables.sql:46-51), and Settings U4 edits the same values. Confidence 85%.
- [AC6] Q: "Home with Bài 0 as the current lesson" before Home exists? A: proven as the landing URL `/today` plus the Study state (only h0-00 unlocked, `placed` 0); Home's lesson card is CHY-45's AC. Confidence 80%; Loc's approval ask names this reading so the AC6 tick is not read as the card.
- [CHORE] Q: CONTEXT.md says 20:00? A: the AC says 21:00; the doc follows the AC in this slice. Confidence 90%.

## Open — needs an answer before execute
None: WAVE-PLAN Q2 is assumed A.

## Locked (do not re-open)
- Reminder: once a day, any mix of channels (CONTEXT.md "Reminder"); `settings.tz` (M-3 Q3 A).

## Answered here (implementation, 2026-11-12)
- [AC6] Q: Toast for "Chưa lưu được" and "Chưa đọc được ảnh"? A: no, an inline `role="alert"` line above the action bar. The fixed Toast sits at bottom 20px and covers the sticky action bar (retry button on the offer step, "Tiếp" on step 0), against ADR 0008 (floating UI never covers content). Same copy; SPEC said Toast. Confidence 85%.
