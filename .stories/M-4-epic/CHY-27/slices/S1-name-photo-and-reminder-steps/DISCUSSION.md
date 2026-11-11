# CHY-27 S1 — discussion
ACs: AC1, AC2, AC4 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- M-3 Q3 A (tz from the device at first run) — used in S2.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: which Google fields? A: `full_name`, then `name`; photo `avatar_url`, then `picture` (GoTrue copies Google's claims into `user_metadata`). An email-link learner starts with an empty name and initials "?". Confidence 85%.
- [AC1] Q: a Google name longer than 30 characters? A: trim, then keep the first 30, so the field never holds more than `maxlength` allows. Confidence 85%.
- [AC2] Q: the AC says 21:00 is selected; CONTEXT.md says the default is 20:00. A: the AC wins (Loc's rule); S2 syncs CONTEXT.md:79. Confidence 90%.
- [AC4] Q: why does "Học từ đầu" already navigate in S1? A: AC4 says "I can still continue", so "Tiếp" reaches the offer step and "Học từ đầu" leads to /today. "Kiểm tra trình độ" is wired in S2 because /placement exists only after CHY-28 S2 (Kit 3.1 `resolve` typing). Confidence 85%.
- [AC2] Q: Telegram subtitle when switched on? A: always "Mở @ChaiyoBot để kết nối": nothing connects the bot in M-4 (CHY-48), so the prototype's "Đã kết nối @ChaiyoBot" would be false. Confidence 80%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Name and photo default to Google, editable (CONTEXT.md "Public Profile").
