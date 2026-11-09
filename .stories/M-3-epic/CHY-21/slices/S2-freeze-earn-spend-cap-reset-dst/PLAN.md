# CHY-21 S2 — plan
ACs: AC4, AC5, AC6, AC7, AC9  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-21  ·  Lane L1 (WAVE-PLAN)

## Depends on (execution order)
- CHY-21 S1 merged: `streak.ts` (`countDay`, stub `rollover`), `dates.ts`, `fixtures/streak.ts`.

## Anchors (verified 2026-11-09 on main 90fbe31)
- `prototype/streak.js:9,16` — `MAX_FREEZE = 2`; earn on `n % 7 === 0` (WAVE-PLAN Q4 A).
- `CONTEXT.md:72` — "Streak Freeze": cap 2, auto-spent, frozen day keeps without adding, reset to 0.
- `docs/architecture.md:55` — Study test surface: "a missed day with and without a Freeze, DST change".

## Task 1 [AC4] [AC5] Closing dates and `rollover`
File: `src/lib/study/streak.ts`
- Change: `addDays(day, n)` on date parts; `closeDays(s, until)` per SPEC; `rollover` = `closeDays(s, day)`; `countDay` guards on `day > (through ?? last)` (S1's draft compares with `last`) and calls `closeDays(s, addDays(D, -1))` first.
- Test first: `src/lib/study/freeze.test.ts` Background, "missed day with a Freeze", "missed day without a Freeze", "a fold closes gaps".
- Verify: `pnpm vitest run src/lib/study -t "missed day"` → pass. Negative control: let `rollover` start from `last` instead of `through` → the second call returns `[StreakReset 2026-11-11]` instead of []; revert.

## Task 2 [AC6] [AC7] Earning
File: `src/lib/study/streak.ts`
- Change: after the increment, `count % 7 === 0 && freezes < 2` → earn.
- Tests: "seventh day earns a Freeze", "cap is 2" (SPEC rows).
- Verify: `pnpm vitest run src/lib/study -t "Freeze"` → pass, plus the cap negative control.

## Task 3 [AC9] DST
File: `src/lib/study/freeze.test.ts`
- Test: fall and spring sequences (SPEC). No new code if Tasks 1-2 step by date parts.
- Verify: `pnpm vitest run src/lib/study -t "DST"` → pass; the fixed-offset negative control fails it; revert.

## Task 4 [CHORE] Gates
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0; S1, CHY-20 and CHY-19 tests green.

## Mutation paths covered
- Close: counted date (no-op), missed with Freeze, missed without (count > 0 reset, count = 0 nothing), already closed (no-op). Count: first ever, next day, after a gap (closes gap first), at a multiple of 7 below and at the cap.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
const addDays = (day: string, n: number) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
function closeDays(s: State, until: string, ev: StudyEvent[]): State['streak'] {
	let k = s.streak; if (!k.last) return k;
	for (let d = addDays(k.through ?? k.last, 1); d <= until; d = addDays(d, 1)) {
		if (k.freezes > 0) { k = { ...k, freezes: k.freezes - 1 }; ev.push({ type: 'FreezeSpent', day: d, freezes: k.freezes }); }
		else if (k.count > 0) { k = { ...k, count: 0 }; ev.push({ type: 'StreakReset', day: d }); }
		k = { ...k, through: d };
	}
	return k;
}
```
Every row of SPEC's table ran on a scratch port of this logic (~/.capy/work/m3-scratch/w2-chy21.mjs, w2-gap.mjs). Report any difference to the lead.

## Rollback
`git revert`; no migration, no data.
