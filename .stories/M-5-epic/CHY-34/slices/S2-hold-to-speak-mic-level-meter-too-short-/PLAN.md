# CHY-34 S2 — plan
ACs: AC2, AC3, AC5  ·  Spec rev 2  ·  Repo: chaiyo  ·  Branch: CHY-34-S2 (wave-2 lane branch)
Base: .@a65f4297

Landing order (wave rule, Loc 2026-11-16): rebase onto CHY-30.S2 tip (StepRunner props/`next`) and
CHY-33.S1 tip (`[section]/sections.ts` + switch) and CHY-25.S2 tip (`lesson/[id]/+layout.ts` →
`data.lesson`) before Task 5; land after all three. Tasks 1–4 and 6 need none of them.

## Anchors (verified 2026-11-16 on a65f4297)
- `src/lib/lesson/types.ts:13-19` — `Cta = { label; disabled?; caret?; hint?; onclick }`
- `src/lib/lesson/StepRunner.svelte:75-84` — `actions()` snippet: `<Button caret disabled onclick>` + hint `<p>`
- `src/lib/lesson/StepRunner.svelte:66-72` — view gets `cta={(c) => (current = c)}` and `{next}`
- `src/lib/lesson/steps.ts:4` — `export type LessonStep = import('./steps/Choice.svelte').Step;`
- `src/lib/lesson/steps.ts:8-15` — views found by file stem == `kind` (`steps.test.ts:8-19` asserts it)
- `src/lib/lesson/steps/Choice.svelte:1-17` — `<script module>` exports `kind` + `Step` (pattern)
- `src/lib/lesson/steps/Choice.svelte.test.ts:16-35` — `mount` + captured `cta` pattern
- `src/lib/ui/Button.svelte:11,52` — only `onclick` reaches `<button>` (not edited; wrapper div catches bubbling events)
- `src/lib/catalog/index.ts:23-33` — `LessonContent { contentSha, lesson: Lesson | Primer, sentences, … }`
- `src/lib/content/schemas.ts:176-180` — `readAloud { sentence }`, `freeAnswer { prompt, rubric }`
- `src/lib/content/schemas.ts:104-110` — `Prompt`: `vi`/`syllable` carry `text`, `hanzi`/`audio`/`image` carry `ref`
- `src/lib/content/schemas.ts:79-90` — `Sentence { hanzi, pinyin, spoken?, vi }`
- `src/lib/content/schemas.ts:204` — `sections.listenSpeak.items: Question[]`
- `content/lessons/hsk1/h1-01.yaml:94-128` — l01 tone, l02/l03 choice, s01 readAloud→s-h1-01-06, f01, f02 freeAnswer
- `messages/vi.json:135` — `lesson_review_hint` (insert block after it)
- `src/routes/dev/step/+page.svelte:1-36` + `+page.server.ts` — dev-only proof route pattern (404 outside dev/preview)
- `vite.config.ts:55-68` — `*.svelte.test.ts` → jsdom, other `*.test.ts` → node

## Task 1 [AC2] Hold timing + meter maths (pure)
File: new `src/lib/speak/hold.ts`
- `MIN_HOLD_MS = 700`; `BARS = 28`.
- `held(micOnAt: number | null, releasedAt: number): 'short' | 'done'` — null or `< 700` → `'short'`.
- `clock(ms)` → `m:ss` (`3_000` → `'0:03'`, `61_000` → `'1:01'`).
- `level(buf: Uint8Array)` → RMS of `(v-128)/128` × 5, clamped 0..1 (prototype `l6-listen.html:185-187`).
- `push(levels: number[], v: number)` → new array, length stays `BARS`.
- Test first: `src/lib/speak/hold.test.ts` — `Given_699ms_When_Held_Then_Short`, `Given_700ms_When_Held_Then_Done`,
  `Given_NoMicOn_When_Held_Then_Short`, `Given_3s_When_Clock_Then_0_03`, `Given_61s_When_Clock_Then_1_01`,
  `Given_Silence128_When_Level_Then_0`, `Given_FullSwing_When_Level_Then_1`, `Given_28Levels_When_Push_Then_Still28`.
- Verify: `pnpm vitest --run src/lib/speak/hold.test.ts`

## Task 2 [AC3] [AC5] Mic open/close — analyser only
File: new `src/lib/speak/mic.ts`
- `export class MicBlocked extends Error {}`.
- `openMic(): Promise<{ level(): number; close(): void }>` — `navigator.mediaDevices?.getUserMedia` missing →
  throw `MicBlocked`; `getUserMedia({ audio: true })` rejects → throw `MicBlocked` (any error name).
- `new AudioContext()` → `createAnalyser()` (`fftSize = 1024`) ← `createMediaStreamSource(stream)`; one reused
  `Uint8Array(1024)`; `level()` = `getByteTimeDomainData` + `hold.level`. No `MediaRecorder`, no other buffer.
- `AudioContext` / analyser construction throws after the stream opened → stop every track, throw `MicBlocked`.
- `close()` idempotent: every `stream.getTracks()` `.stop()`, `ctx.close()` (rejection swallowed).
- Test: covered through the component in Task 4 (jsdom stubs); no separate test file.

## Task 3 [AC2] Runner CTA accepts press/release (outside lane — engine files, Q1 = C)
Files: `src/lib/lesson/types.ts:13-19`, `src/lib/lesson/StepRunner.svelte:75-84`
- `Cta`: add `hold?: { onpress: () => void; onrelease: () => void }`.
- `actions()` snippet: wrap the `<Button>` in `<div role="presentation">`; when `current?.hold`:
  `onpointerdown` → `preventDefault`, `(e.target as Element).setPointerCapture?.(e.pointerId)`, `onpress()`;
  `onpointerup` / `onpointercancel` → `onrelease()`; `onkeydown` Space/Enter, `!e.repeat` → `preventDefault`,
  `onpress()`; `onkeyup` Space/Enter → `onrelease()`; `oncontextmenu` → `preventDefault`; class `select-none touch-none`.
  No `hold` → handlers return early; click path unchanged. `Button.svelte` untouched.
- Click-through guard [AC2][AC5] — armed on PRESS, because a denied mic swaps the CTA to "Bỏ qua" (no `hold`)
  while the button is still held: locals `pressed = false`, `swallow = false`. `onpointerdown` / `onkeydown` → `swallow = false`;
  if `current?.hold` → `pressed = true`, `onpress()`. `onpointerup` / `onpointercancel` / `onkeyup` → if `pressed`:
  `pressed = false`, `swallow = true` (keyup also `preventDefault`, cancelling the Space click), `current?.hold?.onrelease()`.
  `onclickcapture` → `if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); }`. A hold ending off the
  button (no click follows) is cleared by the next pointerdown, so the next real tap is never eaten.
- Rebase note: CHY-30.S2 edits `StepRunner.svelte:9-34` (script) only; this edit is the snippet.
- Test first: `src/lib/lesson/StepRunner.svelte.test.ts` — `Given_HoldCta_When_PointerDownUp_Then_PressReleaseOnce`,
  `Given_HoldCta_When_SpaceDownUp_Then_PressReleaseOnce`, `Given_HoldCta_When_KeyRepeat_Then_PressOnce`,
  `Given_HoldReleased_When_TrailingClick_Then_NotAdvancedUntilSecondTap` [AC2],
  `Given_BlockedMic_When_ReleaseClick_Then_SkipCopyStays` [AC5] (await the blocked copy BEFORE pointerup),
  `Given_BlockedMic_When_SpaceUp_Then_SkipCopyStays` [AC5],
  `Given_HoldEndedOffButton_When_NextTap_Then_Advances` [AC2].
  Mount the runner with one `speak` step (stubbed mic as Task 4) and assert the CTA text flips to
  "Thả khi nói xong" after pointerdown and to "Tiếp" after pointerup at 3 s. Existing click tests unchanged.
  Order: Task 3 lands with Task 4 (its test needs the Speak view).
- Verify: `pnpm vitest --run src/lib/lesson/StepRunner`

## Task 4 [AC2] [AC3] [AC5] Speak step view + union line + copy
Files: new `src/lib/lesson/steps/Speak.svelte`; `src/lib/lesson/steps.ts:4`; `messages/vi.json:135`
- `<script module>`: `export const kind = 'speak'`; `export type Step = { kind: 'speak'; id: string; ask: string;
  title: string; hanzi?: string; pinyin?: string; meaning?: string }`.
- `steps.ts:4` → `= import('./steps/Choice.svelte').Step | import('./steps/Speak.svelte').Step;` (one line).
- Phase `$state<'idle'|'opening'|'live'|'short'|'blocked'|'done'>('idle')`; `session` counter drops a stale
  `openMic` result (released before resolve → `close()` it at once, phase `'short'`).
- `press()`: phase ∉ {idle, short} → return; `opening`; `await openMic()` → `MicBlocked` → `blocked`;
  else `micOnAt = performance.now()`, `live`, rAF loop: `levels = push(levels, mic.level())`, `elapsed = now - micOnAt`.
- `release()`: phase ∉ {opening, live} → return (stray keyup from the previous step); stop rAF, `mic.close()`, `held(micOnAt, performance.now())` → `'short'` | `'done'`.
- `$effect` → `cta(...)`: idle/short/opening/live → label `lesson_speak_hold` / (`live` → `lesson_speak_release`),
  `hold: { onpress: press, onrelease: release }`, `onclick: () => {}`, hint `''`;
  `done` → `lesson_continue`, caret, `onclick: () => next()`; `blocked` → `lesson_speak_skip`, `onclick: () => next()`.
- `$effect` teardown (unmount / step change) → `session++` (a pending `openMic` result is closed on arrival),
  `cancelAnimationFrame`, `mic?.close()`.
- Body: ask, title; target (hanzi `font-hanzi`, pinyin, meaning) when `hanzi` is set; recorder area per phase:
  idle copy · opening copy · `{#each levels}<i data-bar style="height:{3 + l*58}px">` + `<span data-timer>{clock(elapsed)}</span>`
  + caption · short copy · blocked copy (`aria-live="polite"` on the area).
- Imports: no `#lib/ledger`, `#lib/study` type-only (CHY-30.S2 Task 5 guard).
- `messages/vi.json` after `:135`: `lesson_speak_idle` "Giữ nút đỏ bên dưới khi nói, nói xong thì thả.",
  `lesson_speak_hold` "Giữ để nói", `lesson_speak_opening` "Đang bật micro…", `lesson_speak_release` "Thả khi nói xong",
  `lesson_speak_listening` "Đang nghe… thả nút khi nói xong", `lesson_speak_short` "Ngắn quá — giữ nút lâu hơn một chút rồi nói.",
  `lesson_speak_blocked` "Không dùng được micro — bỏ qua phần nói, phần học vẫn tính là xong.", `lesson_speak_skip` "Bỏ qua",
  `lesson_speak_read_ask` "Nói · đọc to", `lesson_speak_read_title` "Đọc to câu này", `lesson_speak_answer_ask` "Nói · trả lời".
- Test first: new `src/lib/lesson/steps/Speak.svelte.test.ts` (jsdom; `vi.stubGlobal` `navigator.mediaDevices`
  + `AudioContext` fake whose analyser fills a loud frame; `vi.useFakeTimers({ toFake: ['requestAnimationFrame',
  'cancelAnimationFrame', 'performance'] })`):
  - `Given_Idle_When_Mounted_Then_HoldCtaAndIdleCopy` [AC2]
  - `Given_MicOn_When_Held3s_Then_28BarsTimer0_03AndReleaseLabel` [AC2]
  - `Given_Held3s_When_Release_Then_ContinueAndNextWithNoArg` [AC2]
  - `Given_Held500ms_When_Release_Then_TooShortAndHoldAgain` [AC2]
  - `Given_ReleaseBeforeMicOn_When_Resolved_Then_TooShortAndTracksStopped` [AC2] [AC3]
  - `Given_FullHold_When_Done_Then_NoFetchBeaconRecorderStorageIdb` [AC3] (spies; 0 calls)
  - `Given_Release_When_Done_Then_EveryTrackStoppedAndContextClosed` [AC3]
  - `Given_LiveHold_When_Unmount_Then_TracksStoppedAndContextClosed` [AC3]
  - `Given_Opening_When_UnmountThenResolve_Then_TracksStopped` [AC3]
  - `Given_AudioContextThrows_When_Press_Then_TracksStoppedAndBlocked` [AC3] [AC5]
  - `Given_NoPress_When_Release_Then_IdleCopyUnchanged` [AC2]
  - `Given_NotAllowedError_When_Press_Then_BlockedCopyAndSkip` [AC5]
  - `Given_NoMediaDevices_When_Press_Then_BlockedCopyAndSkip` [AC5]
  - `Given_Blocked_When_Skip_Then_NextWithNoArg` [AC5]
  - `steps.test.ts`: `Given_SpeakKind_When_ViewOf_Then_ReturnsSpeak`.
- Verify: `pnpm vitest --run src/lib/lesson`

## Task 5 [AC2] [AC5] "Nghe & nói" section renders its speak steps
Files: new `src/routes/(app)/lesson/[id]/[section]/listen-speak.ts`, new `…/[section]/ListenSpeak.svelte`,
`…/[section]/sections.ts` (one line, created by CHY-33.S1 — outside lane)
- `speakSteps(content: LessonContent): LessonStep[]` — `'listenSpeak' in content.lesson.sections` else `[]`;
  `readAloud` → `{ kind:'speak', id, ask: m.lesson_speak_read_ask(), title: m.lesson_speak_read_title(),
  hanzi, pinyin: spoken ?? pinyin, meaning: vi }` (sentence by id from `content.sentences`; missing → skip);
  `freeAnswer` → `{ kind:'speak', id, ask: m.lesson_speak_answer_ask(), title: 'text' in prompt ? prompt.text : prompt.ref }`;
  every other type skipped (CHY-34.S1 adds them).
- `ListenSpeak.svelte`: props = the section-component props CHY-33.S1's `sections.ts` declares (expected:
  `data.lesson` + runner context); mounts `StepRunner` with `steps = speakSteps(content)`, `section="listenSpeak"`,
  `lesson`, `contentSha = content.contentSha` and the REQUIRED `ledger: Ledger` (CHY-30.S2 seam, coordinator 2026-11-16;
  type from `#lib/ledger/index.js`) — taken from whatever the `[section]` page hands its section components.
  Adapt prop names to CHY-33.S1's tip at rebase; report, don't invent, if its type lacks lesson data.
- `sections.ts`: add `listenSpeak: ListenSpeak` (the param value is the curriculum key, `curriculum.json:18`).
- Test first: new `…/[section]/listen-speak.test.ts` (node) — hand-built `LessonContent` copying
  `h1-01.yaml:94-128` + sentence s-h1-01-06: `Given_H1_01_When_SpeakSteps_Then_ThreeSpeakSteps`,
  `Given_ReadAloud_When_SpeakSteps_Then_SentenceHanziSpokenPinyinMeaning` (不客气。 / bú kèqi / Không có gì.),
  `Given_FreeAnswer_When_SpeakSteps_Then_TitleIsPromptText`, `Given_Primer_When_SpeakSteps_Then_Empty`.
- Verify: `pnpm vitest --run "src/routes/(app)/lesson"`

## Task 6 [AC2] [AC5] Dev proof route
Files: new `src/routes/dev/speak/+page.server.ts` (copy `dev/step/+page.server.ts`: 404 outside dev/preview),
new `src/routes/dev/speak/+page.svelte`
- Sprite `{@html}` as `dev/step/+page.svelte`; 3 speak steps (不客气。 read-aloud, 2 free answers from h1-01);
  `StepRunner` with the required `ledger` (CHY-30.S2 seam): an `openLedger` + `memoryStore` dev Ledger,
  db `chaiyo-dev-speak`, same as its `/dev/step` Task 6); `onfinish` → "finished".
- Verify (verify stage, port 5416): agent-browser with Chrome `--use-fake-device-for-media-stream
  --use-fake-ui-for-media-stream`: hold 3 s → bars change height, timer "0:03", label "Thả khi nói xong";
  release → "Tiếp"; tap 0.3 s → too-short copy. Relaunch with mic permission denied → blocked copy, "Bỏ qua"
  ×3 → "finished". Network panel from first press to finish: 0 requests.

## Mutation paths covered
- trailing click after release (pointer + Space) swallowed once · stray keyup with no press ignored ·
  unmount while opening (late stream closed) · AudioContext ctor throws (tracks stopped, blocked).
- press → release ≥ 700 ms (done) · press → release < 700 ms (short, then hold again) · release while
  `getUserMedia` pending (stale session closed) · unmount / step change mid-hold (teardown) · permission
  denied / no `mediaDevices` (blocked → skip) · key-repeat keydown (one press) · pointercancel (= release).
- Skip and Tiếp both call `next()` with no answer; CHY-30.S2 records `correct: null`, so the run closes at `of`.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk; a contradictory fixture is reported, not hacked)
```svelte
<!-- StepRunner.svelte actions() -->
<div
	role="presentation"
	class={current?.hold ? 'select-none touch-none' : ''}
	onpointerdown={(e) => { if (!current?.hold) return; e.preventDefault();
		(e.target as Element).setPointerCapture?.(e.pointerId); current.hold.onpress(); }}
	onpointerup={() => current?.hold?.onrelease()}
	onpointercancel={() => current?.hold?.onrelease()}
	onkeydown={(e) => { if (!current?.hold || (e.key !== ' ' && e.key !== 'Enter') || e.repeat) return;
		e.preventDefault(); current.hold.onpress(); }}
	onkeyup={(e) => { if (current?.hold && (e.key === ' ' || e.key === 'Enter')) current.hold.onrelease(); }}
	oncontextmenu={(e) => current?.hold && e.preventDefault()}
	onclickcapture={(e) => { if (!swallow) return; swallow = false; e.stopPropagation(); e.preventDefault(); }}
>
<!-- + pressed/swallow per the guard above: arm on press, swallow the click after any pressed release -->
	<Button …unchanged…>{current?.label ?? ''}</Button>
</div>
```

## Rollback
`git revert` of this slice's commits; no migration, no stored data (nothing is ever recorded).
