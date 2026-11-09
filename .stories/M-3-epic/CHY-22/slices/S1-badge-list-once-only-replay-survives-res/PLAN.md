# CHY-22 S1 — plan
ACs: AC1, AC2, AC3, AC4, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-22  ·  Lane L1 (WAVE-PLAN)

## Depends on (execution order)
- CHY-21 S2 merged (`rollover`, `StreakReset`, `fixtures/streak.ts`), which sits on CHY-20 S1-S2 (Gate, placement, `fixtures/curriculum.ts`, `runs.ts`) and CHY-19 S1-S2.

## Anchors (verified 2026-11-09 on main 90fbe31)
- `prototype/u1-badges.html:94-102` — ids, titles (`t`), art for the 9 badges.
- `backlog/tasks/chy-22 - Study-Badges.md` (AC table) — the same 9 ids and titles; the test copies them from the AC, not from code.
- `CONTEXT.md:100` — "Badge": earned once, never taken away, even when the Streak resets.
- `CONTEXT.md:60` — "Mock Test" modes: only Exam results earn Badges.

## Task 1 [AC1] [AC5] Badge list, `badges`, `written`, mock step
Files: `src/lib/study/badges.ts` (new), `src/lib/study/types.ts`, `src/lib/study/apply.ts`, `src/lib/study/progress.ts` (skip mock steps), `src/lib/study/index.ts`
- Change: `BADGES` const; `initialState({ badges })`; `apply` adds `[...word].length` to `written` on a scheduled right `viet` Attempt, then calls `award(state, input, now)` last on every path, including CHY-19 S2's WordSaved branch and its nghe-on-saved early return. `apply` sends a `step.kind === 'mock'` Attempt to neither `progress` nor `countDay`; only `award` reads it.
- Test first: `src/lib/study/badges.test.ts` one `it` per SPEC table row and "Practice mode earns nothing" with both controls.
- Verify: `pnpm vitest run src/lib/study/badges.test.ts` → pass. Negative control: drop the `mode === 'exam'` check → AC5 fails; revert.

## Task 2 [AC2] [AC3] [AC4] Once only, replay, reset
File: `src/lib/study/badges.test.ts`
- Tests: "each badge fires once", "replay does not fire again" (with the no-seed control), "badges survive a reset" (SPEC lines).
- Verify: `pnpm vitest run src/lib/study/badges.test.ts` → pass. Negative control: let `award` skip the `!state.badges[id]` check → AC2 sees a second streak7; revert.

## Task 3 [CHORE] Docs and gates
File: `docs/architecture.md:30`
- Change: Study interface cell `initialState({ curriculum, tz })` → `initialState({ curriculum, tz, badges })`, and add `BADGES` after `minutes`; touch no other row.
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0; every earlier Study test green.

## Mutation paths covered
- Earn on each rule; already earned (no-op); seeded by `initialState` (no-op); Practice-mode or failed mock (no-op); reset and rollover (badges untouched).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/study/badges.ts
export const BADGES = [
	['first', 'Bước đầu tiên'], ['streak7', 'Chuỗi 7 ngày'], ['streak30', 'Chuỗi 30 ngày'], ['streak100', 'Chuỗi 100 ngày'],
	['words100', '100 từ'], ['words300', '300 từ'], ['write50', 'Viết chữ đẹp'], ['hsk1', 'Đỗ HSK 1'], ['hsk2', 'Đỗ HSK 2']
] as const;
export type BadgeId = (typeof BADGES)[number][0];
export function award(s: State, a: Attempt | WordSaved, now: Date) {
	const step = 'step' in a ? a.step : undefined;
	const exam = step?.kind === 'mock' && step.mode === 'exam' && (a as Attempt).correct === true ? `hsk${step.level}` : '';
	const n = Object.keys(s.lexicon).length, first = s.curriculum.lessons[0];
	const holds: Record<BadgeId, boolean> = {
		first: !!first && s.lessons[first.id].passed, streak7: s.streak.count >= 7, streak30: s.streak.count >= 30,
		streak100: s.streak.count >= 100, words100: n >= 100, words300: n >= 300, write50: s.written >= 50,
		hsk1: exam === 'hsk1', hsk2: exam === 'hsk2'
	};
	const events: StudyEvent[] = []; const badges = { ...s.badges };
	for (const [badge, title] of BADGES) if (holds[badge] && !badges[badge]) { badges[badge] = now.toISOString(); events.push({ type: 'BadgeEarned', badge, title }); }
	return { state: { ...s, badges }, events };
}
```
Every SPEC row ran on a scratch port (~/.capy/work/m3-scratch/w2-chy22.mjs). Report any difference to the lead.

## Rollback
`git revert`; no migration, no data.
