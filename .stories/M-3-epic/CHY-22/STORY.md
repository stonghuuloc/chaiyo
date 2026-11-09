# CHY-22 — Study: Badges

## Goal (business why, 1-2 sentences)
Award each permanent Badge once, at the moment its milestone is reached, from the same Attempts on the phone and on the server, so a learner keeps recognition even after losing a Streak.

## Context an agent can't derive from code
- Built on CHY-19, CHY-20 and CHY-21 (designed, not on main). **Depends on CHY-21 S2 merged** (lane L1 is serial): Bài 0 Gate and placement (CHY-20), `streak.count`, `StreakReset` (CHY-21).
- The badge list is the AC table; ids, titles and art match prototype/u1-badges.html:94-102. Titles go in the event (the AC: "emits BadgeEarned … titled …").
- Q9 (decided A): Study takes a Mock Test result Attempt now, so hsk1/hsk2 are proven before the Mock Test runner (CHY-56, M-11). Its shape joins C-M3-1: `step { kind: 'mock', level, mode: 'exam' | 'practice' }` with `correct` = passed. CHY-56 must emit it.
- CONTEXT.md "Badge": "never taken away, even when the Streak resets". `StreakReset` (CHY-21 S2) touches only `streak`.
- "Replays the same Attempts from the start with the earned badges in state" (AC3): a replay starts from `initialState({ …, badges })`, so earned Badges seed the fold. Keeping that seed across app restarts is the Ledger's (parked, WAVE-PLAN P8).
- Q12 asks Loc whether "the Lexicon reaches 100 words" counts unreviewed words (placed, saved). The SPEC assumes the AC's literal reading.

## Locked decisions (BA/Loc already ruled — never re-open)
- A Badge is earned once, never removed, kept on a Streak reset; only Exam-mode Mock Test results earn Badges (CONTEXT.md "Badge", "Mock Test").
- No points, XP or leagues (CONTEXT.md "Badge").

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Each of 9 milestones emits BadgeEarned with its title | high | S1 |
| AC2 | Each badge fires exactly once, even after a reset | high | S1 |
| AC3 | Replaying the same Attempts fires no badge again | high | S1 |
| AC4 | Badges survive a Streak reset | high | S1 |
| AC5 | A Practice-mode Mock Test earns nothing | high | S1 |

## Out of scope
- The badges screen and Public Profile (CHY-52, U1), the badge art, skill-run badges such as "50 tone-3 answers in a row" (CONTEXT.md mentions them; not in this AC list), Mock Test scoring (CHY-56).
