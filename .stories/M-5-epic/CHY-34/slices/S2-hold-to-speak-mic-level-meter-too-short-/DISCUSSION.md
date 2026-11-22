# CHY-34 S2 — discussion
ACs: AC2, AC3, AC5  ·  Base: chaiyo@a65f4297 (wave-1 stack tip, `origin/CHY-40-S1`)

## Current behaviour (verified, with anchors)
- [AC2] No mic code in `src/`; only `prototype/l6-listen.html:138-209` (`speakStep`: getUserMedia + AnalyserNode, 28 bars, `ms < 700` → too-short copy).
- [AC2] Runner CTA is click-only: `Cta` = `{label, disabled, caret, hint, onclick}` (`src/lib/lesson/types.ts:13-19`); `StepRunner.svelte:76-82` passes only `onclick` to `Button`; `Button.svelte:11` accepts only `onclick`. A press-and-hold on the bottom red button is impossible today.
- [AC2] Union is one line: `src/lib/lesson/steps.ts:4`; views resolve by file name (`steps.ts:8-15`), so `steps/Speak.svelte` exporting `kind = 'speak'` is picked up with no other engine edit.
- [AC2] Content has the items: `content/lessons/hsk1/h1-01.yaml:117-124` — `readAloud` q-h1-01-s01 → sentence s-h1-01-06 (不客气。 bù kèqi, spoken bú kèqi); `freeAnswer` q-h1-01-f01. Schema `src/lib/content/schemas.ts:176-180`.
- [AC5] `StepRunner.svelte:27-34` `next()` advances / calls `onfinish` with or without an Answer — a skip that calls `next()` completes the section.
- [AC3] No `MediaRecorder`, `fetch` or storage write exists for audio anywhere (nothing to remove).

## Answered here (no human needed)
- [AC2] Q: section key? A: `listenSpeak` — the key in `curriculum.json:18` and `schemas.ts:204`, which is the `[section]` param value.
- [AC2] Q: which items does S2 show? A: only `readAloud` + `freeAnswer` items (h1-01: s01, f01, f02 → 3 speak steps). Tone/choice listening items are CHY-34.S1 (wave 3); it adds them to the same component.
- [AC5] Q: does a skip still close the section? A: yes — CHY-30.S2 SPEC records `next()` with no answer as `correct: null`, one Attempt per step, and a run closes at `of` answers (CHY-30.S2 `SPEC.md:28`, `study/progress.ts:36-43`).
- [AC2] Q: how is the mic tested under jsdom? A: `vi.stubGlobal` for `navigator.mediaDevices.getUserMedia` and `AudioContext` (client project is jsdom, `vite.config.ts:60-68`); no injection seam needed.
- [AC2] Q: hold timer start? A: at mic-on (stream acquired), as the prototype does (`l6-listen.html:182`); a release before mic-on counts as under 0.7 s → too-short copy.
- [AC3] Q: how is "never uploaded" proven? A: the step never constructs `MediaRecorder`, keeps no sample buffer beyond one analyser frame, and stops every track + closes the AudioContext on release/unmount. Tests spy `fetch`, `navigator.sendBeacon`, `MediaRecorder`, `localStorage.setItem` and assert zero calls.
- [AC5] Q: what counts as "mic blocked"? A: any getUserMedia rejection (NotAllowedError, NotFoundError) or `navigator.mediaDevices` undefined (insecure context) → skip state.
- [AC5] Q: what does the step pass to `next()`? A: nothing — speaking is not graded (`STORY.md` out of scope E11); the runner records `correct: null` (CHY-30.S2).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC2] | who adds the hold hook to the red CTA | **C** — CHY-34.S2 adds optional `Cta.hold = { onpress(): void; onrelease(): void }` in `types.ts` + forwarding in the `StepRunner.svelte` CTA snippet; CHY-30.S2 leaves those lines alone | Loc via coordinator, 2026-11-16 |
| 1 | — | how the section is reached | every section renders via `[section]/+page.svelte` → map in `[section]/sections.ts` (CHY-33.S1 creates); S2 adds its `listenSpeak` line + component; lesson data = `data.lesson` (LessonContent) from `lesson/[id]/+layout.ts` (CHY-25.S2), no own `catalog.lesson()` | Loc via coordinator, 2026-11-16 |

## Open — needs an answer before spec
(none — Q1 answered, see Resolved)

## Files outside the lane (wave rule, Loc 2026-11-16: owner of the AC makes the minimal edit, rebases on that lane's tip, lands after it)
| File | Lane | Edit | Why |
|---|---|---|---|
| `src/lib/lesson/types.ts:13-19` | engine (CHY-30.S2) | add optional `Cta.hold` | [AC2] press/release on the red button (Q1 = C) |
| `src/lib/lesson/StepRunner.svelte:75-84` | engine (CHY-30.S2) | CTA snippet forwards pointer + Space/Enter to `hold` | [AC2] same |
| `src/lib/lesson/steps.ts:4` | engine | one union line `\| Speak` | [AC2] new kind (allowed by brief) |
| `src/routes/(app)/lesson/[id]/[section]/sections.ts` | CHY-33.S1 creates | one `listenSpeak` line | [AC2] section reachable; rebase on CHY-33.S1 |
| `src/routes/dev/speak/+page.svelte` | none (new) | proof route | [AC2][AC5] real-browser check without content |
| `messages/vi.json:135` | all | `lesson_speak_*` block after `lesson_review_hint` | [AC2][AC5] copy |

## Locked (do not re-open)
- Slice split + wave plan approved (M-5 refinement, 2026-11-13). Epic Q1–Q8 = option A.
