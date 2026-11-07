# CHY-18 S1 — discussion
ACs: AC1-AC4 · design lead CHAA-3 (thread of LOC-56) · 2026-11-07

## Answered here (≥80% rule, CREW.md)
- [AC1]Q: who is "Hachiware"? A: `redpanda`. Confidence 95%: Captain brief, CHY-14 STORY, only `redpanda-*` frames exist.
- [AC3] Q: who owns slow replay on the second tap? A: CHY-16's lib. Revised after CHY-16 S1 merged (`createPlayer().play(key, { slow? })`, `src/lib/audio/player.ts:8-10`): with `slow` omitted it alternates by key (1, 0.5, 1, 0.5) and restarts at 1× for another key, and rejections resolve to false. The component calls `player.play(clip)` once per tap and passes no `slow`; the earlier plan of counting taps here would have duplicated the lib. Confidence 90%: verified live with the real lib, rates 1, 0.5, 1.
- [AC3] Q: how does the component reach the lib's audio element and URL, which the lib keeps private? A: through the prop `player` (`play(key)`, `url(key)`, `element()`, typed in `talking-cast.ts`). The consumer builds it from `createPlayer({ base, createAudio })`, capturing the element in `createAudio` and rebuilding the url from `base`. Confidence 85%: needs no lib change; the shared default `play` export gives no element, so a step that wants the panda must use its own `createPlayer` or ask L3 to expose the element.
- [AC1]Q: how does the panda know it is the clip playing? A: the shared audio element's `src` must equal `player.url(clip)`; other clips (word chips) do not move her mouth. Confidence 85%.
- [AC1]Q: where does the loudness come from? A: decode the clip once with `OfflineAudioContext` and keep a 20 ms RMS envelope (prototype `envelope()`), read at `audio.currentTime`; no live analyser, so it works with CHY-16's plain `<audio>`/`Audio` element. Confidence 85%. Decode failure (offline, uncached) → no envelope → mouth stays closed, clip still plays.
- [AC4]Q: static frame in reduced motion — which? A: closed (the resting frame). Confidence 90%: AC2 also rests on closed. No envelope is decoded and no animation loop runs.
- [AC3]Q: label text? A: prop `label` (the ▶ button's accessible name); the step passes a paraglide string, so this lane touches no `messages/*.json`. Confidence 85%.
- [AC1]Q: three `<img>` or one `<canvas>`? A: three stacked `<img>` swapped by class, cropped by a wrapper (rows 60-480 of 720, as prototype CROP). Confidence 85%: renders on the server, so SSR tests see the static frame, and no canvas decode flash.

## Open — needs an answer before execute
None. CHY-16's real API is the one external fact; it only changes an adapter (SPEC Open assumptions).

## Locked (do not re-open)
- [AC1] Frame thresholds 0.18 / 0.5, smoothing 0.6 up / 0.35 down, bob −5 px and 1.4° (prototype `talk.js:37-43`).
