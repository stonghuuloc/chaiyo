# CHY-28 S2 — plan
ACs: AC1, AC3  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-28  ·  Lane L3 Placement

## Depends on (execution order)
- CHY-28 S1 merged (`#lib/placement`); CHY-26 S1 merged (`(onboard)` group, sign-in).

## Anchors (verified 2026-11-11 on main 18af4bb; S1 files per their SPECs)
- `prototype/o2-placement.html:14-21` card + "Không biết" styles, `:23-41` top bar + exit sheet, `:53-63` `show()`; `prototype/step.js:58-88` `choice()` with `feedback: false` (CTA "Câu tiếp", disabled until a pick).
- `src/lib/ui/Sheet.svelte:8` props; `src/lib/ui/Button.svelte:4-13`.
- `src/lib/audio/index.ts:1` `play`, `player`; `src/lib/audio/player.ts` — read before wiring (how a key maps to a URL).
- `src/routes/(app)/+layout.ts:1-8` — guard shape the `(onboard)` layout copies (CHY-26 S1).

## Task 1 [AC1] shuffle
Files: `src/lib/placement/shuffle.ts`, `src/lib/placement/shuffle.test.ts` (new)
- Verify: `pnpm vitest run src/lib/placement/shuffle` → pass.

## Task 2 [AC1] screen
Files: `src/routes/(onboard)/placement/+page.svelte` (new), `src/routes/(onboard)/placement/result/+page.svelte` (stub, new), `messages/vi.json`
- Change: SPEC items; `run = $state(startRun(uuid))`, `item = $derived(items(run.level)[run.index])`, `shown = performance.now()` on each item.
- Verify: tester's local AC1 rows.

## Task 3 [AC3] exit sheet
File: `src/routes/(onboard)/placement/+page.svelte`
- Verify: tester's local AC3 row.

## Task 4 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Mutation paths covered
- Pick then next, "Không biết", read and listen items, level change with no message, run end, exit cancel, exit confirm, scrim, Escape.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/placement/shuffle.ts
export function shuffle<T>(xs: readonly T[], random: () => number): T[] {
	const out = [...xs];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
}
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; no data written.
