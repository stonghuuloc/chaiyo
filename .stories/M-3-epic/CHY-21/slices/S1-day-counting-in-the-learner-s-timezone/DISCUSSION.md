# CHY-21 S1 — discussion
ACs: AC1, AC2, AC3, AC8 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q3 A: `settings.tz` ends the day; Q5 A: any finished practice session counts, and CONTEXT.md "Streak" is reworded here. The other eight do not touch this slice.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: the AC says "rollover runs for T6, then it emits DayCounted". Which call emits it? A: `apply`, at the Attempt that closes the run; `rollover` for a counted day emits nothing. The tests assert DayCounted once across the `apply` calls and the `rollover` call. The phone must show "Streak counts today" right after the section (CHY-24 AC1), before any rollover runs. Confidence 85%.
- [AC8] Q: where does `tz` come from inside `apply`? A: State, set once by `initialState({ tz })` from `settings.tz` (Q3 A). `rollover` then needs only a date: `rollover(state, day)`, a change to the signature in docs/architecture.md:30. Confidence 85%: `apply(state, input, now)` has no other channel, and a tz argument on `rollover` could disagree with the one in State. If `settings.tz` changes, the next fold uses the new zone for all history; rare (Q3 A: changed only in Settings).
- [AC3] Q: how does Study know a practice session is finished? A: the session's Attempts carry `step { kind: 'practice', run, of }`, `of` = the number of cards `session()` returned; the run closes at `of` distinct questions. Confidence 80%: Study cannot rebuild a past session (it depends on `now`, `only` and the cap), so the screen must say its size.
- [AC1] Q: does a failed Gate run count a day? A: yes: CONTEXT.md lists "gate test" among sections, and CHY-20 S1 emits SectionDone `gate` for every closed run. Confidence 80%.
- [AC1] Q: does a warm-up count? A: yes when its run closes (any section id). CONTEXT.md lists warm-up. Confidence 85%.
- [AC8] Q: why string dates? A: `YYYY-MM-DD` compares in order as text, and calendar steps on it ignore DST (S2). Confidence 90%.
- [AC1] Q: S1 leaves gaps unpunished. Safe? A: yes: nothing outside `src/lib/study` calls Study before CHY-24 S3, which waits for CHY-21 S1 only for "Streak counts today". S2 lands next in the same lane. Confidence 85%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Freeze rules and Badges kept on reset (STORY.md).
