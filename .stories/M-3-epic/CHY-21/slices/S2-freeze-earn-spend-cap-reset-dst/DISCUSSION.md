# CHY-21 S2 — discussion
ACs: AC4, AC5, AC6, AC7, AC9 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q4 A: a Freeze is earned when the Streak reaches 7, 14, 21 …; Q3 A: dates in `settings.tz`. The others do not touch this slice.

## Answered here (≥80% rule, CREW.md)
- [AC7] Q: the Given "Streak 13 with 2 Freezes" cannot be built from Attempts. What does the test use? A: Streak 20 with 2 Freezes, then day 21. Under Q4 A a run earns its first Freeze at 7 and its second at 14; a missed day spends one and keeps the Streak; a reset happens only at 0 Freezes. So at Streak 7-13 a learner holds at most 1 Freeze, and Study tests may build State only through `initialState` and `apply` (CHY-19 AC7). 21 is the first count after 14 where the cap stops an earn, which is what the AC tests. Confidence 90%. Listed in the report as an AC wording map for Loc.
- [AC4] Q: who closes a missed day, `rollover` or `apply`? A: both, through one function. `rollover(state, day)` closes dates up to `day` (the nightly job, CHY-47, passes yesterday). `apply` closes the gap before it counts a new date, so the Ledger's fold (C-M3-2), which never calls `rollover`, gives the same Streak. Confidence 85%.
- [AC4] Q: is `rollover` idempotent? A: yes, via `through`; phone and server may both run it for the same date. Confidence 90%.
- [AC4] Q: what does a caller pass as `day`? A: a date that has ended in `tz`, normally yesterday. Passing today before the learner studies would close today as missed; that is the caller's contract, stated in the JSDoc of `rollover`. Confidence 80%.
- [AC5] Q: "earned Badges are unchanged" before CHY-22 exists? A: the test asserts that only `streak` changes, which covers badges once CHY-22 adds them; CHY-22 AC4 asserts it by name. Confidence 85%.
- [AC6] Q: Freeze earned on a count that follows a frozen day? A: yes (Q4 A). The first cycle cannot show it (Streak 6 holds 0 Freezes); the second can: `bg` + count 13 Nov + count 15 Nov → `[FreezeSpent 14 Nov (0), DayCounted 15 Nov (14), FreezeEarned 1]` (SPEC test "a frozen day inside the run still earns at 14"). Confidence 90%.
- [AC9] Q: which DST change? A: both US changes nearest to now: fall back 1 Nov 2026 (the AC's "Saturday before, Sunday and Monday after") and spring forward 14 Mar 2027; times at 23:30 / 00:30 local, where a fixed offset dates them wrongly (SPEC). Confidence 85%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Cap 2, auto-spend, frozen day keeps without adding, no Freeze → 0, Badges kept (STORY.md).
