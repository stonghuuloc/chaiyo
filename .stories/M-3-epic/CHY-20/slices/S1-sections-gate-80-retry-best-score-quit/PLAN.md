# CHY-20 S1 — plan
ACs: AC1, AC2, AC3, AC4, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-20  ·  Lane L1 (WAVE-PLAN)

## Depends on (execution order)
- CHY-19 S1 + S2 merged: `src/lib/study/{types,apply,session,fsrs,index}.ts`, `fixtures/bai1.ts`, the `no-restricted-imports` block in eslint.config.js. None of these exist on main 90fbe31, so no line anchors into them; read them on the branch base before Task 1.
- Not on CHY-24: the `step` column only matters when the Ledger syncs (CHY-24 S2). Study's TS field can land first.

## Anchors (verified 2026-11-09 on main 90fbe31)
- `docs/content-schema.md:135-144` — Lesson `sections` keys and `gate: { pool, draw }`; `:297-304` — Primer sections and `testOut: true`.
- `content/lessons/hsk1/h1-01.yaml:36` — Bài 1 word ids (fixture order); `:106-107` — `gate.draw: 10`.
- `content/lessons/hsk1/h0-00.yaml:12-13,585-586` — Primer sections, `gate.draw: 10`.
- `docs/architecture.md:30` — Study row (Task 4 edits it; CHY-19 S2 already reworded it).
- `.stories/M-3-epic/WAVE-PLAN.md` C-M3-1 table — the `step` row this slice implements on the TS side.
- `node_modules/@sveltejs/kit/src/messages/build-errors.js:521` — `$lib` removed; import `#lib/study/index.js`.

## Task 1 [AC1] Curriculum, Step, runs, sections
Files: `src/lib/study/types.ts`, `src/lib/study/progress.ts` (new), `src/lib/study/apply.ts`, `src/lib/study/index.ts`
- Change: types from SPEC; `initialState(o)` builds `lessons` from `o.curriculum`; `apply` runs the CHY-19 card part, then `progress(state, input)` when `input.step` is set, and concatenates events. `progress` copies only the touched lesson and run.
- Test first: `src/lib/study/fixtures/curriculum.ts`, `src/lib/study/fixtures/runs.ts` (SPEC Fixtures), `src/lib/study/progress.test.ts` "last question emits SectionDone" and "Gate stays locked" (the gate half goes green in Task 2).
- Verify: `pnpm vitest run src/lib/study -t "SectionDone"` → pass. Negative control: close the run at `of − 1` answers → the 9-answer assertion fails; revert.

## Task 2 [AC2] [AC3] [AC4] [AC5] Gate
File: `src/lib/study/progress.ts`
- Change: open check (`testOut` or every section done); on close emit SectionDone `gate`, compute `score`, `best = max`, pass with integers; first pass sets `passed` and unlocks the next lesson in curriculum order.
- Tests: "pass line is 80 %", "fail, retry, pass unlocks once", "best score is kept", "quitting saves no score", and the gate half of "Gate stays locked" (SPEC lines).
- Verify: `pnpm vitest run src/lib/study/progress.test.ts` → pass. Negative controls: change `>=` to `>` in the pass rule → the 8/10 row fails; revert; drop the `!L.passed` guard → the r3 assertion sees a second LessonUnlocked; revert.

## Task 3 [LOCK] Promotion on Từ mới
File: `src/lib/study/progress.ts`
- Change: on a closed `words` run, set `saved: false` on Lexicon entries of the lesson's `words` that have `saved: true`.
- Test: "a saved word is promoted when its lesson teaches it" (SPEC [LOCK] line).
- Verify: `pnpm vitest run src/lib/study -t "promoted"` → pass.

## Task 4 [CHORE] Docs and gates
File: `docs/architecture.md:30`
- Change: Study interface cell: `initialState({ curriculum })`; `Attempt.step` (section, gate run) next to the `WordSaved` input. Touch no other row.
- Verify on the final tree: `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0; `pnpm vitest run src/lib/study` lists CHY-19's tests passing unchanged; coverage thresholds (vite.config.ts:48) hold.

## Mutation paths covered
- Run: open (first answer), repeat question (no-op), close (SectionDone), late Attempt after close (no-op). Gate: locked (ignored), open by sections, open by `testOut`, fail, first pass (unlock), later pass (no unlock), weaker retry (best kept), quit (no score). Lexicon: saved → taught. No delete path.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/study/progress.ts
export function progress(s: State, a: Attempt): { state: State; events: StudyEvent[] } {
	const st = a.step!; const ev: StudyEvent[] = [];
	const meta = s.curriculum.lessons.find((l) => l.id === st.lesson);
	if (!meta) return { state: s, events: ev };
	const L = s.lessons[st.lesson];
	if (st.kind === 'gate' && !(meta.testOut || meta.sections.every((x) => L.done.includes(x)))) return { state: s, events: ev };
	const run = s.runs[st.run] ?? { answers: {} };
	if (run.closed || a.questionId in run.answers) return { state: s, events: ev };
	const answers = { ...run.answers, [a.questionId]: a.correct === true };
	const closed = Object.keys(answers).length >= st.of;
	let lessons = s.lessons, lexicon = s.lexicon;
	if (closed && st.kind === 'section') {
		lessons = { ...lessons, [st.lesson]: { ...L, done: L.done.includes(st.section) ? L.done : [...L.done, st.section] } };
		ev.push({ type: 'SectionDone', lesson: st.lesson, section: st.section });
		if (st.section === 'words') lexicon = promote(lexicon, meta.words);
	}
	if (closed && st.kind === 'gate') {
		const c = Object.values(answers).filter(Boolean).length, score = Math.floor((c * 100) / st.of);
		ev.push({ type: 'SectionDone', lesson: st.lesson, section: 'gate' });
		lessons = { ...lessons, [st.lesson]: { ...L, best: Math.max(L.best ?? 0, score) } };
		if (c * 100 >= 80 * st.of) {
			ev.push({ type: 'GatePassed', lesson: st.lesson, score });
			const next = s.curriculum.lessons[s.curriculum.lessons.indexOf(meta) + 1];
			if (!L.passed) {
				lessons[st.lesson] = { ...lessons[st.lesson], passed: true };
				if (next && !lessons[next.id].unlocked) { lessons[next.id] = { ...lessons[next.id], unlocked: true }; ev.push({ type: 'LessonUnlocked', lesson: next.id }); }
			}
		}
	}
	const runs = { ...s.runs, [st.run]: closed ? { answers, closed: true as const } : { answers } };
	return { state: { ...s, lessons, lexicon, runs }, events: ev };
}
```
Every event list in SPEC ran on a scratch port of this logic (~/.capy/work/m3-scratch/w2-chy20.mjs). If a value does not come out, report it to the lead; do not edit the expected value.

## Rollback
`git revert` of the slice commits; no migration, no data.
