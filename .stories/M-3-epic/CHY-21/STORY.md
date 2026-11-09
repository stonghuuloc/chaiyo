# CHY-21 — Study: Streak + Freeze rollover

## Goal (business why, 1-2 sentences)
Count a learner's study days in their own timezone, earn and spend Streak Freezes, and reset the Streak on a missed day, with one implementation so the phone and the nightly server job always agree.

## Context an agent can't derive from code
- Built on CHY-19 and CHY-20 S1 (designed, not on main): `apply`, runs (`Attempt.step`), `SectionDone`. **Depends on CHY-20 S2 merged** (lane L1 is serial; SectionDone itself comes from CHY-20 S1).
- Q3 (decided A): the learner's day ends at midnight in `settings.tz` (CHY-23 S1, IANA name, default `Asia/Ho_Chi_Minh`). The Ledger and the Edge Function pass it once: `initialState({ curriculum, tz })`.
- Q5 (decided A): a day counts when the learner closes any section run (a Gate run included, pass or fail) or finishes one Practice session (every card in it answered). CONTEXT.md:65 still says "cleared every skill's due Practice"; S1 rewrites that sentence.
- Q4 (decided A): a Freeze is earned when the Streak reaches a multiple of 7 (7, 14, 21 …), cap 2; the prototype does the same (prototype/streak.js:16).
- Ticket dates: "T2 … T6" are Vietnamese weekdays (Thứ Hai = Monday … Thứ Sáu = Friday). The tests use the week of Monday 2026-11-09: T2 = 9 Nov, T3 = 10 Nov, T4 = 11 Nov, T6 = 13 Nov.
- A Streak day is a calendar date string `YYYY-MM-DD` in `tz`. Instants become dates only through `Intl.DateTimeFormat` with `timeZone`; dates step by calendar arithmetic, never by adding 24 h, so a 23 h or 25 h DST day cannot lose or double a date.
- docs/architecture.md:30 names `rollover(state, day, tz)`; with `tz` in State it becomes `rollover(state, day)` (S1 edits the row).

## Locked decisions (BA/Loc already ruled — never re-open)
- Freeze cap 2, spent automatically on a missed day, a frozen day keeps the Streak without adding, no Freeze → Streak 0, Badges kept (CONTEXT.md "Streak Freeze", "Badge").
- Study is pure and the one implementation shared by phone and Edge Function (docs/architecture.md:40).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Finishing a section counts today; Streak 12 → 13 | high | S1 |
| AC2 | Two sections in one day count once | high | S1 |
| AC3 | A finished practice session also counts | high | S1 |
| AC4 | Missed day with a Freeze keeps the Streak without adding | high | S2 |
| AC5 | Missed day without a Freeze resets the Streak to 0 | high | S2 |
| AC6 | Seventh counted day earns a Freeze | high | S2 |
| AC7 | Freeze cap is 2 | high | S2 |
| AC8 | Day boundary uses the learner's timezone | high | S1 |
| AC9 | A DST change does not lose or double a day | high | S2 |

## Out of scope
- Badges (CHY-22). The nightly job that calls `rollover` (CHY-47) and its `service_role` grants (WAVE-PLAN P4). Streak screens and the celebration (CHY-41 and later). Reminders (CHY-47).
