# CHY-18 — Talking Cast component

## Goal (business why, 1-2 sentences)
In listening steps the red panda says the clip with a moving mouth, so listening feels like someone talking to the learner, and a tap on her or on ▶ plays it again (second tap slow).

## Context an agent can't derive from code
- The ticket text predates cast v2. **Hachiware = `redpanda`** (the speaking Cast member that talks in sentences; WAVE-PLAN, CHY-14 STORY). Art = `prototype/talk/redpanda-closed.png`, `redpanda-half-m.png`, `redpanda-open-m.png` (600×720, same face, only the mouth differs). `panda-closed.png` in that folder is another character and is not used.
- Port of `prototype/talk.js` (frame thresholds, smoothing, bob, crop) and the stage part of `prototype/step.js:44-52`.
- Slow replay (0.5× with pitch kept) is played by CHY-16's `play(key, { slow })`; this component decides per tap whether `slow` is set (first tap false, then alternating).
- Lane L5 (WAVE-PLAN): `src/lib/components/TalkingCast.svelte` + test + the three frames. vitest runs only the node `server` project (vite.config.ts:51-59: `src/**/*.test.ts`, no jsdom), so the testable logic is a pure sibling module `talking-cast.ts`, and the component is checked by SSR render plus a live browser run.
- M-5 listening steps (CHY-34) do not exist yet. WAVE-PLAN Q6 = A: the live proof runs on the `/dev/audio` route (L3 owns it) or a throwaway page; M-5 wires the component into steps.

## Locked decisions (BA/Loc already ruled — never re-open)
- Three frames, picked by the playing clip's loudness; thresholds and bob come from the prototype Loc has seen.
- Reduced motion = one static frame, no swapping, no bob; the clip and ▶ still work (ticket AC4).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Mouth frame follows clip loudness | high | S1 |
| AC2 | The panda bobs with the sound, returns to rest | high | S1 |
| AC3 | Tap replays; second tap plays 0.5× | high | S1 |
| AC4 | Reduced motion shows a static frame | high | S1 |

## Out of scope
- The audio player, key lookup, offline cache (CHY-16); the listening step layout and step engine (CHY-30, CHY-34); autoplay timing, which belongs to the step that calls `play`; a second Cast member (takin has no talk art); `/dev/audio` (CHY-16 S2).
