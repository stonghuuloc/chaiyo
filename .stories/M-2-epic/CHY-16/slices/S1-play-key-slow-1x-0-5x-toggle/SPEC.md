# CHY-16 S1 — spec
ACs: AC1, AC2, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a)

## Behaviour
- [AC1] `play(key)` with no option on a key that is not the last played key sets `playbackRate` 1 (also defaultPlaybackRate, so the rate survives the src load; Safari resets it otherwise), starts the clip from 0, and returns a promise that resolves `true`. Calling `play(key)` again on the same key gives rates 0.5, 1, 0.5 on taps 2, 3, 4 (odd tap = 1, even tap = 0.5).
- [AC1] Every play sets `preservesPitch = true` before `play()` (and webkitPreservesPitch for older WebKit) and sets `src` to `<base>/<key>.mp3`.
- [AC1] `play(key, { slow: true })` plays at 0.5, `{ slow: false }` at 1, whatever the history. The next bare `play(key)` on that key then flips it (after `slow: true` it plays at 1).
- [AC2] After taps on "11" ×2 (0.5×), `play("12")` plays "12" at 1×, and `play("11")` then plays "11" at 1×, not 0.5×. Any tap on a different key than the last resets that key's count to 1.
- [AC2] A tap restarts a clip that is still playing (`currentTime = 0`), so rapid taps never queue and only the last clip sounds.
- [AC4] When the audio element's `play()` rejects (clip not cached, offline, 404, decode error, autoplay refusal) `play()` still resolves, with `false`. It throws nothing and leaves no unhandled rejection or uncaught error. An element error event needs no handler; it is not an uncaught error.
- [AC4] A failed play resets the toggle (`last` forgotten), so the retry of that clip starts at 1×. A rejection from an older clip (superseded by a newer tap, `AbortError`) never resets the newer clip's state.
- [AC4] A failure queues nothing: no second `play` call is made on the element and no retry timer is started.
- [LOCK] iOS unlock: the shared element is created lazily inside the first `play()` call (never at import, so prerender/SSR is safe), reused for every later clip, and `element.play()` is called synchronously inside `play()` (no `await` before it), so it runs inside the tap's user gesture. iOS then lets later clips on that element play without another gesture. The on-device proof is S2/AC5.
- [CHORE] `src/lib/audio/index.ts` re-exports `play` and `createPlayer`; `pnpm check`, `pnpm lint`, `pnpm test` stay green; coverage thresholds hold.

## Not this slice
- AC3 (offline from the service-worker cache) and AC5 (iOS Safari on device) → S2. Here AC4 is proven with a rejecting element and with a real unreachable URL in a browser.
- The R2 base URL setting, `/dev/audio`, any `playing`/`ended` state → S2 or CHY-18/M-5 as needed.

## Seam
`src/lib/audio/player.ts`: `createPlayer(options?: { base?: string; createAudio?: () => HTMLAudioElement })` → `{ play(key, opts?) }`, plus the default `play`.

## Test contract
- [AC1] vitest, fake audio element: 4 bare taps on one key → `playbackRate` seen at `play()` time = 1, 0.5, 1, 0.5; `preservesPitch` true and `src` ends `/<key>.mp3` each time.
- [AC1] vitest: `slow: true` → 0.5 on a first tap; then bare tap → 1; `slow: false` after 0.5 → 1, then bare tap → 0.5.
- [AC2] vitest: "11","11","12","11" → 1, 0.5, 1, 1.
- [AC2] vitest: second tap while the first is pending sets `currentTime` back to 0 and calls `play` again on the same element (one element ever constructed).
- [AC4] vitest: rejecting `play()` (NotSupportedError) → resolves `false`; `vi.fn` unhandledRejection listener never fires; a retry of the same key plays at 1×; a stale AbortError from clip A after a tap on B leaves B's toggle intact (B tapped twice → 0.5).
- [LOCK] vitest: `play` is called on the element before `play()` returns (spy call order), and the module imports with no `Audio` global defined.
- [AC1,AC4] browser, real Chromium on a served scratch page with `prototype/talk/nihao.mp3`: taps 1-4 report `playbackRate` 1, 0.5, 1, 0.5, `preservesPitch` true, and `ended` fires on tap 1 (clip is played, `currentTime` > 0); after `context.setOffline(true)`, a never-loaded key resolves `false` with zero `pageerror` and zero `unhandledrejection`.

## Open assumptions
- [AC1] The ticket's "11"/"12" are placeholder keys, not a format the player enforces (STORY context). If real keys needed validation, only `urlFor` changes.
- [LOCK] iOS Safari keeps an element unlocked after one gesture-initiated `play()` and a later `src` change (WebKit autoplay policy, long-standing). Each tap is its own gesture, so callers (CHY-18, M-5) must call play() synchronously in the click handler. If the device shows otherwise, S2 swaps to a Web Audio buffer (needs navigator.audioSession.type = playback or the silent switch mutes it); cost = one more file in `src/lib/audio`. Proven only in S2.
