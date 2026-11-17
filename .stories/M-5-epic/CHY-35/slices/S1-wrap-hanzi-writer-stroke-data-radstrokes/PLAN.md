# CHY-35 S1 — plan
ACs: AC2, AC6  ·  Spec rev 2  ·  Repo: chaiyo (stonghuuloc/chaiyo)  ·  Branch: CHY-35-S1
Base: .@0836423e

Branch note: the M-5 wave plan gives each wave-1 lane its own worktree branch (`CHY-35-S1`); S2 (wave 4) reuses the story branch the coordinator names then.

## Anchors (re-verified 2026-11-13 on 0836423e (ci.yml +2 lines, vi.json rewritten, icons ids intact))
- `package.json:70` — `"dependencies": {` (5 entries, `zod` last at :75); no `hanzi-writer`.
- `docs/copy-voice.md` rule 8 says append-only; PLAN keeps one block after `screen_word` (lane-conflict avoidance, per coordinator). Copy complies with rules 1-3,7.
- `messages/vi.json:13` — `"screen_word": "Từ",` (insert point for the `strokes_*` keys; words-lane neighbour, keeps other lanes' appends at EOF conflict-free).
- `src/lib/styles/tokens.css:10` `--color-lantern-red: #c6301d` · `:19` `--color-ink: #1d1814` · `:23` `--color-ruled-line: #ddd5c8`.
- `src/lib/styles/guard.test.ts:7` — colour literals banned in `.svelte`/`.css`; allowed in `.ts` (precedent `src/lib/ui/celebrate.ts:1`).
- `src/lib/components/TalkingCast.test.ts:1` — `render` from `svelte/server`, the component-test pattern (Node env, `vite.config.ts:55`).
- `src/lib/components/TalkingCast.svelte:17` — `type Props` + `$props()` + `$effect` cleanup pattern to mirror.
- `src/routes/dev/audio/+page.server.ts:7` — `prerender = false` + `if (!dev && VERCEL_ENV !== 'preview') error(404)`; copy for `/dev/strokes`.
- `src/routes/(app)/+layout.svelte:2` — icon sprite import; `/dev/*` is outside `(app)`, so the dev page inlines the sprite the same way.
- `src/lib/assets/icons.svg:3` — `i-regular-play`, `i-regular-lightbulb`, `i-regular-arrow-counter-clockwise`.
- `prototype/l7-writing.html:84` — `HanziWriter.create` options (pen 48, colours, leniency 1.2, `highlightOnComplete: false`); `:101-126` quiz / demo / tip wiring.
- `prototype/step.js:99` — `RAD = { 再: [1, 2], 见: [0, 1, 2, 3], 气: [0, 1, 2, 3] }`.
- `.github/workflows/ci.yml:88` — `pnpm audit --prod --audit-level=high`; `:90` semgrep on `src`.
- hanzi-writer 3.7.3 tarball (not in repo): default loader URL `dist/index.esm.js` L2193-2195; Promise-returning loader handled L2286-2297; types `dist/types/index.esm.d.ts` L52-57, L440.

## Task 1 [CHORE] Add hanzi-writer
File: `package.json:70`
- Change: `pnpm add hanzi-writer@^3.7.3` (caret, like every entry at `package.json:71-75`; lands in `dependencies`, lockfile updated).
- Verify: `pnpm audit --prod --audit-level=high` exits 0; `pnpm ls hanzi-writer` → 3.7.3; `pnpm check` green (types resolve from `dist/types/index.esm.d.ts`).

## Task 2 [AC2] [AC6] Pure module `src/lib/components/hanzi-strokes.ts` (new)
Pattern: `src/lib/components/talking-cast.ts:1` (pure logic beside the component).
- Test first: `src/lib/components/hanzi-strokes.test.ts` (new):
  - `Given_Zai_When_WithRadicals_Then_PatchesOneTwo` — 再 data without `radStrokes` → `[1, 2]`.
  - `Given_JianQi_When_WithRadicals_Then_PatchesAllFour` (it.each 见, 气 → `[0, 1, 2, 3]`).
  - `Given_NiWithRadStrokes_When_WithRadicals_Then_Unchanged` — 你 `[0, 1]` stays `[0, 1]`, same object.
  - `Given_UnknownCharNoRad_When_WithRadicals_Then_NoRadStrokes`.
  - `Given_FetchOk_When_LoadStrokes_Then_RequestsCdnUrlAndPatches` — fake fetch records the URL = `STROKE_DATA + '再.json'`; result `radStrokes [1, 2]`.
  - `Given_FetchRejects_When_LoadStrokes_Then_Rejects` (TypeError "Failed to fetch").
  - `Given_404_When_LoadStrokes_Then_Rejects` (`new Response('', { status: 404 })`).
  - `Given_QuizOutline_When_WriterOptions_Then_Pen48AndTokenColours` — `drawingWidth 48`, `radicalColor '#c6301d'`, `strokeColor '#1d1814'`, `drawingColor '#1d1814'`, `outlineColor '#ddd5c8'`, `showOutline true`, `showCharacter false`, `width/height 280`, `padding 22`.
  - `Given_OutlineFalse_When_WriterOptions_Then_NoOutline`.
  - `Given_WriterOptions_When_CharDataLoader_Then_ReturnsLoadPromise` — `opts.charDataLoader('再', ok, fail)` returns the promise from `load` (so a rejection reaches `onLoadCharDataError`, tarball L2286-2297).
  - `Given_TokensCss_When_Compare_Then_StrokeColoursMatch` — read `../styles/tokens.css` like `src/lib/styles/tokens.test.ts:7`; assert the 3 values.
- Verify: `pnpm vitest --run src/lib/components/hanzi-strokes.test.ts`

## Task 3 [AC2] [AC6] Copy keys
File: `messages/vi.json:13` — insert after `screen_word`:
`strokes_count: "nét {done}/{total}"`, `strokes_demo: "Xem mẫu"`, `strokes_hint: "Gợi ý"`, `strokes_redo: "Viết lại"`, `strokes_load_error: "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại."`
- Test first (in `hanzi-strokes.test.ts`): `Given_ViMessages_When_Read_Then_LoadErrorIsAc6Copy` — parse `messages/vi.json`, exact string equality.
- Verify: same filtered command; `pnpm check` (paraglide compiles `m.strokes_*`).

## Task 4 [AC2] [AC6] Component `src/lib/components/HanziStrokes.svelte` (new)
Pattern: `src/lib/components/TalkingCast.svelte:17` (Props, `$effect` with cleanup).
- Props/exports exactly as SPEC "Seam". State: `status: 'loading' | 'ready' | 'error'`, `done`, `total`, `mistakes`, `finished`, `busy`.
- Build `$effect` (reads `char`, `mode`; reads `outline` with `untrack` for the initial value only): reset state; `gen++`; `appliedOutline = untrack(() => outline)` (plain variable); dynamic `import('hanzi-writer')`; after the await, `if (me !== gen) return` (a char change during the import must not mount a second writer); `HanziWriter.create(pad, char, { ...writerOptions(mode, outline, pad.clientWidth, load), onLoadCharDataSuccess, onLoadCharDataError })`; import rejection → error. Cleanup: `writer.cancelQuiz()`, remove only the writer's own `<svg>` from `pad` (`svg.remove()`; never `innerHTML` — semgrep `p/javascript`, `.github/workflows/ci.yml:88`), `gen++` so stale callbacks drop (prototype `me !== gen` guard, `prototype/l7-writing.html:91`).
- Outline `$effect` (tracks `outline` only; reads `status`/`writer` inside `untrack`): acts only when ready and `outline !== appliedOutline` → set `appliedOutline`, `outline ? writer.showOutline() : writer.hideOutline()` (tarball L2515, L2529), then quiz mode → `restart()`. A load never re-triggers it, so the quiz starts once per load. No re-fetch, so S2's round 1 → 2 never flashes `nét 0/–`.
- Load success: `total = data.strokes.length`; quiz mode → `startQuiz()`; emit `onprogress({ done: 0, total, mistakes: 0 })`.
- `startQuiz()`: `writer.quiz({ onCorrectStroke: d → done = d.strokeNum + 1, mistakes = d.totalMistakes, emit; onMistake: d → mistakes = d.totalMistakes, emit; onComplete: d → finished = true, done = total, mistakes = d.totalMistakes, emit, oncomplete({ mistakes }) })`.
- Load error → `status = 'error'`, `onerror?.()` once (guard flag).
- `play()`: error → resolve; await ready; `const me = gen`; `busy = true`; `hideCharacter(); await animateCharacter()` (it cancels the quiz itself, tarball L2447); `if (me !== gen) return` (char changed mid-animation — never restart the new writer); `busy = false`; quiz mode → `restart()`.
- Tools (quiz only): Xem mẫu → `play()` (disabled while `busy` or not ready); Gợi ý → `writer.highlightStroke(done)` (disabled when `finished`, `busy`, not ready); Viết lại → `restart()` = `finished = false; done = 0; mistakes = 0; startQuiz(); emit` (`quiz()` clears drawn strokes itself).
- Markup: counter row (quiz) `m.strokes_count({ done, total: status === 'ready' ? total : '–' })`; a `relative aspect-square w-full` box holding three layers: (1) the 米字格 grid `<svg>` using `stroke-ruled-line` (no literal — guard), (2) the `pad` div Hanzi Writer mounts into (`touch-action: none`, `pointer-events-none` while busy), always mounted, `invisible` in the error state, (3) in the error state only, a centred `<p>` `m.strokes_load_error()` over it. The pad never unmounts, so a rebuild after an error (S2 skips to the next char) has an element to mount into; tools as 3 `<button>`s with sprite icons (`#i-regular-play`, `#i-regular-lightbulb`, `#i-regular-arrow-counter-clockwise`), styling from `prototype/l7-writing.html:32-36` mapped to tokens.
- Test first: `src/lib/components/HanziStrokes.test.ts` (new), `svelte/server` render:
  - `Given_QuizMode_When_ServerRender_Then_ToolsAndEmptyCounter` — body contains "Xem mẫu", "Gợi ý", "Viết lại", "nét 0/–".
  - `Given_AnimateMode_When_ServerRender_Then_PadOnly` — none of the four strings.
  - `Given_AnyMode_When_ServerRender_Then_NoColourLiteral` is already covered by `guard.test.ts:19`; do not duplicate.
- Verify: `pnpm vitest --run src/lib/components/HanziStrokes.test.ts src/lib/styles/guard.test.ts`

## Task 5 [AC2] [AC6] Dev proof page `/dev/strokes`
Files (new): `src/routes/dev/strokes/+page.server.ts` (copy `src/routes/dev/audio/+page.server.ts:7-11`, `load()` returns `{}`), `src/routes/dev/strokes/+page.svelte`.
- Page: sprite inline (pattern `src/routes/(app)/+layout.svelte:2`); a 280 px box with `HanziStrokes` quiz for a `?c=` char (default 你) plus a char `<input>` and an outline checkbox bound to state (so char/outline change without a reload); readouts `progress <done>/<total> mistakes <n>`, `complete <n>`, `error <bool>` from the callbacks; a second box: `HanziStrokes` animate for 再 with a "play" button calling `play()`.
- No unit test (route is a harness); proven in Task 6.

## Task 6 [AC2] [AC6] Browser proof (agent-browser, local `pnpm dev`)
On `http://localhost:5173/dev/strokes`:
1. [AC2] `?c=你`: counter `nét 0/7`. Read 你 stroke 0 median from `STROKE_DATA + '你.json'`, map data coords to pad pixels by inverting Hanzi Writer's `Positioner` (tarball `dist/index.esm.js` L579-616: box x 0…1024, y −124…900, y flipped, `padding` from `writerOptions`), drag with `mouse down/move/up` → counter `nét 1/7`, readout `progress 1/7`.
1b. [AC2] One drag far off stroke 2 (e.g. bottom-left corner to top-right corner) → counter stays `nét 1/7`, readout `mistakes 1`.
1c. [AC2] Drag the remaining medians 2…7 → `nét 7/7`, readout `complete 1` (fired once), Gợi ý disabled.
1d. [AC2] Toggle `?outline=0` via the page's outline checkbox (no reload) → outline gone, `nét 0/7`, no `nét 0/–` between.
2. [AC2] Gợi ý → a highlight path animates (screenshot). Viết lại → `nét 0/7`. Xem mẫu → tools disabled during animation, then `nét 0/7`.
3. [AC2] Drawn user stroke: `eval` the last user `path` `stroke-width` → `48`.
4. [AC2] `?c=再` animate box after play: count `path` with fill/stroke `#c6301d` = 2 strokes, rest `#1d1814`. Repeat for 见 / 气 → 4 red. 你 → 2 red (its own `[0, 1]`).
5. [AC6] `agent-browser network route "https://cdn.jsdelivr.net/**" --abort`, reload `?c=你` → text "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại." visible, 3 tools `disabled`, readout `error true`. Then `network unroute` and switch the char with the page's char input (no reload) to 好 → pad back, `nét 0/6`, readout `error` stays from before but a new `progress 0/6` arrives (rebuild after error).
6. Screenshots of 1, 4, 5 into the slice's VERIFY.md at verify stage.

## Task 7 [CHORE] CI chain on the final tree
- `pnpm lint && pnpm check && pnpm test && pnpm build` run raw (memory: rtk hides prettier failures), plus `pnpm audit --prod --audit-level=high`.
- Coverage thresholds (`vite.config.ts:48`) hold: `HanziStrokes.svelte` effect code is not exercised in Node; `hanzi-strokes.ts` is fully covered. If line coverage drops under 67 %, report — do not add tests that mount a fake DOM.

## Mutation paths covered
- Writer rebuilt on `char` change (S2 next character) and `mode` change through the build `$effect`; stale callbacks and a stale `play()` dropped by `gen`.
- `outline` change (S2 round 1 → 2): no rebuild, `showOutline`/`hideOutline` + `restart()`.
- Rebuild after error: pad stays mounted, so `char` change after a failed load creates a fresh writer and clears `status`.
- Restart paths: Viết lại, after Xem mẫu, after rebuild — all go through `restart()` / load success, each emits `onprogress` with `done 0`.
- Failure paths: fetch reject, non-2xx, chunk import reject — all end in `status = 'error'` + one `onerror`.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk; report a self-contradictory fixture instead of bending it)
```ts
// hanzi-strokes.ts
export const STROKE_DATA = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';
export const PEN_WIDTH = 48;
export const STROKE_COLORS = { ink: '#1d1814', radical: '#c6301d', outline: '#ddd5c8' };
export const RADICALS: Readonly<Record<string, readonly number[]>> = { 再: [1, 2], 见: [0, 1, 2, 3], 气: [0, 1, 2, 3] };

export const withRadicals = (char: string, d: CharacterJson): CharacterJson =>
	d.radStrokes || !RADICALS[char] ? d : { ...d, radStrokes: [...RADICALS[char]] };

export async function loadStrokes(char: string, fetchFn: typeof fetch = fetch) {
	const res = await fetchFn(`${STROKE_DATA}${char}.json`);
	if (!res.ok) throw new Error(`stroke data ${res.status}`);
	return withRadicals(char, (await res.json()) as CharacterJson);
}

export const writerOptions = (mode: StrokeMode, outline: boolean, size: number, load: (c: string) => Promise<CharacterJson>): Partial<HanziWriterOptions> => ({
	width: size, height: size, padding: Math.round(size * 0.08),
	showCharacter: false, showOutline: outline,
	strokeColor: STROKE_COLORS.ink, radicalColor: STROKE_COLORS.radical, highlightColor: STROKE_COLORS.radical,
	outlineColor: STROKE_COLORS.outline, drawingColor: STROKE_COLORS.ink, drawingWidth: PEN_WIDTH,
	strokeAnimationSpeed: 1.4, delayBetweenStrokes: 120, leniency: 1.2, highlightOnComplete: false,
	charDataLoader: (c) => load(c)
});
```
`mode` is unused by `writerOptions` today; drop the parameter in execute if it stays unused (SPEC seam updated in the same commit).

## Rollback
`git revert` of this slice's commits; removes the dependency and the dev page. No migration, no data.
