# CHY-20 S2 — plan
ACs: AC6, AC7, AC8  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-20  ·  Lane L1 (WAVE-PLAN)

## Depends on (execution order)
- CHY-20 S1 merged (`progress.ts`, runs, `Curriculum`, fixtures `curriculum.ts` / `runs.ts`). CHY-19 S2's `session.ts` (the lane this slice caps).

## Anchors (verified 2026-11-09 on main 90fbe31)
- `prototype/data/placement.js:1-5` — 10 questions per level, `PASS = 8`.
- `prototype/data/lexicon.js:56-57` — only thẻ từ takes new cards (`dueIn`).
- `content/lessons/hsk1/h1-01.yaml:36` — Bài 1 word order (first 10 new cards).
- `.stories/M-3-epic/CHY-19/slices/S2-session-builder-estimate-saved-words/SPEC.md:7` — the `the` lane rule this slice replaces.
- `.stories/M-3-epic/CHY-19/slices/S1-apply-schedules-one-fsrs-card-per-word-p/PLAN.md:20` — `Card = { due, fsrs }` (gains `first`).

## Task 1 [AC6] Placement blocks
Files: `src/lib/study/types.ts`, `src/lib/study/progress.ts`
- Change: `Step` placement member; `placed` in `initialState`; on a closed passing block with `level === placed + 1`: mark lessons, append words, promote saved ones, unlock the first lesson of the next level.
- Test first: `src/lib/study/placement.test.ts` "placement into HSK 2 passes HSK 1", "placement promotes a saved word, keeps a taught one" + the SPEC [AC6] negative controls; `placementBlock` in `fixtures/runs.ts`.
- Verify: `pnpm vitest run src/lib/study -t "placement"` → pass. Negative control: drop the `level === placed + 1` check → the "level-2 block first" control fails; revert.

## Task 2 [AC7] `first` and the new-card cap
Files: `src/lib/study/apply.ts` (card part keeps `first`), `src/lib/study/types.ts`, `src/lib/study/session.ts`
- Change: `Card.first` set on create, copied on review. In `session`, `k` = count of `the` cards whose `first` local date equals today's; new = words without a `the` card, first `max(0, 20 - k)`.
- Tests: "20 new cards a day" (14-day loop), "lesson cards share the cap", and CHY-19's `session.test.ts` unchanged.
- Verify: `pnpm vitest run src/lib/study` → pass. Negative control: remove the `slice` → day 1 has 250 new; revert.

## Task 3 [AC8] No demotion
File: `src/lib/study/placement.test.ts`
- Test: "never sent back down" (SPEC [AC8]). No code: S1 and Task 1 never clear `passed` or lower `placed`.
- Verify: `pnpm vitest run src/lib/study -t "back down"` → pass. Negative control: make a failed block set `placed = level - 1` → the test fails; revert.

## Task 4 [CHORE] Gates
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0; `git diff --stat main` lists only `src/lib/study/**`.

## Mutation paths covered
- Placement: pass in order (lessons, words, unlock), fail (no-op), out of order (no-op), weak repeat (no-op). Lexicon: absent word appended, saved word promoted, taught word kept. Session: under the cap, at the cap, cap shared with lesson cards, nothing left.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// progress.ts, placement branch (after the run closes)
if (st.kind === 'placement' && c * 100 >= 80 * st.of && st.level === s.placed + 1) {
	const lexicon = { ...s.lexicon }, lessons = { ...s.lessons };
	for (const l of s.curriculum.lessons.filter((l) => l.level <= st.level)) {
		lessons[l.id] = { ...lessons[l.id], passed: true, unlocked: true };
		for (const w of l.words) lexicon[w] = lexicon[w] ? { ...lexicon[w], saved: false } : { saved: false, cards: {} };
	}
	const next = s.curriculum.lessons.find((l) => l.level === st.level + 1);
	if (next && !lessons[next.id].unlocked) { lessons[next.id] = { ...lessons[next.id], unlocked: true }; ev.push({ type: 'LessonUnlocked', lesson: next.id }); }
	return { state: { ...s, placed: st.level, lessons, lexicon, runs }, events: ev };
}
// session.ts, the lane
const k = words.filter((w) => { const c = state.lexicon[w].cards.the; return c && localDate(new Date(c.first), o.tz) === today; }).length;
const fresh = skill === 'the' ? words.filter((w) => !state.lexicon[w].cards.the).slice(0, Math.max(0, 20 - k)) : [];
```
The table in SPEC came out of a scratch port of this code (~/.capy/work/m3-scratch/w2-chy20.mjs, fake FSRS); the new-card counts do not depend on FSRS. Report any difference to the lead.

## Rollback
`git revert` of the slice commits; no migration, no data.
