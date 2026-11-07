# CHY-18 S1 — picture
ACs: AC1, AC2, AC3, AC4 · Spec rev 1 · Sub-task LOC-56

## What this slice is about

In a listening step the red panda says the clip: her mouth swaps between three pictures as the sound gets louder, she bobs a little, and a tap on her or on ▶ plays the clip again (second tap slow). With "reduce motion" on she stays one still picture. It is built and proven here without the M-5 step screens.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-18` (stacked on CHY-16 S1) |
| Lands | `TalkingCast.svelte`, pure `talking-cast.ts`, 3 frames, test |
| Does not land | player, offline cache (CHY-16); listening step + autoplay (CHY-34) |

## **AC1** — verbatim

> Scenario Outline: Mouth frame follows clip loudness
> Given the Hachiware art has 3 frames: closed, half, open
> And a clip is playing
> When the clip loudness (0 to 1) is <level>
> Then the stage shows the <frame> frame
> Examples: 0.05 closed · 0.30 half · 0.80 open

## **AC2** — verbatim

> Scenario: Hachiware bobs with the sound
> Given a clip is playing and its loudness is high
> Then the picture moves up and tilts a little
> And when the clip ends the picture returns to rest with the closed frame

## **AC3** — verbatim

> Scenario: Tap replays
> Given the clip has finished
> When I tap Hachiware or the ▶ button
> Then the clip plays again
> And a second tap on the same clip plays it at 0.5×

## **AC4** — verbatim

> Scenario: Reduced motion shows a static frame
> Given my device has "reduce motion" turned on
> When a listening step plays its clip
> Then the stage shows one static frame, with no mouth swapping and no bob
> And the clip still plays and the ▶ button still replays it

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.svg"><svg viewBox="0 0 640 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Learner hears the clip and sees the panda talk" style="display:block;width:100%;font-family:sans-serif"><defs><marker id="a1-expected" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4a423a"/></marker></defs><rect x="10" y="30" width="130" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="75" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Learner opens step</text><line x1="140" y1="52" x2="170" y2="52" stroke="#4a423a" marker-end="url(#a1)"/><rect x="170" y="30" width="140" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="240" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Clip plays (step)</text><line x1="310" y1="52" x2="340" y2="52" stroke="#4a423a" marker-end="url(#a1)"/><rect x="340" y="30" width="150" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="415" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Mouth + bob follow sound</text><line x1="490" y1="52" x2="515" y2="52" stroke="#4a423a" marker-end="url(#a1)"/><rect x="515" y="30" width="115" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="572.5" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Rests, closed</text></svg></figure>

*Notice: mouth and bob are driven by the sound itself, and everything ends on the closed frame.*

## Requirement [AC1] [AC2] [AC3] [AC4]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.svg"><svg viewBox="0 0 640 110" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Requirement" style="display:block;width:100%;font-family:sans-serif"><defs><marker id="a2-requirement" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4a423a"/></marker></defs><rect x="10" y="30" width="130" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="75" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Loud → open mouth</text><rect x="160" y="30" width="150" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="235" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Panda bobs up and tilts</text><rect x="330" y="30" width="140" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="400" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Tap → hear again</text><rect x="490" y="30" width="140" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="560" y="57" text-anchor="middle" font-size="12" fill="#1d1814">Reduce motion: still</text></svg></figure>

*Notice: four independent behaviours; only the fourth switches the others off.*

## Solution [AC1] [AC2] [AC3] [AC4]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.svg"><svg viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Solution" style="display:block;width:100%;font-family:sans-serif"><defs><marker id="a3-solution" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#4a423a"/></marker></defs><rect x="10" y="20" width="150" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="85" y="47" text-anchor="middle" font-size="12" fill="#1d1814">Step / lib: player.play</text><line x1="160" y1="42" x2="200" y2="42" stroke="#4a423a" marker-end="url(#a3)"/><rect x="200" y="20" width="200" height="44" rx="6" fill="#fff" stroke="#948a7e"/><text x="300" y="47" text-anchor="middle" font-size="12" fill="#1d1814">audio element (CHY-16)</text><line x1="400" y1="42" x2="440" y2="42" stroke="#4a423a" marker-end="url(#a3)"/><rect x="440" y="20" width="190" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="535" y="47" text-anchor="middle" font-size="12" fill="#1d1814">talking-cast.ts (new)</text><rect x="200" y="100" width="200" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="300" y="127" text-anchor="middle" font-size="12" fill="#1d1814">TalkingCast.svelte (new)</text><line x1="300" y1="64" x2="300" y2="98" stroke="#4a423a" marker-end="url(#a3)"/><rect x="440" y="100" width="190" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="535" y="127" text-anchor="middle" font-size="12" fill="#1d1814">3 frames + bob + ▶ (new)</text><line x1="400" y1="122" x2="440" y2="122" stroke="#4a423a" marker-end="url(#a3)"/><rect x="10" y="100" width="150" height="44" rx="6" fill="#f6e1db" stroke="#c6301d"/><text x="85" y="127" text-anchor="middle" font-size="12" fill="#1d1814">Tap → play(key)</text><line x1="200" y1="122" x2="160" y2="122" stroke="#4a423a" marker-end="url(#a3)"/></svg></figure>

*Notice: the red boxes are new; the audio element is CHY-16's and only read, never owned.*

## Settled

| Decision | Why / source |
|---|---|
| Hachiware = `redpanda` | DISCUSSION.md Q1 · STORY.md |
| Lib alternates 1×/0.5× itself; the component calls `play(clip)` per tap | DISCUSSION.md · `src/lib/audio/player.ts:8-10` |
| Loudness from a decoded 20 ms envelope read at `currentTime` | DISCUSSION.md · `prototype/talk.js:10-22` |
| Reduced motion = closed frame, no loop, no decode | DISCUSSION.md · SPEC AC4 |
| Three `<img>` swapped by class, so SSR tests see the frame | DISCUSSION.md |
| `TalkingCastPlayer` prop (`play`, `url`, `element`) keeps the lane testable before CHY-16 | DISCUSSION.md |

## Carried elsewhere

| Item | Home |
|---|---|
| Shared default `play` gives no element: a step that wants the panda builds `createPlayer({ createAudio })` | DISCUSSION.md |
| Cross-origin clips need R2 CORS for the decode | WAVE-PLAN Q4 |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Copy 3 frames | AC1 | `src/lib/assets/talk/` | `shasum` pairs equal |
| 2 | Pure module | AC1 AC2 | `talking-cast.ts` | `TalkingCast.test.ts` |
| 3 | Component | AC1-AC4 | `TalkingCast.svelte` | SSR tests, `pnpm check`, `pnpm lint` |
| 4 | Live proof | AC1-AC4 | throwaway route, not committed | browser run, VERIFY.md |

Mutation paths: replay while playing, other clip playing, unmount mid-clip, reduced-motion flip, decode failure, rejected `play`. Rollback: `git revert`.

## Today → after

| | Today | After |
|---|---|---|
| Panda talks | prototype canvas only | Svelte component |
| Reduced motion | not handled | static closed frame |

## Out of frame

- Player and offline → CHY-16. Listening step, autoplay → CHY-34.
