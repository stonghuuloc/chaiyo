# CHY-16 — Audio player lib

## Goal (business why, 1-2 sentences)
A learner taps a clip to hear it and taps again to hear it slowly, so they can catch every tone. It must also work on a phone with no signal after the lesson was opened, and on iOS Safari.

## Context an agent can't derive from code
- Port of `prototype/step.js:15-22` `play()`: one shared `Audio` element, `plays = key === last ? plays + 1 : 1`, `playbackRate = plays % 2 ? 1 : 0.5`, `preservesPitch = true`, `.catch(() => {})`.
- Clip key is `sha256(hanzi|voice)` (64 hex), normal speed only; slow = this player replaying at 0.5× (content-schema.md:331, architecture.md:33).
- Cast is `redpanda`, `takin` and the `narrator` voice. The backlog tickets still say Hachiware / Momonga; the ticket's key `"11"` is a placeholder, the player never parses a key.
- Clips live in a new R2 bucket behind an r2.dev URL with CORS `GET` for the app origin (Loc, Q4 A; a custom domain before launch). They are cross-origin to the app, so the service worker needs CORS responses and range handling (S2).
- The lesson bundle will carry an `audioKey` per sentence, word and chip (Loc, Q5 A). That is a CHY-8 follow-up slice outside M-2 (importer `bundle.ts`); CHY-16 does not edit the importer.
- One dev-only `/dev/audio` route proves the ACs that name M-5 screens (Loc, Q6 A); not in nav, not prerendered.
- `src/service-worker/**` is also CHY-25 territory; S2 keeps its edit to one new file plus two lines in `index.ts`.

## Locked decisions (BA/Loc already ruled — never re-open)
- Key rule, normal speed only, slow = client replay (above).
- Q4 A, Q5 A, Q6 A, Q7 A (WAVE-PLAN, Loc 2026-11-07).
- Engine OmniVoice and the voices are CHY-14's business; the player does not care.

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Tapping the same clip alternates normal and slow | high | S1 |
| AC2 | A different clip starts at normal speed | high | S1 |
| AC3 | Opened lessons play offline | high | S2 |
| AC4 | An uncached clip offline fails quietly | high | S1 |
| AC5 | Works on iOS Safari after the first gesture | high | S2 |

## Out of scope
- The talking-panda component and frame timing (CHY-18), the syllable grid (CHY-17), lesson-step screens (M-5), the importer's `audioKey` (CHY-8 follow-up), rendering or uploading clips (CHY-15).
- Any playing/ended state or button highlight: CHY-18 and M-5 need it first and extend the player then.
