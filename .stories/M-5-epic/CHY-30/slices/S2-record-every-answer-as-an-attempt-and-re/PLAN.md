# CHY-30 S2 — plan
ACs: AC4, AC5  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: stonghuuloc/CHY-30-S2 (off CHY-40-S1 stack tip)
Base: .@a65f4297

## Anchors (verified 2026-11-16 on a65f4297)
- `src/lib/ledger/types.ts:11` — `record(input: Input): Promise<void>;`
- `src/lib/ledger/ledger.ts:29-33` — `state()` folds sorted rows with `apply(s, i, new Date(i.at)).state`
- `src/lib/ledger/ledger.ts:35-39` — `changed()` drops cache, refolds, notifies listeners
- `src/lib/ledger/ledger.ts:84-94` — `record()`: `serial(...)`, `if (rows.has(k)) return;`, `put`, `rows.set`, `changed()`
- `src/lib/ledger/ledger.ts:23-27` — `serial<T>(f: () => Promise<T>)` returns `Promise<T>` (typed result passes through)
- `src/lib/ledger/idb.ts:3` — `key(i)` = `s:<word>` | `a:<id>`
- `src/lib/study/apply.ts:77-85` — `apply()` → `{ state, events }`
- `src/lib/study/types.ts:9-26,43,46-55` — `Step`, `Attempt`, `State.runs`, `StudyEvent`
- `src/lib/study/progress.ts:20-43` — run match + close at `of`
- `src/lib/lesson/StepRunner.svelte:9-19` — Props + destructure (eslint-disable :18 to remove)
- `src/lib/lesson/StepRunner.svelte:21,27-34` — `index = $state(0)`, `next()`
- `src/lib/lesson/types.ts:5-11,21-27` — `Answer`, `StepProps`
- `src/lib/lesson/index.ts:1-3` — barrel
- `src/lib/lesson/StepRunner.svelte.test.ts:30-52` — `mountRunner` (no ledger today)
- `src/lib/lesson/StepRunner.test.ts:14-26` — server render props (no ledger today)
- `src/lib/lesson/steps.test.ts:5` — `import.meta.glob('./steps/*.svelte')` pattern
- `src/lib/ledger/ledger.test.ts:1-16` — `openLedger` + `fake-indexeddb` + `memoryStore` pattern
- `src/lib/curriculum/index.ts:6` — `CURRICULUM`; `curriculum.json:13-18` — `h1-01` sections
- `src/routes/dev/step/+page.svelte:1-36` — proof route, renders `StepRunner` without a ledger
- `src/lib/placement/run.ts:31-43` — Attempt build pattern (id, at, step)
- Callers of `record` that ignore its value: `src/lib/placement/handoff.ts:23`, `src/routes/dev/ledger/+page.svelte:63` — no change.

## Task 1 [AC4] [LOCK] `Ledger.record` resolves to the input's StudyEvent[]
Files: `src/lib/ledger/types.ts:11`, `src/lib/ledger/ledger.ts:29-39,84-94`
- Change: type → `record(input: Input): Promise<StudyEvent[]>` (import `StudyEvent` from `#lib/study/index.js`).
- `ledger.ts`: replace the `state()` reduce with `fold(capture?: string)` returning `{ state, events }`; `events` = the `apply()` events of the row whose key equals `capture`. `state()` = `cache ??= fold().state`.
- `record`: duplicate → `return []`; else put, `rows.set`, `const r = fold(k)`, `cache = r.state`, notify listeners, `return r.events`.
- Test first: `src/lib/ledger/ledger.test.ts` — `Given_LastAttemptOfSection_When_Record_Then_ResolvesSectionDoneAndDayCounted` (curriculum `CURRICULUM`, 6 attempts `step:{kind:'section',lesson:'h1-01',section:'words',run:'r1',of:6}`; 6th resolves ⊇ `SectionDone{h1-01,words}`, `DayCounted{streak:1}`; first 5 resolve `[]`), `Given_StoredInput_When_RecordAgain_Then_Empty`, `Given_WordSaved_When_Record_Then_Empty`, `Given_EarlierAt_When_Record_Then_EventsOfItsPlace` (record a day-2 card attempt on `你`, then a day-1 card attempt on `好` → the day-1 record resolves ⊇ `CardScheduled{word:'好'}` and no `你` event).
- Verify: `pnpm vitest --run src/lib/ledger`

## Task 2 [AC4] Build the Attempt from an Answer
File: new `src/lib/lesson/attempt.ts` (pattern `src/lib/placement/run.ts:31-43`)
- `toAttempt(answer: Answer | undefined, stepId: string, ctx: { lesson; section; contentSha; run; of }, ids: { id; at }): Attempt`
- `questionId` is always `stepId` (resume matches step ids against `answers`). No answer → `correct: null, ms: 0`. `pick === null` → no `answer` key. No `card` → no `card` key.
- `section === 'gate'` → `step: { kind:'gate', lesson, run, of }`, else `{ kind:'section', lesson, section, run, of }`.
- Test first: `src/lib/lesson/attempt.test.ts` — `Given_ChoiceAnswer_When_ToAttempt_Then_SectionStepAndCard`, `Given_GateSection_When_ToAttempt_Then_GateStep`, `Given_NoAnswer_When_ToAttempt_Then_NullCorrectOnStepId`, `Given_AnswerWithOtherQuestionId_When_ToAttempt_Then_StepId`.
- Verify: `pnpm vitest --run src/lib/lesson/attempt.test.ts`

## Task 3 [AC5] Find the open run and the resume index
File: new `src/lib/lesson/resume.ts`
- `resume(state: State, o: { lesson: string; section: string; ids: string[] }): { run: string | null; index: number }`
- Match: `!closed`, `step.of === ids.length`, gate → `step.kind === 'gate' && step.lesson === lesson`; else `step.kind === 'section' && step.lesson === lesson && step.section === section`. Several → most answers. Index = first `i` with `!Object.hasOwn(answers, ids[i])`; none → 0. No match → `{ run: null, index: 0 }`.
- Test first: `src/lib/lesson/resume.test.ts` — `Given_ThreeOfSixAnswered_When_Resume_Then_RunAndIndexThree`, `Given_ClosedRun_When_Resume_Then_Fresh`, `Given_OfDiffers_When_Resume_Then_Fresh`, `Given_OtherSection_When_Resume_Then_Fresh`, `Given_TwoOpenRuns_When_Resume_Then_MoreAnswersWins`, `Given_GateRun_When_Resume_Then_MatchesByLesson`. Build `State.runs` literals by hand (`types.ts:43`).
- Verify: `pnpm vitest --run src/lib/lesson/resume.test.ts`

## Task 4 [AC4] [AC5] Runner records each step and starts at the resume index
File: `src/lib/lesson/StepRunner.svelte:9-34`
- Edit only the `<script>` block. Leave the top bar (:38-63), the CTA snippet (:75-84) and `types.ts` `Cta` alone (CHY-39.S1 / CHY-34.S2 edit them, Loc 2026-11-16).
- Props: add `ledger: Ledger` (type from `#lib/ledger/index.js`); destructure `lesson, section, contentSha, ledger`; delete the eslint-disable at :18.
- Init (untracked, once): `const start = resume(ledger.state(), { lesson, section, ids: steps.map((s) => s.id) })`; `run = start.run ?? crypto.randomUUID()`; `index = $state(start.index)`.
- `next(answer?)`: `busy` / `done` guard → `await ledger.record(toAttempt(...))` → on reject stay (return) → `current = null`, advance or `onfinish()`. Events are ignored until S3.
- Barrel: `src/lib/lesson/index.ts:1-3` unchanged (no new public export needed; `resume`/`toAttempt` are internal).
- Test first: `src/lib/lesson/StepRunner.svelte.test.ts` — rework `mountRunner(:30-52)` to take a Ledger (real `openLedger` + `new IDBFactory()` + `memoryStore()`, `initialState({ curriculum: CURRICULUM })`) and `await` a flush after each CTA click (`await vi.waitFor`). New tests:
  - `Given_TwoSteps_When_BothAnswered_Then_OneClosedRunWithTwoAnswers` [AC4]
  - `Given_RecordInFlight_When_ContinueTwice_Then_OneAttempt` [AC4] (Ledger wrapper whose `record` waits on a deferred promise)
  - `Given_LastStep_When_ContinueTwice_Then_OneAttemptAndFinishOnce` [AC4]
  - `Given_RecordRejectsOnce_When_Continue_Then_StaysThenAdvancesOnRetry` [AC4]
  - `Given_ThreeOfSixAnswered_When_Remount_Then_Counter4of6` [AC5] (6 steps; unmount; mount on same Ledger)
  - `Given_Resumed_When_LastThreeAnswered_Then_RunClosedWithSix` [AC5] (resume's run match agrees with `progress.ts:20-33`)
  - existing 4 tests keep their assertions, now async.
- `src/lib/lesson/StepRunner.test.ts:14-26` (svelte/server): pass a stub `ledger` (`{ state: () => initialState(), record: async () => [] } as unknown as Ledger`); assertions unchanged.
- Verify: `pnpm vitest --run src/lib/lesson`

## Task 5 [AC4] Views hold no rule
File: `src/lib/lesson/steps.test.ts:5`
- Add `import.meta.glob('./steps/*.svelte', { query: '?raw', import: 'default', eager: true })`; assert no source contains `#lib/ledger`, and every `#lib/study` import line starts with `import type`.
- Test: `Given_EveryStepView_When_ReadSource_Then_NoLedgerAndTypeOnlyStudy`
- Verify: `pnpm vitest --run src/lib/lesson/steps.test.ts`

## Task 6 [AC4] [AC5] Proof route opens a dev Ledger
File: `src/routes/dev/step/+page.svelte:1-36` (outside lane list; S1's own route — DISCUSSION)
- `onMount`: `openLedger({ initial: initialState({ curriculum: CURRICULUM }), store: memoryStore(), db: 'chaiyo-dev-step' })` → `ledger = $state<Ledger>()`; render `StepRunner` only once `ledger` is set; pass `{ledger}`. Keep `lesson="h1-01"`, `section="words"` in both modes (a fresh h1-01 Gate run is ignored by `progress.ts:15-19`, so it can't show resume).
- Add a "reset" link that deletes the `chaiyo-dev-step` database (`indexedDB.deleteDatabase`) and reloads, for repeat verify runs.
- Verify: verify stage, agent-browser on `/dev/step` (port 5411, feedback mode): answer 3, reload → "4/6"; answer to the end → "finished"; reload → "1/6".

## Mutation paths covered
- create: first `next()` of a visit → new run id. resume: run id reused, index from `answers`.
- duplicate: same Attempt key re-recorded (retry after a lost response) → Ledger returns `[]`, no second row (`ledger.ts:87`).
- reject: `record` throws → no index change; retry builds a new Attempt id (old one was never stored).
- out-of-order: a pulled earlier input → `fold(k)` gives the events of its own place (Task 1 test).
- non-question step: `next()` without answer → `correct: null` Attempt (Task 2).
- Not a write path here: `sync()` / `run()` (`ledger.ts:46-75`) unchanged.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// ledger.ts
const sorted = () => [...rows.values()].map((r) => r.input).sort(order);
const fold = (capture?: string) => {
	let events: StudyEvent[] = [];
	const state = sorted().reduce((s, i) => {
		const r = apply(s, i, new Date(i.at));
		if (capture !== undefined && key(i) === capture) events = r.events;
		return r.state;
	}, o.initial);
	return { state, events };
};
const state = () => (cache ??= fold().state);
const notify = (s: State) => { for (const fn of listeners) fn(s); };
// changed(): cache = undefined; notify(state());
record(input) {
	return serial(async () => {
		const k = key(input);
		if (rows.has(k)) return [];
		const row = { key: k, input, synced: false };
		await put(db, [row]);
		rows.set(k, row);
		if (running) again = true;
		const r = fold(k);
		cache = r.state;
		notify(r.state);
		return r.events;
	});
}
```
```svelte
<!-- StepRunner.svelte (script) -->
const start = untrack(() => resume(ledger.state(), { lesson, section, ids: steps.map((s) => s.id) }));
const run = start.run ?? crypto.randomUUID();
let index = $state(start.index);
let busy = false;
let done = false;
async function next(answer?: Answer) {
	if (busy || done) return;
	busy = true;
	const step = steps[index];
	try {
		await ledger.record(
			toAttempt(answer, step.id, { lesson, section, contentSha, run, of: steps.length },
				{ id: crypto.randomUUID(), at: new Date().toISOString() })
		);
	} catch {
		return;
	} finally {
		busy = false;
	}
	current = null;
	if (index < steps.length - 1) index += 1;
	else {
		done = true;
		onfinish();
	}
}
```
- Svelte may warn `state_referenced_locally` on props read at init; `untrack` is the intended read-once. If `svelte-check` still warns, report it, don't silence globally.
- If a fixture contradicts itself (e.g. a test expects `DayCounted` on a second same-day section), stop and report; don't bend the code to pass.

## Rollback
`git revert` of this slice's commits; no migration, no stored-shape change (Attempts already carry `step`).
