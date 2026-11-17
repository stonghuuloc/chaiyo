# CHY-30 S2 — spec
ACs: AC4, AC5  ·  Repo: chaiyo  ·  rev 1

## Seam (wave-2 lanes read this first)
```ts
// src/lib/lesson/StepRunner.svelte — S1 props + ONE new required prop
type Props = {
	steps: LessonStep[];     // ≥ 1; step ids unique within the section
	mode?: Mode;             // 'feedback' (default) | 'test'
	exit: string;
	lesson: string;          // Attempt.step.lesson
	section: string;         // Attempt.step.section; 'gate' → Attempt.step.kind 'gate'
	contentSha: string;      // Attempt.contentSha
	ledger: Ledger;          // NEW: the learner's Ledger (await learnerLedger(session))
	onfinish: () => void;
};
// No resume prop: the runner reads ledger.state().runs at mount.
// StepProps (views) unchanged: next(answer?) — no answer = recorded with correct: null.
// Attempt.questionId is always the step's id (Answer.questionId is ignored).

// src/lib/ledger/types.ts
record(input: Input): Promise<StudyEvent[]>;   // was Promise<void>
```

## Behaviour
- [AC4] Each `next(answer)` from a view makes the runner call `ledger.record` exactly once, then open the next step (or call `onfinish` on the last).
- [AC4] The recorded Attempt is `{ id: uuid, at: now ISO, questionId: step.id, contentSha, correct: answer.correct, ms: answer.ms, answer: answer.pick (omitted when null), card: answer.card (omitted when absent), step }`.
- [AC4] `step` = `{ kind:'section', lesson, section, run, of: steps.length }`; for `section === 'gate'` it is `{ kind:'gate', lesson, run, of: steps.length }`. `run` is one id for the whole visit.
- [AC4] `next()` with no answer (a step that asks nothing) records `{ questionId: step.id, correct: null, ms: 0 }` with the same `step`. So every step makes exactly one Attempt.
- [AC4] A second `next()` while the first record is in flight is ignored. Example: two presses on "Tiếp" within one write → 1 Attempt, index +1.
- [AC4] After the last step's record resolves, further `next()` calls do nothing: two presses on the last "Tiếp" → 1 Attempt, `onfinish` once.
- [AC4] The runner moves on only after `record` resolves. If `record` rejects, the step stays on screen, no index change; the next press records a new Attempt.
- [AC4] Views never receive the Ledger; `StepProps` has no `ledger`. No step view under `src/lib/lesson/steps/` imports the Ledger or a Study rule; streak, gate, unlock and scheduling stay in `apply()`. The runner only finds an open run to resume (AC5).
- [AC4] [LOCK] `ledger.record(input)` resolves to the `StudyEvent[]` that `apply()` returned for that input when folded in time order. Six-step section, last Attempt of the day's first section → `[SectionDone, DayCounted]` (plus any `BadgeEarned`). A duplicate input (key already stored) resolves to `[]`.
- [AC5] At mount, the runner looks in `ledger.state().runs` for an open run of this section: same kind, same `lesson`, same `section` (gate: same `lesson`), `step.of === steps.length`, not `closed`. Two match → the one with more answers.
- [AC5] Found → the runner keeps that run id and opens the first step whose `id` is not in `answers`. 6 steps, 3 answered → step index 3, counter "4/6", 3 segments on.
- [AC5] Not found (first visit, section finished, content changed so `of` differs) → new run id, step index 0, "1/6".
- [AC5] Leave at step 4 (✕ or reload) and reopen → step 4 with "4/6"; the remaining 3 answers close the run, so `SectionDone` fires once, after the 6th.

## Not this slice
- AC6 (done step, "Chuỗi lên N ngày!" on `DayCounted`) → S3. S2 drops the events at the runner; S3 adds `onEvents`.
- Wiring real section/gate routes to the runner → CHY-32/33/34 (sections), CHY-36 (gate). Gate scoring, exit confirm → CHY-36.
- Placement stays on its own run (`src/lib/placement/run.ts`); no change.
- Syncing to Supabase: unchanged (`syncWhenOnline`).
- `Cta` type, the CTA snippet (CHY-34.S2 adds `Cta.hold`) and the top-bar markup (CHY-39.S1 adds Báo lỗi): untouched by S2 (Loc, 2026-11-16).

## Test contract
- [AC4] `attempt.test.ts`: `toAttempt(answer{q1,'你',false,1200,card}, ctx{lesson:'h1-01',section:'words',contentSha:'sha1',run:'r1',of:6}, ids{id:'a1',at:'2026-11-16T03:00:00.000Z'})` → full Attempt with `step:{kind:'section',lesson:'h1-01',section:'words',run:'r1',of:6}`, `answer:'你'`, `card`.
- [AC4] `attempt.test.ts`: section `'gate'` → `step:{kind:'gate',lesson:'h1-01',run:'r1',of:6}`; no-answer step `s3` → `questionId:'s3', correct:null, ms:0`, no `answer`/`card` keys.
- [AC4] `StepRunner.svelte.test.ts`: real `openLedger` + `fake-indexeddb`; answer 2 of 2 steps → `state().runs` has 1 run with 2 answers, `closed: true`; `lesson`/`section` in `step`.
- [AC4] `StepRunner.svelte.test.ts`: two "Tiếp" clicks before the write resolves → 1 Attempt stored, counter "2/2".
- [AC4] `StepRunner.svelte.test.ts`: two clicks on the last "Tiếp" → 1 Attempt for that step, `onfinish` called once.
- [AC4] `attempt.test.ts`: an Answer with `questionId:'other'` on step `q1` → Attempt `questionId:'q1'`.
- [AC4] `StepRunner.svelte.test.ts`: a Ledger whose `record` rejects once → counter stays "1/2"; next press stores 1 Attempt, counter "2/2".
- [AC4] `steps.test.ts`: no file under `src/lib/lesson/steps/` imports `#lib/ledger` or `#lib/study/index.js` runtime values (rule check on source text).
- [AC4] [LOCK] `ledger.test.ts`: record the 6th Attempt of a 6-step section on a fresh day → resolves to events containing `SectionDone{h1-01,words}` and `DayCounted{streak:1}`; record it again → `[]`; record a `WordSaved` → `[]`.
- [AC4] [LOCK] `ledger.test.ts`: an input whose `at` is earlier than stored rows resolves to the events of its own place in the fold.
- [AC5] `resume.test.ts`: `resume(state, {lesson:'h1-01',section:'words', ids:[q0..q5]})` (`of` = `ids.length`) with run r1 answered q0,q1,q2 → `{ run:'r1', index:3 }`; closed run → new; `of` 5 → new; other section → new; two open runs (2 vs 3 answers) → the 3-answer one.
- [AC5] `StepRunner.svelte.test.ts`: answer 3 of 6, unmount, mount again on the same Ledger → counter "4/6", 3 segments on, step 4's title; answer the last 3 → that run is `closed` with 6 answers (resume picked a run `progress()` accepts).
- [AC4] [AC5] Verify stage: agent-browser on `/dev/step` (feedback mode, section `words`): answer 3, reload → "4/6"; finish → reload starts at "1/6".

## Open assumptions
- None. Non-question steps record `correct: null` (DISCUSSION "Answered here", AC5).
