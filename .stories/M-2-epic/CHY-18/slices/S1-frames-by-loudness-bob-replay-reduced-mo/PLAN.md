# CHY-18 S1 — plan
ACs: AC1, AC2, AC3, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-18 (stacked on CHY-16 S1 once pushed)

## Anchors (verified 2026-11-07 on main fd2b67a)
- `prototype/talk.js:5` CROP `[60, 420]`; `:10-22` `envelope()` (20 ms RMS, `min(1, v/max*1.3)`); `:39-43` target, smoothing 0.6/0.35, thresholds 0.18/0.5, bob `-5·level` px, `sin(t/140)·1.4·level` deg.
- `prototype/step.js:44-52` stage = canvas (click → replay) + `.play` button (`aria-label` "Nghe lại (bấm lần nữa để nghe chậm)").
- `src/lib/ui/Dialog.svelte:3,10` and `Toast.svelte:2` — `import { prefersReducedMotion } from 'svelte/motion'`, `prefersReducedMotion.current`.
- `src/lib/ui/Button.svelte:3-18` — props type + `$props()` pattern; strings (labels) come in as props (Toast `message`), not from paraglide inside the component.
- `src/lib/ui/ui.test.ts:1-14` — SSR test style: `render` from `svelte/server`, `Given_When_Then` names, Arrange/Act/Assert comments.
- `vite.config.ts:51-59` — only the node `server` project exists; `*.svelte.test.ts` is excluded. So no DOM tests.
- `package.json:61-62` — `#lib/*` import alias.
- `.gitignore:29` `assets/**/*.png` is root-anchored; `src/lib/assets/talk/*.png` is trackable (verified with `git check-ignore`: no match).
- `src/lib/components/` does not exist yet; this slice creates it.

## Task 1 [AC1] Copy the three frames
Files: `src/lib/assets/talk/redpanda-closed.png`, `redpanda-half.png`, `redpanda-open.png` (new)
- `cp` from `prototype/talk/redpanda-closed.png`, `redpanda-half-m.png`, `redpanda-open-m.png`. Leave the prototype files in place (prototype pages still load them).
- Verify: `shasum` of each pair equal.

## Task 2 [AC1][AC2] Pure module
File: `src/lib/components/talking-cast.ts` (new); test first in `src/lib/components/TalkingCast.test.ts` (new)
- Exports: `Frame`, `frameFor(level)`, `smoothLevel(level, target)`, `envelope(samples, sampleRate)`, `levelAt(env, seconds)`, `bob(level, t)`, `TalkingCastPlayer` type (`play(key, opts: { slow: boolean }): Promise<void>`, `url(key): string`, `element(): HTMLAudioElement | null`).
- Test first, per SPEC Test contract (values in SPEC were walked by hand: 0.65^4 = .1785 < .18 so `closed` at step 4, 0.65^10 = .0135 and 0.65^11 = .0088 so rest at step 11).
- Verify: `pnpm vitest --run src/lib/components/TalkingCast.test.ts --maxWorkers=2`.

## Task 3 [AC1][AC2][AC3][AC4] Component
- First red test: SSR render of the component (no repo component imports a png yet; if Vite does not resolve it under vitest, fix that first). Check the `test:coverage` margin (global lines 67): `$effect` bodies are not covered by SSR.
File: `src/lib/components/TalkingCast.svelte` (new)
- Props `{ clip: string; player: TalkingCastPlayer; label: string }`. Wrapper `aspect-ratio: 600/420; overflow:hidden`; three absolutely placed `<img>` (`top: -14.2857%`, width 100%) with the `on` class on `frame`; picture `<button tabindex="-1" aria-hidden="true">` and a ▶ `<button type="button" aria-label={label}>` using icon `fill-speaker-high` from the sprite.
- `$effect`: when not reduced, start one `requestAnimationFrame` loop; each frame: target = envelope level if `el && !el.paused && !el.ended && el.src === new URL(player.url(clip), location.href).href` else 0; `level = smoothLevel(level, target)`; set `frame` (only when changed) and the picture's transform `bob(level, t)`; the loop runs while the element plays our clip, whatever the level or decode state, and stops (clearing transform, frame 0) when the element is paused, ended or on another clip and `level < 0.01`; it restarts on the element's `play` event, and the element is re-read each frame and on tap (a lazily created one works from the first tap). Cleanup cancels the frame, removes the listener and resets `frame = 0` and the transform (reduced-motion flip mid-clip). `level` is a plain `let`; the decode cache `Map` lives in `talking-cast.ts`; images carry `alt=""`.
- Decode on the first `play` event for this clip (fetch + `OfflineAudioContext`, cached in a module Map by url); a failure caches `null` (mouth closed). Reduced motion skips all of it.
- Taps: count taps while `element()?.src` equals `new URL(player.url(clip), location.href).href` (else reset to 1); `player.play(clip, { slow: count % 2 === 0 }).catch(() => {})` on picture and ▶.
- Reduced: `frame` stays 0, no loop. Reads `prefersReducedMotion.current` inside the effect, so a runtime change re-runs it.
- Verify: SSR tests in `TalkingCast.test.ts` (three `<img>`, one `on`, one labelled button, `aria-hidden` picture); `pnpm check`, `pnpm lint`.

## Task 4 [AC1][AC2][AC3][AC4] Live proof (not committed)
Files: a throwaway route outside the repo tree's committed paths (`src/routes/dev-talk-scratch/+page.svelte`, deleted before commit) using a fake `player` over `prototype/talk/nihao.mp3` (copied under `static/` for the run only) and, once CHY-16 S1 is pushed, its real `play`.
- Run in a real browser (Chromium via agent-browser/playwright): normal motion (frame class changes while 你好 plays, transform appears, returns to `closed`/none within ~0.3 s after end); two taps → two `play` calls, `playbackRate` 1 then 0.5 with the real lib (rates 1, 0.5, 1; `preservesPitch` true; AC3 stays open until then); one run with the clip on another origin, CORS on and off (mouth moves / stays closed, clip plays either way); `emulateMedia({ reducedMotion: 'reduce' })` → no swap, no transform, ▶ plays.
- Verify: screenshots + the numbers into VERIFY.md.

## Mutation paths covered
- Play, replay while playing (loop already running: restart is a no-op), another clip playing (target 0), unmount mid-clip (cleanup), reduced-motion flip mid-clip (effect re-runs), decode failure (null envelope), `play()` rejection (caught).

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
export const frameFor = (l: number): 0 | 1 | 2 => (l < 0.18 ? 0 : l < 0.5 ? 1 : 2);
export const smoothLevel = (l: number, t: number) => l + (t - l) * (t > l ? 0.6 : 0.35);
export const bob = (l: number, t: number) => ({ y: -5 * l, deg: Math.sin(t / 140) * 1.4 * l });
```

## Rollback
`git revert` of the slice commits; delete `src/lib/components/` and `src/lib/assets/talk/`. No migration, nothing on R2.
