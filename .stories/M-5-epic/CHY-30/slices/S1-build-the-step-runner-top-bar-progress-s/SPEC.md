# CHY-30 S1 — spec
ACs: AC1, AC2, AC3  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC1] A runner given 6 steps renders, in a sticky top bar: a ✕ link with accessible name "Lưu và về bài học" pointing at the caller's `exit` href, 6 progress segments, and a counter. At step index 1 the counter reads "2/6" and 1 segment is on; at index 0 it reads "1/6" and 0 are on (`prototype/step.js:26-33`).
- [AC1] The CTA renders in the sticky action bar of `FocusFrame` (`src/lib/ui/FocusFrame.svelte:89-95`). Its label, disabled state, caret and hint come from the current step view; before the view sets one, the CTA is disabled.
- [AC2] Feedback mode, choice step with answer "好": the CTA reads "Kiểm tra", is disabled, hint "Chọn một đáp án". A pick enables it and clears the hint.
- [AC2] Pressing "Kiểm tra" with pick "好": the "好" option is marked right (check badge), the line reads "Đúng rồi." followed by the answer, the CTA reads "Tiếp" with no hint. Options no longer accept a pick.
- [AC2] Pressing "Kiểm tra" with a wrong pick "你": "好" is marked right, "你" marked wrong, the line reads "Chưa đúng. Đáp án là 好", the CTA reads "Tiếp" with hint "Câu này sẽ quay lại ở phần ôn" (the step's `missHint` wins when set).
- [AC2] Pressing "Tiếp" reports one `Answer` `{ questionId, pick, correct, ms, card? }` (`card` = the step's `card` when set) and opens the next step (index + 1).
- [AC3] Test mode: the CTA reads "Câu tiếp" (caret on), disabled until a pick. Pressing it shows no right/wrong mark and no line, reports the `Answer`, and opens the next step.
- [AC3] Test mode, last step (index = total − 1): the CTA reads "Nộp bài".
- [AC3] Placement: the question at level 5 index 9 shows "Nộp bài"; every other question keeps "Câu tiếp". No other Placement behaviour changes.
- [AC2] [AC3] After the last step reports, the runner calls `onfinish()` once.
- [NFR] A new step kind is one new file `src/lib/lesson/steps/<Kind>.svelte` + one line in the `LessonStep` union. The runner finds the view by file name (`Choice.svelte` ↔ `kind: 'choice'`); no registry file changes.

## Not this slice
- AC4 (Ledger.record per answer, Attempt build, `lesson`/`section` use) → S2. AC5 (resume at step N) → S2.
- AC6 (done step, DayCounted popup) → S3. Until S3, `onfinish` is the caller's exit.
- Keyboard shortcuts (digits / Enter), audio prompt (TalkingCast clip) in a choice step: no AC here; parked.
- Gate route, Gate exit confirm, scoring → CHY-36. Section routes → CHY-32/33/34.

## Seam
`src/lib/lesson/` — produced here, consumed by CHY-30.S2, CHY-32.S1, CHY-33.S1, CHY-34.S2, CHY-39.S1, CHY-36.S1.

```ts
// src/lib/lesson/types.ts
import type { Skill } from '#lib/study/index.js';
export type Mode = 'feedback' | 'test';
export type Answer = {
	questionId: string;
	pick: string | null;
	correct: boolean | null;
	ms: number;
	card?: { word: string; skill: Skill };   // from '#lib/study'; S2 passes it to apply() (apply.ts:28)
};
export type Cta = { label: string; disabled?: boolean; caret?: boolean; hint?: string; onclick: () => void };
export type StepProps<S> = {
	step: S;
	mode: Mode;
	last: boolean;                      // index === steps.length - 1
	cta: (c: Cta) => void;              // view sets the sticky CTA
	next: (answer?: Answer) => void;    // view is finished; answer present for a question step
};

// src/lib/lesson/steps.ts — one line per kind
export type LessonStep =
	| import('./steps/Choice.svelte').Step;

// src/lib/lesson/steps/Choice.svelte  <script module>
export const kind = 'choice';
export type Step = {
	kind: 'choice';
	id: string;              // questionId
	ask: string;             // eyebrow, e.g. "Chọn nghĩa"
	title: string;
	options: string[];
	answer: string;
	script?: 'hanzi' | 'text';  // option font; default 'hanzi'
	explain?: string;        // text after the verdict; default = answer
	missHint?: string;       // default "Câu này sẽ quay lại ở phần ôn"
	card?: { word: string; skill: Skill };  // copied into Answer.card
};

// src/lib/lesson/StepRunner.svelte
type Props = {
	steps: LessonStep[];      // ≥ 1
	mode?: Mode;              // default 'feedback'
	exit: string;             // resolved href for ✕
	lesson: string;           // S2: Attempt.step.lesson
	section: string;          // S2: Attempt.step.section ('gate' for the Gate)
	contentSha: string;       // S2: Attempt.contentSha (study/types.ts:20)
	onfinish: () => void;     // after the last step reports
};
```
S1 reads neither `lesson`, `section` nor `contentSha`; they are in the contract so wave-2 callers pass them from day one. Additive later, no caller change: S2 records each `Answer` and resumes from `State.runs`; S3 renders the done step before calling `onfinish`.

## Test contract
- [AC1] `progress.test.ts`: `progress(1, 6)` → `{ on: 1, label: '2/6' }`; `progress(0, 6)` → `{ on: 0, label: '1/6' }`; `progress(5, 6)` → `{ on: 5, label: '6/6' }`.
- [AC1] `StepRunner.test.ts` (svelte/server): 6 steps → markup has `aria-label="Lưu và về bài học"` with the `exit` href, 6 segment elements, 0 marked on, text "1/6", a disabled CTA button.
- [AC2] `choice.test.ts`: `choiceCta` for (feedback, picking, no pick) → "Kiểm tra", disabled, hint "Chọn một đáp án"; with pick → enabled, no hint.
- [AC2] `choice.test.ts`: `grade(step{answer:'好'}, '好')` → correct, marks `{好:'right'}`, line "Đúng rồi."; `grade(…, '你')` → wrong, marks `{好:'right', 你:'wrong'}`, line "Chưa đúng. Đáp án là", hint default; custom `missHint` wins.
- [AC2] `choice.test.ts`: `choiceCta` for (feedback, graded) → "Tiếp", enabled.
- [AC2] `choice.test.ts`: `toAnswer(step{id:'q1',answer:'好',card:{word:'好',skill:'the'}}, '你', 1200)` → `{questionId:'q1', pick:'你', correct:false, ms:1200, card:{word:'好',skill:'the'}}`; no `card` key when the step has none.
- [AC3] `choice.test.ts`: `choiceCta` for (test, last=false) → "Câu tiếp", caret on; (test, last=true) → "Nộp bài"; `grade` is not used in test mode (no marks).
- [AC3] `run.test.ts`: `isLast` true only at level 5 index 9.
- [NFR] `steps.test.ts`: every `steps/*.svelte` module exports `kind` equal to its lower-cased file name.
- [AC1] [AC2] [AC3] Verify stage: agent-browser on `/dev/step` (6 choice steps, `?mode=test`) clicks through both modes and Placement level 5 q10.

## Open assumptions
- None. Placement "last" = level 5 index 9 only (DISCUSSION "Answered here").
