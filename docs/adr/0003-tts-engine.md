# 0003 — TTS engine: OmniVoice, voices pinned by reference clip

Status: accepted (2026-11-08)

## Context

The Audio Renderer (CHY-15) turns every manifest entry (`sha256(hanzi|voice)`, voices `redpanda`, `takin`, `narrator`) into an mp3. The engine has to say the readings that break TTS (polyphones such as 行, 一 and 不 sandhi, 3-3 sandhi) and keep one stable voice per speaking Cast member (the ticket names them Hachiware and Momonga; the Cast ids are `redpanda` and `takin`).

The spike (CHY-14) rendered a 30-item test set ([`spike/sentences.yaml`](../../spike/sentences.yaml)) with one engine, OmniVoice (`k2-fsa/OmniVoice`, local, Apple Silicon `mps`, float16). Loc ruled out Azure and CosyVoice before the spike, and the VoiceStudio app is dropped too: the spike calls OmniVoice directly through its Python package (`spike/omnivoice_render.py`), so VoiceStudio's AGPL app is not in the stack. The blind comparison is therefore between two ways of pinning an OmniVoice voice, not between engines:

- **design**: a text voice prompt ("female, teenager, moderate pitch") plus a fixed seed.
- **refclip**: one reference clip per voice, rendered once from the prompt and reused as `ref_audio` for every item.

Both arms went through one ffmpeg encode (loudnorm -16, mono, 24 kHz, 48 kbps). Loc listened to all 30 rows on a shuffled sheet.

## Decision

TTS is a direct call to **OmniVoice**. Every voice is pinned by a **reference clip**.

`pnpm -s tts:spike tally spike/results.json` prints:

```
design 2 · refclip 28 · winner refclip · takin takin-3 · narrator narrator-1
```

Full picks and Loc's notes: [`spike/results.json`](../../spike/results.json).

**How a voice is pinned.** A voice prompt alone gives a different speaker on every run, so a voice is defined by its audition clip:

1. Render the audition line (`voices.audition` in `spike/sentences.yaml`) from the voice prompt with the voice's seed. For the same text, prompt, seed and model, OmniVoice gave bit-identical audio twice in one process and across two processes on `mps` (checked 2026-11-08).
2. Use that wav as `ref_audio` (with the audition line as `ref_text`) for every item of that voice, with the voice's seed as the starting seed.

`content/cast.yaml` holds the prompt, seed and pace of each voice, so a new machine regenerates the same reference clip. The renderer should also keep the three reference wavs next to the clips (R2), because a torch or model upgrade may change the bits a prompt and seed produce.

**Base pace.** Output length cannot be controlled through OmniVoice: `speed` and `duration` gave erratic lengths (他在银行工作。 took 1.21 s at speed 0.85 and 2.29 s at 0.75, and speed 0.85 once appended an extra phrase). Clips are rendered at the default pace and slowed in the shared encode with ffmpeg `atempo` (pitch kept), the same trick as the client's 0.5× replay. Loc picked the factor per voice on a listening page: redpanda 0.85, takin 0.85, narrator 0.75. At default pace narrator and takin spoke at about 0.15 s per syllable and redpanda at 0.22, which Loc heard as too fast; natural Mandarin is about 0.2-0.25. The key stays `sha256(hanzi|voice)`; slow play is still the client at 0.5×.

**Output gate.** `pnpm tts:spike render` accepts a clip only when it passes these checks (`scripts/tts-spike.ts`): at least 0.13 s of voiced speech per hanzi (the clip length minus every silence of 0.1 s or more at -35 dB, so a pause inside a clip does not count as speech), no clipping, not mostly silence, and, for rows that send plain hanzi, Whisper (`small`) hears the expected hanzi (digits read as hanzi; 您 compared as 你, so Whisper cannot catch a 您 read as 你; rows 8, 28 and 29 are not checked this way). A clip that fails is rendered again with a new seed: the base seed plus 1000, then plus 3000, then plus 6000, four attempts in total. A voice audition clip and a row with its own pinned seed are never retried, because their seeds were chosen on purpose. The rushed clips Loc called "broken" (对不起！, 不客气。, 我去银行。, 他在睡觉。) were not garbled: Whisper read them correctly, but they came out at 0.11-0.12 s per syllable, which the speech-rate check and the slower pace now cover. In the final render the Whisper check rejected rows 10 (我去银行。 heard as 我去一行) and 30 (马 heard as 妈) at the base seed 1403 and accepted both at 2403.

**Forced readings (#28, #29, 行 as háng and xíng).** The design arm sent the readings as toned pinyin (`háng`, `xíng`, `spike/design/inputs.json`); the refclip arm sent `HANG2` and `XING2`. OmniVoice documents pinyin with tone digits in uppercase, inline (`打ZHE2出售`). Sent alone, every form of a single syllable was unreliable: a probe of 9 syllables × 5 forms (45 clips, F0 contour on the voiced span) matched the target tone for the documented uppercase form 4 of 9, lowercase digits 1 of 9, hanzi plus uppercase 1 of 9, toned marks 3 of 9, and the plain unambiguous hanzi 5 of 9; two clips (靶 and 马MA3) had no voiced run long enough to score ([`spike/tone-probe/results.json`](../../spike/tone-probe/results.json)). Loc heard neither forced reading in rows 28 and 29, in either arm (`said: []`). The refclip control is #28 `HANG2`, #29 `XING2` (`spike/refclip/inputs.json`). CHY-15 should not rely on forcing a reading of an isolated syllable; force inside a sentence and check by ear.

**Rare and sandhi-prone syllables need an ear-checked seed.** A forced reading is not reliable by itself. 您好 should say nín, but of 12 candidates (4 text forms × 3 seeds) Loc heard nín in one: `NIN2HAO3！` with seed 7. Plain 您好！, `NIN2好！`, `NIN2 HAO3！` and the other seeds of `NIN2HAO3！` all said ní. The rule for the pipeline: an item can set the text form it sends (`say`) and its own seed (`seed`) in `spike/sentences.yaml`, and the renderer must keep both in its manifest or voice map. A pinned item is not retried with another seed, because the seed was chosen by ear. Row 8 is rendered that way and is bit-identical to the clip Loc approved. Where CHY-15 stores these per-item overrides is its call; until it does, they live in `spike/sentences.yaml` (row 8) and in the `overrides` map of `content/cast.yaml`, keyed by the audio key `sha256(hanzi|voice)`, so a renderer that reads only `cast.yaml` still finds them.

### Licence

| Engine | Weights licence | Commercial use | Source | Read |
|---|---|---|---|---|
| OmniVoice (`k2-fsa/OmniVoice`) | CC-BY-NC (the code is Apache 2.0) | **no** | [model card](https://huggingface.co/k2-fsa/OmniVoice) | 2026-11-08 |
| Azure TTS | not spiked | n/a | n/a | n/a |
| CosyVoice 3 | not spiked | n/a | n/a | n/a |

Loc accepted the non-commercial CC-BY-NC weights on 2026-11-07 (M-2 design Q1, answer A). Chaiyo is "me + friends, not commercial" today (NOTES.md:3) and stays non-commercial while it uses them. Charging money or showing ads means replacing the engine and re-rendering every clip.

### Voice map

| Voice | Ticket name | Voice id | Voice prompt | Seed | Base pace | Restore |
|---|---|---|---|---|---|---|
| `redpanda` | Hachiware | `redpanda-1` | female, teenager, moderate pitch | 1401 | 0.85 | render the audition line from the prompt and seed, reuse as reference |
| `takin` | Momonga | `takin-3` | male, young adult, high pitch | 1402 | 0.85 | same |
| `narrator` | none | `narrator-1` | male, middle-aged, moderate pitch | 1403 | 0.75 | same |

The same ids are in [`content/cast.yaml`](../../content/cast.yaml) and `spike/sentences.yaml` (`voices.chosen`, `voices.pace`).

## Consequences

- The renderer runs on Loc's Mac only (Apple Silicon, `mps`); CI cannot render. Clips live on R2, so the app and CI only read them.
- One adapter: `docs/architecture.md` adds no second TTS seam. A switch to Azure or CosyVoice is a new ADR.
- The renderer needs the gate above, a retry with a new seed on failure, and the recorded seed and text form per key.
- Short clips are the weak spot: OmniVoice's docs warn that 1-2 second clips are unreliable without reference audio, and single syllables stayed unreliable with it. CHY-17's 1,641 syllable clips need their own probe.
- Commercial use is a blocker (CC-BY-NC weights).
