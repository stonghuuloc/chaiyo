# CHY-21 S1 — plan
ACs: AC1, AC2, AC3, AC8  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-21  ·  Lane L1 (WAVE-PLAN)

## Depends on (execution order)
- CHY-20 S2 merged (L1 serial). Uses CHY-20 S1's runs and `SectionDone`, CHY-19 S2's `localDate` in `session.ts`, fixtures `curriculum.ts` / `runs.ts`.

## Anchors (verified 2026-11-09 on main 90fbe31)
- `CONTEXT.md:65` — the "Streak" sentence Task 3 rewrites (WAVE-PLAN Q5 A).
- `docs/architecture.md:30` — Study row (`rollover(state, day, tz)` → `rollover(state, day)`).
- `prototype/streak.js:1-4` — prototype rule: a section or a practice session counts.
- `.stories/M-3-epic/CHY-19/slices/S2-session-builder-estimate-saved-words/PLAN.md:22,44` — `localDate(d: Date, tz)`; this slice moves it to `dates.ts` and builds it from `formatToParts` (SPEC AC8), not `en-CA` `.format()`.
- `supabase/migrations/20261110000000_learner_tables.sql` (CHY-23 S1, not on main) — `settings.tz` default `Asia/Ho_Chi_Minh`.

## Task 1 [AC8] `tz`, `streak`, `localDate` shared
Files: `src/lib/study/types.ts`, `src/lib/study/apply.ts`, `src/lib/study/session.ts`, `src/lib/study/dates.ts` (new: `localDate` moved out of `session.ts`)
- Change: `initialState({ curriculum, tz })`; `streak: { count: 0 }`; `session` imports `localDate` from `dates.ts`.
- Test first: `src/lib/study/fixtures/streak.ts` (`countDays`, `finish`), `src/lib/study/streak.test.ts` "day boundary uses the learner's timezone" with the UTC control.
- Verify: `pnpm vitest run src/lib/study -t "timezone"` → pass after Task 2.

## Task 2 [AC1] [AC2] [AC3] Counting
Files: `src/lib/study/streak.ts` (new), `src/lib/study/types.ts` (practice `Step`), `src/lib/study/progress.ts` (returns whether a section or practice run closed), `src/lib/study/apply.ts`, `src/lib/study/index.ts` (export `rollover`)
- Change: `progress` reports `counts: boolean`; `apply` calls `countDay(state, now)` when true; `rollover` returns `{ state, events: [] }`.
- Tests: "finishing a section counts today" (+ Bài 0 Gate 3/10, + 9-of-10 control), "two sections count once", "a practice session also counts".
- Verify: `pnpm vitest run src/lib/study/streak.test.ts` → pass. Negative control: drop the `day > last` check → AC2 sees two DayCounted; revert.

## Task 3 [CHORE] Docs and gates
Files: `docs/architecture.md:30`, `CONTEXT.md:65`
- Change: Study row signatures per SPEC; CONTEXT.md sentence per SPEC [CHORE], nothing else in the file.
- Verify: `pnpm check`, `pnpm lint` (it does not check .md: .prettierignore:20 ignores `*.md`, so read the CONTEXT.md diff by eye: one sentence changed), `pnpm test`, `pnpm build` exit 0; CHY-19/CHY-20 tests unchanged and green.

## Mutation paths covered
- First count ever, next day, same day again, section vs Gate vs practice finish, unfinished run (no count), rollover on a counted day (no-op).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/study/streak.ts
export function countDay(s: State, now: Date): { state: State; events: StudyEvent[] } {
	const day = localDate(now, s.tz);
	if (s.streak.last && day <= s.streak.last) return { state: s, events: [] };
	const count = s.streak.count + 1;
	return { state: { ...s, streak: { ...s.streak, count, last: day } }, events: [{ type: 'DayCounted', day, streak: count }] };
}
export const rollover = (s: State, _day: string) => ({ state: s, events: [] as StudyEvent[] });
```
SPEC values ran on the scratch port (~/.capy/work/m3-scratch/w2-chy21.mjs). Report any difference to the lead.

## Rollback
`git revert`; no migration, no data. CONTEXT.md returns to the old sentence with it.
