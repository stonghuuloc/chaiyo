# CHY-21 S1 — spec
ACs: AC1, AC2, AC3, AC8  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-20 S2**)

## Behaviour
- [AC8] `initialState(o?: { curriculum?, tz? })`: State gains `tz` (default `'Asia/Ho_Chi_Minh'`, WAVE-PLAN Q3) and `streak: { count: 0 }`. `streak.last` (a `YYYY-MM-DD` in `tz`) is set by the first counted day.
- [AC3] `Step` gains `{ kind: 'practice'; run: string; of: number }` (`of` = the session's card count). A practice run uses CHY-20 S1's run rules and emits no event of its own when it closes.
- [AC1] An `apply` call counts when, in that call, a section run closes (any section id, `gate` included) or a practice run closes. Let `day` = the date of `now` in `tz`. If `streak.last` is unset or `day > streak.last`: `count + 1`, `last = day`, emit `{ type: 'DayCounted', day, streak: count }` after the CHY-20 events. Otherwise nothing.
- [AC2] A second counting finish on the same `day` emits nothing and leaves `count`.
- [AC1] `rollover(state, day)` is exported (`day` = `YYYY-MM-DD`). In this slice it returns the State unchanged and `events: []`. S2 adds missed days. A counted day is never counted again by `rollover`.
- [AC8] `dates.ts` exports `localDate(d: Date, tz)` = `year-month-day` from `new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)` (CHY-19 S2's `localDate`, moved and shared). Not `en-CA` `.format()`: its `YYYY-MM-DD` is CLDR data that CLDR 42 changed to `M/d/y` and CLDR 43 reverted. 2026-10-23T17:30:00Z in Asia/Ho_Chi_Minh is 2026-10-24.
- [CHORE] docs/architecture.md:30 Study row: `rollover(state, day)`, `initialState({ curriculum, tz })`. CONTEXT.md:65 "Streak" second sentence becomes: "A day counts when, before midnight in the Learner's own timezone, they finished at least one [[Practice]] session (every card in it answered) or at least one lesson section (warm-up, new words, grammar, dialogue, listening/speaking, writing, or gate test)." (WAVE-PLAN Q5 A). `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Fixture (src/lib/study/fixtures/streak.ts)
`countDays(state, from, to)` applies, for each date, one practice run of 1 card (`你 · the`, right) at 12:00 in the State's `tz` (05:00Z for Asia/Ho_Chi_Minh). `bg` = `countDays(initialState({ curriculum: CURRICULUM }), '2026-11-01', '2026-11-12')` → `streak.count` 12, `last` `2026-11-12` (the ticket Background: Streak 12 before T6 = Friday 13 Nov; its "1 Freeze" is S2's). `finish(state, attempts)` folds `apply` over CHY-20 S1's `sectionRun(lesson, section, run, at)` (Attempts 1 s apart, so the run closes at `at + 9 s`); the Bài 0 case folds `gateRun('h0-00', 'g0', 3, at)`. `countDays` gives each date its own run id `p-<date>` (a reused id is a closed run and counts nothing).

## Not this slice
- AC4-AC7 and AC9 (Freeze earn/spend/cap, reset, gaps, DST) → S2. Until S2, a gap between counted days does not reset the Streak.

## Seam
`src/lib/study/streak.ts` (`countDay`, `rollover`), called from `apply.ts` after `progress`.

## Test contract (`streak.test.ts`; `days(events)` keeps DayCounted only)
- [AC1] "finishing a section counts today": `bg` + `finish(…, 'h1-01', 'words', 'w1', 2026-11-13T14:00:00Z)` (21:00 local) → `days` = `[{ day: '2026-11-13', streak: 13 }]`; then `rollover(s, '2026-11-13')` → `events` = [], `count` 13. A Bài 0 Gate run of 3/10 (`testOut`, no section needed) closing at 2026-11-14T05:00:00Z counts 14 Nov too (pass not needed). Negative control: 9 of 10 Từ mới answers → no DayCounted, `count` 12.
- [AC2] "two sections count once": `bg` + Từ mới closing 12:00Z (19:00) + Ngữ pháp closing 14:00Z (21:00) + `rollover(…, '2026-11-13')` → exactly one DayCounted (13 Nov, 13) across all three calls; `count` 13.
- [AC3] "a practice session also counts": `bg` + 3 Attempts of practice run `s1` (`of` 3, cards 你 好 您 · the) at 13:00Z → DayCounted only on the third (13 Nov, 13); `rollover` → [].
- [AC8] "day boundary uses the learner's timezone": `initialState({ curriculum: CURRICULUM })` + Từ mới closing at 2026-10-23T17:30:00Z → `[{ day: '2026-10-24', streak: 1 }]`. Negative control: the same with `tz: 'UTC'` → `day` `2026-10-23`.
- [CHORE] CHY-19 and CHY-20 tests pass unchanged (they filter their own event types).

## Open assumptions
- None: Q3 and Q5 are decided (WAVE-PLAN).
