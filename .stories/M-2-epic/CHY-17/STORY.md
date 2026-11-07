# CHY-17 — Pinyin syllable clips

## Goal (business why, 1-2 sentences)
Give every Pinyin syllable in each of the 4 tones a real recorded clip on R2, and prove a learner tapping a Pinyin Table cell hears that tone, so the Primer (CHY-37) and the Pinyin Table (CHY-40) teach tones by ear.

## Context an agent can't derive from code
- The ticket says "~1,600 clips" and "prototype used edge-tts". Facts on main fd2b67a: `pnpm import:content content --sink bundle --only lessons/hsk1` writes 2,997 manifest entries, **1,641 of kind `syllable`** = 405 rows of `content/syllables.yaml` × 4 tones = **1,620** single-syllable cells + **21** multi-syllable Primer chips (`nǐ hǎo`, `duì bu qǐ`, …). All are voice `narrator`.
- A syllable entry's `hanzi` is **toned pinyin text** (`bā`), and its key is `sha256("bā|narrator")` (audio.ts:15, :70-84). There is no hanzi for it, so the renderer must turn pinyin into something an engine reads with the right tone. That mapping belongs to the renderer (CHY-15, lane L2); S1 measures whether it works and asks L2 for the fix if not.
- Engine is **OmniVoice**, local on Loc's Mac, so S1's render costs $0 (WAVE-PLAN Q3 table does not apply). OmniVoice accepts pinyin with tone numbers inside the text (`ZHE2`, k2-fsa/OmniVoice README, "Pronunciation control").
- **Fact from CHY-14's tone probe (2026-11-08, 45 clips scored by F0):** an isolated syllable cannot be forced reliably in OmniVoice under any form: uppercase numeric (XING2) 4/9, toned marks 3/9, lowercase numeric 1/9, hanzi + uppercase 1/9, plain unambiguous hanzi 5/9. So the 1,620 cells cannot be trusted just because they rendered; the tone check is part of this story's clip check, and the text form is the in-sentence form or a hanzi carrier checked by ear (S1 DISCUSSION Q1).
- ADR 0003 and `content/cast.yaml` are on main: narrator = `narrator-1` (seed 1403, pace 0.75); per-item `say` + `seed` overrides keyed by audio key are the fix for a wrong cell. This story proposes override rows; it never edits `content/**`.
- Base speech pace is slowed in the shared ffmpeg encode with `atempo`, pinned per voice in the voice map (CHY-14 S2 gives the values). Contours are measured in semitones relative to the clip's own median, so they do not depend on that pace.
- Cast: `narrator` is the third voice (audio.ts:49); the backlog's Hachiware/Momonga do not appear in this story.
- Loc's answers (2026-11-07): Q4 new R2 bucket + r2.dev public URL, CORS GET; Q5 A (bundle carries `audioKey`, a CHY-8 follow-up outside M-2); Q6 A (one dev-only `/dev/audio` route).

- **Wave E gate (wording for WAVE-PLAN, which this story does not edit):** CHY-17 S2 starts after CHY-16 S2 (the `/dev/audio` route and its dev guard) is merged or stacked, not after CHY-16 S1 alone; CHY-16 S1 (`play`) is on main as of 6c0f661.

## Locked decisions (BA/Loc already ruled — never re-open)
- Key `sha256(text|voice)`, normal speed only; slow = client replay at 0.5× (content-schema.md:331).
- Clip voice = `narrator` (AC3 "in the narrator voice").
- Tone correctness of AC4 is judged by Loc's ear.

## AC index
| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Every syllable in every tone has a clip | high | S1 |
| AC2 | A missing clip fails the check | high | S1 |
| AC3 | A cell plays the right tone | high | S2 |
| AC4 | Tap test on 20 random cells | medium | S2 |

## Out of scope
- The renderer, R2 upload, bucket, voice pinning (CHY-15, CHY-14); the player lib (CHY-16); the real Pinyin Table and Primer screens (CHY-40, CHY-37).
- `audioKey` for syllable cells in the bundle (CHY-8 follow-up, see S2 DISCUSSION "Request").
