# CHY-16 S1 — plan
ACs: AC1, AC2, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-16  ·  runs on any machine (no device, no network)

## Anchors (verified 2026-11-07 on main fd2b67a)
- `prototype/step.js:9-22` — the `play()` being ported: shared `audio`, `plays = key === last ? plays + 1 : 1`, `plays % 2 ? 1 : 0.5`, `.catch(() => {})`. Its `unlight`/`lit` button state is NOT ported (spec out of scope).
- `vite.config.ts:50-60` — vitest project `server` (node env, `src/**/*.{test,spec}.{js,ts}`): no DOM, so tests inject a fake element. `expect.requireAssertions` is on: every test needs an `expect`.
- `vite.config.ts:36-49` — coverage `include src/**`, thresholds 67/67/52/79; `src/**/fixtures/**` and tests are excluded.
- `src/lib/index.ts` — empty barrel; sibling lib modules (`src/lib/ui/motion.ts` + `motion.test.ts`) show test-beside-source style, tabs, single quotes.
- `docs/architecture.md:33` — the contract `play(key, { slow })`; no doc edit needed.
- `prototype/talk/nihao.mp3` (11 232 B, tracked) — fixture for the browser proof; `.gitignore:30` only ignores `prototype/audio/`.
- `src/routes/+layout.ts:8` — `ssr = false` for app pages, but the Landing Page prerenders: `player.ts` must not touch `Audio` at import.

## Task 1 [AC1,AC2,AC4] Tests first
File: `src/lib/audio/player.test.ts` (new)
- [AC1] Fake element: class with `src`, `playbackRate = 1`, `preservesPitch = false`, `currentTime`, `play = vi.fn()` whose default resolves; each call records `{ rate: this.playbackRate, pitch: this.preservesPitch, src: this.src }` into `plays[]`. `createAudio = vi.fn(() => new Fake())`.
- [AC1] Cases = SPEC test contract: bare taps 1,0.5,1,0.5 (+ pitch, src); `slow` true/false forcing and the flip after; 11,11,12,11 → 1,0.5,1,1; restart sets `currentTime = 0` and `createAudio` called once; rejecting `play` → `false`, no `unhandledRejection` (`process.on` spy), retry at 1×; stale AbortError from A after a tap on B leaves B at 0.5 on its second tap; `play` called before `player.play()` returns (call-order spy); `import('./player')` with `globalThis.Audio` undefined does not throw.
- [AC1] Verify: `pnpm exec vitest --run --project server src/lib/audio --maxWorkers=2` fails to import (red first) `./player`.

## Task 2 [AC1,AC2,AC4] Implement `createPlayer`
File: `src/lib/audio/player.ts` (new)
- [AC1] `createPlayer({ base = '/audio', createAudio = () => new Audio() } = {})`; closure state `audio?`, `last: string | null`, `plays`, `token`.
- [AC1] `play(key, { slow }: { slow?: boolean } = {})`: `audio ??= createAudio()`; `plays = slow === undefined ? (key === last ? plays + 1 : 1) : slow ? 2 : 1; last = key;` set `src`, `preservesPitch`, `webkitPreservesPitch`, `playbackRate`, `currentTime = 0`; `const mine = ++token`; `return audio.play().then(() => true, () => { if (mine === token) last = null; return false; })` with the `audio.play()` call itself in a `try` (a throwing element resolves `false` too). No `await` before `audio.play()`.
- [AC4] Element `error` event: attach `audio.addEventListener('error', () => {})` is NOT needed (an `error` event is not an uncaught error); the `play()` rejection is the single path.
- [AC1] `export const { play } = createPlayer()` is evaluated at import and only closes over `createAudio`, so no `Audio` is constructed until the first tap.
- [AC4] Verify: Task 1 command green.

## Task 3 [CHORE] Barrel
File: `src/lib/audio/index.ts` (new): `export { play, createPlayer } from './player';`
- Verify: `pnpm check && pnpm lint && pnpm exec vitest --run --coverage --maxWorkers=2` green (thresholds hold).

## Task 4 [AC1,AC4] Live proof in a real browser (not committed)
Files: scratch only, `~/.capy/work/chy16/` — compile `player.ts` with `pnpm exec tsc src/lib/audio/player.ts --target es2022 --module es2022 --outDir ~/.capy/work/chy16`, serve it with `prototype/talk/nihao.mp3` copied to `/audio/11.mp3`.
- [AC1] Page buttons tap key `11` and `99`; Playwright via the browser tool records `audio.playbackRate` in the element playing handler (not at tap time), `preservesPitch`, `ended`, `pageerror`, `unhandledrejection`. Taps 1-4 → 1,0.5,1,0.5; `context.setOffline(true)` then tap `99` → resolves false, zero errors.
- [AC1] Verify: paste the recorded values into the PR body.

## Mutation paths covered
- Tap sequence on one key, on two keys (AC2), forced `slow`, rejection (reset), stale rejection after a newer tap, import without `Audio`. There is no persisted state.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
type Opts = { base?: string; createAudio?: () => HTMLAudioElement };
export function createPlayer({ base = '/audio', createAudio = () => new Audio() }: Opts = {}) {
	let audio: HTMLAudioElement | undefined;
	let last: string | null = null;
	let plays = 0;
	let token = 0;
	return {
		play(key: string, { slow }: { slow?: boolean } = {}): Promise<boolean> {
			audio ??= createAudio();
			plays = slow === undefined ? (key === last ? plays + 1 : 1) : slow ? 2 : 1;
			last = key;
			const mine = ++token;
			audio.src = `${base}/${key}.mp3`;
			audio.preservesPitch = true;
			(audio as { webkitPreservesPitch?: boolean }).webkitPreservesPitch = true;
			audio.defaultPlaybackRate = audio.playbackRate = plays % 2 ? 1 : 0.5;
			audio.currentTime = 0;
			let started: Promise<void>;
			try { started = audio.play(); } catch (e) { started = Promise.reject(e); }
			return started.then(() => true, () => { if (mine === token) last = null; return false; });
		}
	};
}
export const { play } = createPlayer();
```

## Rollback
git revert of this slice's commits; `src/lib/audio/**` is new and nothing imports it yet.
