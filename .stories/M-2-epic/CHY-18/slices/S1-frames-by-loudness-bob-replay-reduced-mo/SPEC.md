# CHY-18 S1 — spec
ACs: AC1, AC2, AC3, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a)

## Behaviour
- [AC1] `frameFor(level)` returns `closed` for level < 0.18, `half` for 0.18 ≤ level < 0.5, `open` for level ≥ 0.5. Ticket rows: 0.05 → closed, 0.30 → half, 0.80 → open.
- [AC1] `<TalkingCast clip player label />` renders three frame images (`closed`, `half`, `open`) from the three art files; exactly one has the `on` class, and it is the one `frameFor(smoothed level)` names.
- [AC1] The level fed to the frame is the clip's loudness at `audio.currentTime`: a 20 ms RMS envelope of the decoded clip, scaled so the loudest window ×1.3 is capped at 1. `envelope()` of samples `[0, 0, 1, 1, 0.5, 0.5]` at 100 Hz returns `[0, 1, 0.65]`; an all-zero clip returns all zeros.
- [AC1] The displayed level rises toward the target by 0.6 of the gap per animation frame and falls by 0.35 of the gap. With a steady target of 0.30 the stage shows `half` by frame 2 (levels 0.18, 0.252); with a steady target of 0.80 it shows `open` by frame 2 (0.48, 0.672).
- [AC1] `player.element()` is read on every animation frame and on every tap, so a lazily created element (null at mount) works from the first tap.
- [AC1] The panda reacts only while `player.element()` is playing a clip whose `src` is `player.url(clip)`. Another clip playing, a paused element, or a finished one counts as level 0.
- [AC2] The picture's transform is `translateY(-5·level px) rotate(sin(t/140)·1.4·level deg)`: at level 1 it moves up 5 px, at level 0 it is the identity.
- [AC2] When the clip ends, the level falls to 0 and the stage shows `closed` with no transform within 11 frames of the end (0.65^11 < 0.01), and the animation loop stops, but only once the element is paused, ended or on another clip: while our clip still plays, the loop keeps running even when the envelope is not decoded yet or the level is 0 (quiet gap, decode in flight).
- [AC3] Tapping the picture or the ▶ button calls `player.play(clip)` once, with no `slow` option; CHY-16's lib then plays tap 1 at 1×, tap 2 at 0.5×, tap 3 at 1×, and restarts at 1× when another clip played in between.
- [AC3] The ▶ button is a real `<button type="button">` with `aria-label={label}`; the picture is a click target hidden from assistive tech (the ▶ is the accessible control).
- [AC3] A rejected or never-resolving `play()` leaves the component working: it neither throws nor sticks the mouth open.
- [AC4] With `prefers-reduced-motion: reduce`, the stage shows the `closed` frame statically while the clip plays: no frame swap, no transform, no envelope decode, no animation loop. ▶ and picture taps still call `player.play(clip, { slow })`, alternating as in normal mode.
- [AC4] The reduced and normal modes use one DOM: switching the preference at runtime stops or starts the loop without remounting, and switching to reduced mid-clip resets the stage to `closed` with no transform.
- [NFR] The three frames are copied as `src/lib/assets/talk/redpanda-{closed,half,open}.png` (`half-m`, `open-m` lose the `-m`), byte-identical to `prototype/talk/`.
- [NFR] No audio is decoded until the clip first plays; a decode failure (offline, uncached) keeps the mouth closed and throws nothing.

## Not this slice
- The 0.5× playback itself, key → URL, offline cache, iOS unlock → CHY-16. Listening step layout and autoplay → CHY-34 / M-5. Wiring into `/dev/audio` → CHY-16 S2 owns that route; this slice proves the component on a throwaway page.

## Seam
`src/lib/components/talking-cast.ts` (pure: frames, level, envelope, bob) and `src/lib/components/TalkingCast.svelte` (DOM, loop, taps).

## Test contract
- [AC1] vitest `TalkingCast.test.ts`: `frameFor` over 0.05/0.30/0.80 and the edges 0.18 → half, 0.5 → open, 0.1799 → closed; `envelope` on the `[0,0,1,1,0.5,0.5]` fixture → `[0, 1, 0.65]`; steady 0.30 → `half` at step 2 (not asserted at exactly 0.18), steady 0.80 → `half` at step 1 and `open` at step 2, of `smoothLevel`; `levelAt` past the end → 0.
- [AC1] SSR: output holds three `<img>` with `on` on exactly one.
- [AC2] `bob(1, 0)` → `{ y: -5, deg: 0 }`, `bob(0, t)` → `{ y: 0, deg: 0 }`; from level 1, target 0: below 0.01 at step 11 and not at step 10; `closed` by step 4.
- [AC3] vitest: `isPlaying` matches the element `src` against `player.url(clip)` resolved to an absolute URL (relative url, other clip, null element). Live with the real `createPlayer` from `#lib/audio`: `playbackRate` 1, 0.5, 1 and `preservesPitch` true (run 2026-11-07: 1, 0.5, 1, true).
- [AC4] Live: emulate reduced motion, play the clip: `closed` stays `on`, picture has no transform, `requestAnimationFrame` count stays 0, ▶ plays. Normal mode, same clip: the frame changes and a transform appears.

## Open assumptions
- [AC3] The real lib hides its element and base. The consumer builds the `player` prop from `createPlayer({ base, createAudio })`, capturing the element in `createAudio`. If L3 later exposes the element, only that adapter changes. `element()` may be null until the first tap: a tap re-attaches the listener.
- [AC1] Envelope decode needs CORS on cross-origin clips (R2; WAVE-PLAN Q4 already plans CORS GET for the app origin). Without it decode fails and the mouth stays closed while the clip plays. The live proof includes one run on a cross-origin URL with and without CORS.
