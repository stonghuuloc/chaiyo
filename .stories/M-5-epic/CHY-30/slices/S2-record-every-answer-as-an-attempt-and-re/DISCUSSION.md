# CHY-30 S2 — discussion
ACs: AC4, AC5  ·  verified on a65f4297 (worktree CHY-30-S2, wave-1 stack tip)

## Current behaviour (verified, with anchors)
- [AC4] The runner drops every answer: `next()` takes no argument and only moves `index` (`src/lib/lesson/StepRunner.svelte:27-34`). The view passes `toAnswer(...)` (`src/lib/lesson/steps/Choice.svelte:46`). **Code fails AC4** → task.
- [AC4] `lesson`, `section`, `contentSha` props exist but are unread (`StepRunner.svelte:9-19`, eslint-disable at :18). The runner has no Ledger to call.
- [AC4] `Ledger.record(input): Promise<void>` (`src/lib/ledger/types.ts:11`). `record` writes the row and refolds `state()`, dropping the events `apply()` returns (`src/lib/ledger/ledger.ts:29-33,84-94`). **Code fails locked Q1** → task.
- [AC4] `apply()` already returns `{ state, events }` per input (`src/lib/study/apply.ts:77-85`). Section/gate rules (`SectionDone`, `GatePassed`, `DayCounted`) run inside `progress()` + `countDay()` (`src/lib/study/progress.ts:3-98`, `apply.ts:65-74`). No rule needs to move.
- [AC4] An `Attempt` needs `id`, `at`, `questionId`, `contentSha`, `correct`, `ms`, optional `answer`, `card`, `step` (`src/lib/study/types.ts:16-26`). The section step is `{ kind:'section', lesson, section, run, of }`; the Gate is `{ kind:'gate', lesson, run, of }` (`types.ts:10-11`).
- [AC4] A section `Step` with `section:'gate'` would mark a section named "gate" done (`progress.ts:69-79`). The Gate must send `kind:'gate'` for scoring (`progress.ts:82-97`).
- [AC5] Study already keeps run state: `State.runs[run] = { step, answers: {questionId: correct}, closed? }` (`types.ts:43`). A run closes when `answers` reaches `step.of` (`progress.ts:36-43`). An answer to a closed run, or a repeated `questionId`, is ignored (`progress.ts:34`).
- [AC5] A run whose first `step` differs in kind, `of`, lesson or section rejects the attempt (`progress.ts:20-33`). So `of` must stay fixed for one run.
- [AC5] The runner always starts at `index = 0` (`StepRunner.svelte:21`). **Code fails AC5** → task.
- Callers get the learner's Ledger from `learnerLedger(session): Promise<Ledger>` (`src/lib/learner/index.ts:10-48`). Section routes are stubs (`src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5`); other lanes wire them.
- `record` callers that ignore the result: `src/lib/placement/handoff.ts:23`, `src/routes/dev/ledger/+page.svelte:63`, ledger tests. A wider return type does not break them.
- Client tests run under jsdom (`vite.config.ts:60-68`); `StepRunner.svelte.test.ts:30-52` mounts the runner without a Ledger.

## Answered here (no human needed)
- [AC4] Q: how does the runner reach the Ledger? A: a required `ledger: Ledger` prop. The caller already holds the learner's Ledger (`learnerLedger`); a prop is testable with `openLedger` + `fake-indexeddb` (`src/lib/ledger/ledger.test.ts:1-16`). Views get no Ledger (`StepProps`, `src/lib/lesson/types.ts:21-27`), so a view cannot hold a rule.
- [AC4] Q: does "resume step" need a caller prop? A: no. The runner reads `ledger.state().runs` at mount. Callers pass only `ledger` on top of the S1 props.
- [AC5] Q: a step that reports no answer (word card, intro) — record it or not? A: record it, `correct: null`, `questionId = step.id`. AC5 says "lands on step 4" for any step mix. If only question steps were recorded, `of` would have to count question steps only, and leaving after an unrecorded card re-opens one step early. `correct: null` is already legal (`types.ts:21`) and skips FSRS (`apply.ts:28`).
- [AC5] Q: `of` = ? A: `steps.length`, so the run closes on the last step's record (`progress.ts:36`).
- [AC5] Q: which open run is "this section"? A: same kind, same lesson, same section (gate: same lesson), `of === steps.length`, not `closed`. Two match (two devices) → the one with more answers.
- [AC5] Q: resume index = ? A: the first step whose `id` is not in that run's `answers`. 3 answered of 6 → index 3 → "4/6", 3 segments on (`src/lib/lesson/progress.ts:1-4`). "Same progress" holds.
- [AC5] Q: content changed between visits (`of` differs)? A: no open run matches → fresh run at step 1. The old run stays open and harmless.
- [AC4] Q: advance before or after the write? A: after `record` resolves. AC5 needs step N stored before step N+1 shows. A rejected write leaves the learner on the step; the next press records again.
- [AC4] Q: "once" with a double press? A: the runner ignores `next()` while a record is in flight. One press → one Attempt.
- [AC4] Q: where do `id` and `at` come from? A: the runner: `crypto.randomUUID()` and `new Date().toISOString()`. Same as placement (`src/lib/placement/run.ts:31-33`).
- [AC5] Q: which id goes in `Attempt.questionId`? A: always the step's id. Resume matches step ids against `answers`; a view-chosen id would never match and the run would never close (story-advisor round 1).
- [AC4] Q: the Gate? A: `section === 'gate'` → `step.kind = 'gate'`. Same resume rule. Gate scoring and exit confirm stay in CHY-36.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| — | Q1 (epic) | `Ledger.record` returns `StudyEvent[]` | A — the events `apply()` returned for that input | Loc, wave plan approval 2026-11-13 |

No open questions for S2.

## Files outside the lane
- `src/routes/dev/step/+page.svelte` (CHY-30.S1's proof route): must pass the new `ledger` prop and opens a dev Ledger in the browser. Needed to prove AC5 by reload.
- `messages/vi.json`: not touched. S2 adds no copy.

## Wave-2 constraints (Loc, 2026-11-16, via coordinator)
- S2 does not touch the `Cta` type or the CTA snippet (CHY-34.S2 owns `Cta.hold`) nor the top-bar markup (CHY-39.S1 mounts Báo lỗi there). S2 edits only the `<script>` of `StepRunner.svelte`.

## Locked (do not re-open)
- Q1: `Ledger.record(input)` resolves to the `StudyEvent[]` `apply()` returned for that input.
