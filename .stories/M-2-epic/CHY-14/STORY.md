# CHY-14 — TTS spike: VoiceStudio vs Azure

## Goal (business why, 1-2 sentences)
Pick the TTS engine by ear on the readings that break TTS (polyphones, 一/不, 3-3 sandhi) and fix one voice per speaking Cast member, so every clip the Audio Renderer (CHY-15) makes has correct tones and a stable voice.

## Context an agent can't derive from code
- The ticket text predates cast v2. **Hachiware = `redpanda`, Momonga = `takin`** (the two speaking Cast members, CONTEXT.md:177, lint/types.ts:46-48); lint flags `hachiware` as an unknown Cast id (lint.test.ts:174-179). The third voice is `narrator` (audio.ts:49).
- `docs/adr/0002-*` is taken (lesson bundles), so the ADR is **`docs/adr/0003-tts-engine.md`**.
- "VoiceStudio" (github.com/debpalash/VoiceStudio, AGPL-3.0 app) hosts many engines. Its default, OmniVoice, has **CC-BY-NC** weights; CosyVoice 3 has Apache-2.0 weights but no built-in voices (needs a reference clip). Which engine is "VoiceStudio" in this spike is Loc's pick: WAVE-PLAN Q1, Q2.
- Azure needs a Speech resource + key on the Mac (WAVE-PLAN Q3). One spike render is about 341 billable chars (110 hanzi × 2 + 27 punctuation + 94 phoneme markup; `<speak>`/`<voice>` tags are not billed), under 0.1% of the free F0 month.
- The renderer sends **hanzi** to the engine; the engine does its own sandhi. Our derived `spoken` is display only. So the spike judges the engine on plain hanzi, plus 2 forced-reading items (the renderer's split-Word case, C5 `reading`).
- Prototype voices (edge-tts, scripts/build-lesson-media.py:15): redpanda Xiaoxiao, takin Xiaoyi, narrator Yunxi.
- VoiceStudio runs locally (Apple Silicon, MPS), so S1 executes on Loc's Mac.

## Locked decisions (BA/Loc already ruled — never re-open)
- Audio key `sha256(hanzi|voice)`, normal speed only; slow = client replay at 0.5× (content-schema.md:331, C5).
- Speaking Cast = redpanda, takin; dialogue voices are fixed per member (CONTEXT.md:177, lint check 9).
- Chaiyo is "me + friends, not commercial" today (NOTES.md:3). The ADR still records commercial-use status per AC4.

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Same 30 sentences rendered by both engines | high | S1 |
| AC2 | Test set covers the readings that break TTS | high | S1 |
| AC3 | Loc picks by ear on a shuffled sheet | high | S1 |
| AC4 | ADR records choice, licence status, Cast voice map | high | S2 |
| AC5 | Open decision 3 closed, cast.yaml gets voice ids | high | S2 |

## Out of scope
- The renderer, R2 upload, keys (CHY-15); the player (CHY-16); the 1,641 syllable clips (CHY-17); Mock Test exam voices; Seedance video.
- A second TTS adapter in code: architecture.md:44 adds one only if the spike says so.
