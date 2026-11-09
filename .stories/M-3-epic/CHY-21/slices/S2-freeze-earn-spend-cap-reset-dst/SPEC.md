# CHY-21 S2 — spec
ACs: AC4, AC5, AC6, AC7, AC9  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-21 S1**)

## Behaviour
- [AC4] `streak` gains `freezes: number` (0 at start) and `through?: string`, the last date that is closed (counted, frozen or reset).
- [AC4] Closing a date `d` (only when `streak.last` is set and `d > (through ?? last)`): if `freezes > 0`: `freezes − 1`, emit `{ type: 'FreezeSpent', day: d, freezes }` (the count left), `count` unchanged; else if `count > 0`: `count = 0`, emit `{ type: 'StreakReset', day: d }`; else nothing. Then `through = d`.
- [AC4] `rollover(state, day)` closes every date from the day after `through ?? last` up to `day`, in order, and returns `{ state, events }`; it never emits DayCounted. A second call for a closed date returns `events: []`. With no `last` it is a no-op.
- [AC5] A reset changes only `streak`: Lexicon, lessons, runs and (CHY-22) badges are untouched.
- [AC4] `apply`, when it counts date `D` and `D > (through ?? last)`, first closes every date from the day after `through ?? last` to `D − 1` by the same rule, then counts `D` and sets `through = D`. A finish on a date ≤ `through` counts nothing and emits nothing, so `through` never moves back. `rollover` returns a view for its caller: later Attempts are folded from the Attempts (C-M3-2), never onto a rolled-over State (JSDoc). Event order: FreezeSpent / StreakReset, DayCounted, FreezeEarned.
- [AC6] After a count makes `count` a multiple of 7 (WAVE-PLAN Q4 A) and `freezes < 2`: `freezes + 1`, emit `{ type: 'FreezeEarned', freezes }`.
- [AC7] At `freezes = 2` no Freeze is earned and no event is emitted.
- [AC9] Dates step by calendar (`Date.UTC(y, m, d + 1)` on the `YYYY-MM-DD` parts), never by `+ 86 400 000` on an instant; instants become dates only through S1's `localDate(now, tz)`.
- [CHORE] `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Worked values (scratch ports ~/.capy/work/m3-scratch/w2-chy21.mjs and delta-chy21/, every row ran)
`countDays` from S1 (one practice run at 12:00 local per date):
| case | built with | given | call | events | after |
|---|---|---|---|---|---|
| Background | 1 → 12 Nov | count 12, freezes 1 (earned 7 Nov) | — | — | — |
| AC4 | 30 Oct → 10 Nov | 12, 1 (earned 5 Nov) | `rollover('2026-11-11')` | FreezeSpent 11 Nov, freezes 0 | count **12**, freezes 0 |
| AC4 next | (AC4 after) | 12, 0 | count 12 Nov | DayCounted 12 Nov, 13 | 13, 0 |
| AC5 | 29 Oct → 4 Nov, then 6 → 10 Nov (5 Nov missed) | 12, 0 (earned 4 Nov, spent 5 Nov) | `rollover('2026-11-11')` | StreakReset 11 Nov | **0**, 0 |
| AC6 second cycle | Background, then count 13 Nov | 13, 1 | count 15 Nov (14 Nov missed) | FreezeSpent 14 Nov (0); DayCounted 15 Nov, 14; FreezeEarned 1 | 14, **1** |
| AC6 | 4 → 9 Nov | 6, 0 | count 10 Nov | DayCounted 10 Nov, 7; FreezeEarned 1 | 7, **1** |
| AC7 | 21 Oct → 9 Nov | 20, 2 (earned 27 Oct, 3 Nov) | count 10 Nov | DayCounted 10 Nov, 21 | 21, **2** |
| gap in a fold | Background | 12, 1 | count 15 Nov, no rollover | FreezeSpent 13 Nov (0); StreakReset 14 Nov; DayCounted 15 Nov, 1 | 1, 0 |
AC7's ticket Given "Streak 13 with 2 Freezes" cannot be reached through Attempts under Q4 A (a run earns its 2nd Freeze at 14, and a reset needs 0 Freezes), so the test uses Streak 20 → 21, the next multiple of 7 where the cap blocks an earn (DISCUSSION).

AC9 in America/New_York: Từ mới closes at 2026-11-01T03:30:00Z (Sat 31 Oct 23:30 EDT), 2026-11-02T04:30:00Z (Sun 1 Nov 23:30 EST), 2026-11-02T05:30:00Z (Mon 2 Nov 00:30 EST), with `rollover` for 31 Oct, 1 Nov, 2 Nov after each → DayCounted 31 Oct (1), 1 Nov (2), 2 Nov (3); every `rollover` → []. A fixed −4 h offset would date the Sunday finish 2 Nov. Spring: 2027-03-13T05:30:00Z (Sat 00:30 EST), 2027-03-15T03:30:00Z (Sun 14 Mar 23:30 EDT), 2027-03-15T04:30:00Z (Mon 00:30 EDT) → 13, 14, 15 Mar; a fixed −5 h offset dates both the Sunday and the Monday finish 14 Mar.

## Not this slice
- AC1-AC3, AC8 (counting, timezone) → S1. Badges (CHY-22).

## Seam
`src/lib/study/streak.ts` (`closeDays`, `countDay`, `rollover`).

## Test contract (`freeze.test.ts`; `own` keeps DayCounted, FreezeEarned, FreezeSpent, StreakReset)
- [AC4] "missed day with a Freeze": AC4 row → `own` = `[FreezeSpent { day: '2026-11-11', freezes: 0 }]`, no DayCounted, `count` 12; the same `rollover` again → []; "AC4 next" row. Background row asserted as its own test.
- [AC5] "missed day without a Freeze": AC5 row → `[StreakReset { day: '2026-11-11' }]`, `count` 0; `{ ...after, streak: null }` deep-equals `{ ...before, streak: null }`; then `rollover('2026-11-12')` → [] (count 0 and no Freeze: nothing).
- [AC6] "seventh day earns a Freeze": AC6 row, exact list `[DayCounted { day: '2026-11-10', streak: 7 }, FreezeEarned { freezes: 1 }]`.
- [AC7] "cap is 2": AC7 row → `[DayCounted { day: '2026-11-10', streak: 21 }]`, `freezes` 2. Negative control: cap 3 in code → a FreezeEarned appears; revert.
- [AC4] "a fold closes gaps": "gap in a fold" row (exact list).
- [AC4] "a closed date stays closed": `bg` + `rollover('2026-11-14')` → `[FreezeSpent 13 Nov (0), StreakReset 14 Nov]`; then (defensive path) a Từ mới run closing 2026-11-13T14:00:00Z → `own` [] and `streak` deep-equal; then `rollover('2026-11-14')` → []. Negative control: compare with `last` instead of `through` → DayCounted 13 Nov (1) and a second StreakReset; revert.
- [AC6] "a frozen day inside the run still earns at 14": "AC6 second cycle" row, exact list `[FreezeSpent { day: '2026-11-14', freezes: 0 }, DayCounted { day: '2026-11-15', streak: 14 }, FreezeEarned { freezes: 1 }]` (pins Q4 A: a "7 consecutive calendar days" rule earns nothing here).
- [AC9] "DST does not lose or double a day": both sequences above, exact DayCounted lists, `rollover` events [] each, no FreezeSpent or StreakReset anywhere. Negative control: compute the date as `new Date(t − 4 h).toISOString().slice(0, 10)` → the fall test fails; revert.

## Open assumptions
- None: Q4 is decided. The AC7 Given change is a test-data mapping, listed for Loc in the report.
