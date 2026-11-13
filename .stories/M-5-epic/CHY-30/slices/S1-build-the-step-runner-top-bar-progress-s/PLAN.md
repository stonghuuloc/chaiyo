# CHY-30 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: stonghuuloc/CHY-30-S1
Base: .@0836423e

## Anchors (re-verified 2026-11-13 on 0836423e)
- `prototype/step.js:26-33` — `bar(lit, total)`: segments on for `i < lit`, label `min(lit+1,total)/total`
- `prototype/step.js:58-88` — `choice(q, done)`: pick :67-72, grade :73-83, CTA :84-87
- `src/lib/ui/FocusFrame.svelte:5-13` — props `step`, `top`, `actions`, `children`; `:17-29` focuses the heading on `step` change
- `src/lib/ui/Button.svelte:4-13` — `variant`, `disabled`, `caret`, `onclick`, `children`
- `src/routes/(onboard)/placement/+page.svelte:93-108 (✕ at :102)` — FocusFrame top snippet (✕ button pattern, `#i-regular-x` sprite)
- `src/routes/(onboard)/placement/+page.svelte:140-157 (aria-pressed :150)` — option buttons (`aria-pressed`, border classes)
- `src/routes/(onboard)/placement/+page.svelte:168-172 (label :170)` — actions snippet, label `m.placement_next()`
- `src/routes/(onboard)/placement/+page.svelte:89-90` — `{@html sprite}` (icons sprite must be on the page)
- `src/lib/placement/run.ts:46-47` — 10 questions per level, level 5 is final
- `src/lib/placement/run.test.ts:10-18` — `play(script)` helper
- `messages/vi.json:11` — `"screen_gate": "Kiểm tra",` (still :11 after #148; insert S1 keys after this line)
- `src/routes/dev/ledger/+page.server.ts:1-10` — dev-only 404 guard to copy
- `src/routes/dev/audio/syllable-cells.server.ts:23` — `import.meta.glob(…, { eager: true })` precedent
- `src/lib/ui/ui.test.ts:3,14-15` — `svelte/server` render + `createRawSnippet` test pattern
- `vite.config.ts:50-58` — single `server` project, node env, `src/**/*.{test,spec}.{js,ts}`

## Task 1 [AC1] Progress model
File: `src/lib/lesson/progress.ts` (new)
- Change: `export const progress = (index: number, total: number) => ({ on: index, label: \`${Math.min(index + 1, total)}/${total}\` })` — port of `step.js:26-33`.
- Test first: `src/lib/lesson/progress.test.ts` — `Given_Index1Of6_When_Progress_Then_OneOnAndLabel2Of6`, index 0 → 0 on "1/6", index 5 → 5 on "6/6".
- Verify: `pnpm vitest --run src/lib/lesson/progress.test.ts`

## Task 2 [AC2] [AC3] Copy keys
File: `messages/vi.json:11` — insert after `screen_gate`:
`lesson_exit_label` "Lưu và về bài học" · `lesson_check` "Kiểm tra" · `lesson_continue` "Tiếp" · `lesson_next_question` "Câu tiếp" · `lesson_submit` "Nộp bài" · `lesson_pick_hint` "Chọn một đáp án" · `lesson_right` "Đúng rồi." · `lesson_wrong` "Chưa đúng. Đáp án là" · `lesson_review_hint` "Câu này sẽ quay lại ở phần ôn".
- Verify: `pnpm check` compiles paraglide (`package.json:11`).

## Task 3 [AC2] [AC3] Choice logic (pure)
File: `src/lib/lesson/choice.ts` (new) + `src/lib/lesson/types.ts` (new, seam types verbatim from SPEC)
- `grade(step, pick)` → `{ correct, marks: Record<string,'right'|'wrong'>, verdict: m.lesson_right()|m.lesson_wrong(), hint }` — `step.js:75-82`.
- `toAnswer(step, pick, ms)` → `Answer` (`card` copied only when the step has one).
- `choiceCta({ mode, last, phase: 'picking'|'graded', picked, correct })` → `{ label, disabled, caret, hint }` — `step.js:82,84-85`.
  feedback+picking → `lesson_check`, caret off, disabled = !picked, hint = picked ? '' : `lesson_pick_hint`;
  feedback+graded → `lesson_continue`, caret on, hint = correct ? '' : missHint ?? `lesson_review_hint`;
  test → last ? `lesson_submit` : `lesson_next_question`, caret on, disabled = !picked.
- Test first: `src/lib/lesson/choice.test.ts` — one test per SPEC test-contract line for AC2/AC3 (answer "好", wrong pick "你", custom `missHint`, test last/not-last).
- Verify: `pnpm vitest --run src/lib/lesson/choice.test.ts`

## Task 4 [AC2] [AC3] Choice view
File: `src/lib/lesson/steps/Choice.svelte` (new)
- `<script module lang="ts">`: `export const kind = 'choice'`; `export type Step` (SPEC).
- Instance: props `StepProps<Step>`; state `pick`, `phase`, `shown = performance.now()` (ms, as placement `+page.svelte:51-53`).
- `$effect` pushes `cta(choiceCta(…) + onclick)` on every `pick`/`phase` change.
  onclick feedback+picking → `phase='graded'`; feedback+graded → `next(answer)`; test → `next(answer)` with no marks.
  `answer = toAnswer(step, pick, ms)` (Task 3). Module script imports `type Skill` from `#lib/study/index.js` for `Step.card`.
- Markup: eyebrow `ask`, `<h2>` `title`, options as placement `+page.svelte:140-157 (aria-pressed :150)` (`aria-pressed`), `data-mark="right|wrong"` + check / x badge (`#i-bold-check`, `#i-regular-x`) after grading, options inert once graded, verdict line `<p aria-live="polite">`.
- Test first: covered by Task 6 render + Task 3 logic. Verify: `pnpm check`.

## Task 5 [NFR] Kind union + view lookup
File: `src/lib/lesson/steps.ts` (new)
- `export type LessonStep = | import('./steps/Choice.svelte').Step;`
- `const views = import.meta.glob<{ default: Component<StepProps<any>>; kind: string }>('./steps/*.svelte', { eager: true })`;
  `export const viewOf = (kind: LessonStep['kind'])` → module whose file stem lower-cased === kind; throws `unknown step kind` otherwise.
- Test first: `src/lib/lesson/steps.test.ts` — `Given_EveryStepFile_When_Loaded_Then_KindMatchesFileName`; `viewOf('choice')` returns Choice.
- Verify: `pnpm vitest --run src/lib/lesson/steps.test.ts`

## Task 6 [AC1] [AC2] [AC3] StepRunner
File: `src/lib/lesson/StepRunner.svelte` (new), `src/lib/lesson/index.ts` (new: re-export `StepRunner`, types, `LessonStep`)
- Props per SPEC Seam. Destructure only `steps, mode, exit, onfinish`; leave `lesson`, `section`, `contentSha` typed in `Props` but out of the destructure (S2 reads them) so `pnpm lint` has no unused var. State `index = 0`, `current: Cta | null = null`.
- `<FocusFrame step={index}>`; top snippet = grid `[44px_1fr_auto]`: `<a href={exit} aria-label={m.lesson_exit_label()}>` with `#i-regular-x`, segments `<div data-seg style="--n:{steps.length}">` with `steps.length` `<i data-on={i < p.on}>`, counter `p.label`.
- `{#key index}` render `viewOf(steps[index].kind).default` with `{ step, mode, last: index === steps.length - 1, cta: (c) => current = c, next }`.
- `next(answer)`: `current = null`; index < last → `index += 1`; else `onfinish()` (guard: once).
- actions snippet: `<Button caret={current?.caret} disabled={!current || current.disabled} onclick={current?.onclick}>{current?.label ?? ''}</Button>` + hint `<p>` under it.
- Sprite: runner does not inject it; callers' pages include `{@html sprite}` like placement `+page.svelte:89-90` (dev route does).
- Test first: `src/lib/lesson/StepRunner.test.ts` (svelte/server) — 6 choice steps → `aria-label="Lưu và về bài học"`, `href` = exit, 6 `<i` in `[data-seg]`, 0 `data-on="true"`, "1/6", `<button` with `disabled`. SSR does not run `$effect`, so the CTA is the null (disabled) state — that is the AC1 "disabled until allowed" proof.
- Verify: `pnpm vitest --run src/lib/lesson/StepRunner.test.ts`

## Task 7 [AC3] Placement last question reads "Nộp bài"
Files: `src/lib/placement/run.ts:57` (append), `src/lib/placement/index.ts:2`, `src/routes/(onboard)/placement/+page.svelte:170`
- `export const isLast = (r: Run) => r.level === 5 && r.index === 9;` and export it from `index.ts`.
- `+page.svelte:170`: `{isLast(run) ? m.lesson_submit() : m.placement_next()}`.
- Test first: `src/lib/placement/run.test.ts` — `Given_Level5Index9_When_IsLast_Then_True`; level 5 index 8 and level 4 index 9 → false (build runs with `play()` `run.test.ts:10-18`).
- Verify: `pnpm vitest --run src/lib/placement/run.test.ts`

## Task 8 [AC1] [AC2] [AC3] Dev proof route
Files: `src/routes/dev/step/+page.server.ts` (copy of `dev/ledger/+page.server.ts:1-10`), `src/routes/dev/step/+page.svelte` (new)
- 6 choice steps (answers 好, 你, 我, 是, 不, 吗); `mode` from `?mode=test`; `exit` = resolve('/(app)/(tabs)/today'); `lesson='h1-01'`, `section='dev'`, `contentSha='dev-1'`; `onfinish` shows "finished" text; `{@html sprite}`.
- Verify (verify stage): agent-browser `/dev/step` — 2/6 after one step, "Đúng rồi."/"Chưa đúng. Đáp án là 你" + hint, "Tiếp"; `/dev/step?mode=test` — no marks, step 6 reads "Nộp bài"; `/placement` level 5 q10 reads "Nộp bài" (answer the first 49 right).

## Mutation paths covered
- Pick change before grading (re-pick allowed, `step.js:67-72`) · pick after grading ignored (`step.js:68`) · double-tap "Tiếp" on the last step → `onfinish` once (Task 6 guard) · test mode never calls `grade` · Placement "Không biết" path (`+page.svelte:162`) unchanged.

## Draft code (UNEXECUTED — adapt to what's on disk; report a contradictory fixture, never bend it)
```svelte
<!-- StepRunner.svelte core -->
{#key index}
	{@const View = viewOf(steps[index].kind).default}
	<View step={steps[index]} {mode} last={index === steps.length - 1} cta={(c) => (current = c)} {next} />
{/key}
```

## Full gate before handoff
`pnpm vitest --run src/lib/lesson src/lib/placement` · `pnpm check` · `pnpm lint` run raw (memory: rtk hides prettier failure).

## Rollback
git revert of this slice's commits; no migration, no data.
