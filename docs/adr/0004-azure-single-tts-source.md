# 0004 — TTS: Azure Speech is the single audio source

Status: superseded by [0007](0007-lesson-voices-raw-azure-styles.md) for lesson clips (2026-11-10). Superseded [0003](0003-tts-engine.md). The syllable grid reverted to Tone Perfect recordings: see [0005](0005-syllables-are-tone-perfect-recordings.md).

## Context

ADR 0003 used three sources: OmniVoice for words and sentences, Tone Perfect human recordings for the syllable grid, and Azure for the 21 Primer chips and the 您好/您 override clips. Loc heard the mix and decided on 2026-11-09: "all should be from azure". One source gives one voice quality and one pipeline, and it drops the CC-BY-NC OmniVoice weights and the CC BY-NC-SA Tone Perfect clips from the shipped audio.

## Decision

Every clip in the audio manifest (sentences, words, the 1,620 syllable cells, the 21 chips) is rendered by **Azure Speech**, real-time REST, with a Dragon HD Flash voice.

**Voice map.** `content/cast.yaml` holds one Azure voice id per manifest voice, plus one shared rate:

| Voice | Azure voice | Note |
|---|---|---|
| `redpanda` | `zh-CN-Xiaoke:DragonHDFlashLatestNeural` | main voice, female |
| `takin` | `zh-CN-Yunfeng:DragonHDFlashLatestNeural` | male |

There are two cast voices. The default speaker (a sentence with no speaker, every word, syllable cell and chip) is `redpanda`, so audio keys are `sha256(text|redpanda)`. A `narrator` alias existed in the first Azure render so that keys `sha256(text|narrator)` stayed unchanged; it is gone, and the clips moved to `az2` under the new keys (below). A voice is a single config value, so a swap is an edit of one line (see Consequences for the cache).

**Plain and slowed inside the voice.** No `mstts:express-as` style and no phoneme tag. The speech is slowed by SSML `<prosody rate="-20%">`, not by ffmpeg `atempo`: Loc hears time-stretching as unnatural. -20% took 没关系。 from 0.65 s to 0.90 s raw (Xiaoke), and kept every probed reading. Dragon HD Flash often cuts the last sound off (raw last 10 ms within 30 dB of the peak in 56 of 265 takes, at -20% and at +0% alike). A trailing `<break>` (250 or 1000 ms, inside or after the prosody), `mstts:silence` and 48 kHz output did not stop it. The 250 ms break stays in the request because it helped on short words (12 of 15 takes clean, against 9 of 20 without it). The encode is the one shared step: 100 ms of silence added at both ends, then only digital silence (peak under -70 dB) beyond 100 ms is trimmed, loudnorm -16 LUFS, mono, 24 kHz, 48 kbps mp3. The first encode trimmed at -45 dB with no padding and cut 120 to 143 ms (median) of quiet onsets and decays off each clip (az2); the fixed clips live under az4. The client's 0.5× replay is unchanged.

**Syllable cells.** A marked syllable on its own cannot be sent to Azure, so each cell sends a carrier, chosen by `scripts/build-syllable-carriers.py` from CC-CEDICT and Unihan into `src/lib/audio-renderer/syllable-carriers.json`:

1. A standard hanzi (Unihan `kTGHZ2013`) whose only standard reading is that toned syllable, or whose default reading (`kMandarin`) it is in at least 90% of corpus uses (`kHanyuPinlu`). More corpus uses, then `kFrequency`, then HSK words rank first. 1,194 cells.
2. Otherwise a two-hanzi word (no erhua) whose first hanzi has that reading, rendered whole and cut to its first syllable at the intensity minimum (`scripts/cut-first-syllable.py`). 38 cells.
3. Otherwise no clip: 388 cells, mostly tone and syllable pairs Mandarin does not use (bia, fiao and tei among them). They stay in the manifest, the grid disables them, and `check:syllable-clips` skips them.

The 21 chips (`nǐ hǎo`, `duì bu qǐ`) send their hanzi from the hand-written `chips` map in the same file. This is the approach of the CHY-17 S1 probe, which Loc rejected for Yunxi in 0003 ("no better than 70 to 75% by F0"); it is used again because Loc chose one source over the recordings. The F0 classifier score (`check:syllable-clips --tones`) is reported, not used as a gate; Loc judges by ear. On the first render it agreed with the target tone on 521 of 1,232 cells (tone 1: 137 of 328, tone 2: 60 of 251, tone 3: 69 of 309, tone 4: 255 of 344). The classifier was fitted on OmniVoice and read only 74 to 91% of the Tone Perfect human clips, so the score is weak evidence either way, but tones 2 and 3 are where to listen first.

**您好 and 您.** 0003 replaced these with `sorry`-style clips because OmniVoice said ní. Plain Xiaoke at -20% says nín: Azure pronunciation assessment scored the `nin 2` phoneme 91 (您好) and 89 (您), against 92 and 83 for the `sorry` clips, and the F0 classifier reads 您 as tone 2 (the `sorry` clip read as 1). So both render plain like every other entry, the `overrides` map and `assets/audio-overrides/` are removed, and Loc's ear check is the final word.

**Gate.** The 0003 gate stays (`audioFaults`: not mostly silence, no clipping, at least 0.13 s of speech per hanzi), with a 0.15 s minimum length for syllable clips instead of 0.3 s. A take whose raw last 10 ms is within 40 dB of its loudest 10 ms is cut off and is requested again before the encode, eight takes at most. The accepted raw take is kept in `~/.capy/work/azure-raw/` and reused when the encode changes. A failing clip is requested again, three takes at most; HD output differs per request. The Whisper check is dropped: it ran in the OmniVoice worker and compared 您 as 你.

**Cache and URL.** R2 serves clips with `Cache-Control: public, max-age=31536000, immutable` and the service worker caches by URL, so overwriting a key never reaches a learner. Clips go under a versioned prefix, `az2/<key>.mp3`; `AUDIO_VERSION` in `src/lib/audio/version.ts` is the one constant the app and the scripts read, and `PUBLIC_AUDIO_BASE_URL` stays the origin. Old objects stay in place. `az2` was filled by a server-side copy of the approved `az1` objects, not a re-render (Azure output varies per request): each `az1/sha256(text|narrator).mp3` was copied to `az2/sha256(text|redpanda).mp3`, and objects already keyed `redpanda` or `takin` were copied under the same key. `az1` stays in place. `az4` replaced `az2` for words, sentences and chips after the edge fix: they were re-rendered from new takes, because the az2 raw takes were not kept. Syllable cells read their own prefix, `SYLLABLE_VERSION`.

**Renderer.** `pnpm render:audio <manifest>` renders and uploads every entry that has text for Azure; `--count only` prints the clip count and billable characters without calling anything. It skips keys already on R2, keeps every clip in a local cache (`~/.capy/work/chaiyo-audio/clips`, keyed by audio key and SSML) so a rerun or a new prefix does not bill Azure again, holds a lock file so one render runs at a time, and sends at most one request per 3.1 s (the F0 limit is 20 per minute) with `Retry-After` on 429. The first full render was 2,609 clips and 102,933 billable characters (a hanzi counts twice, and the prosody tag is billed).

### Licence

| Source | Terms | Commercial use | Read |
|---|---|---|---|
| Azure Speech, prebuilt Dragon HD Flash voices | Microsoft Product Terms | **not verified** | not read |
| OmniVoice, Tone Perfect | no longer shipped | n/a | n/a |

The Azure terms for storing and redistributing synthesized audio were not checked. Chaiyo stays non-commercial ("me + friends") until they are.

## Consequences

- One source, one adapter: `src/lib/audio-renderer/azure.ts`. The OmniVoice engine and the Tone Perfect staging script stay in the repo, unused by `render:audio` except `--from-dir`.
- Rendering needs `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION`, ffmpeg, and uv for the word cut. CI never renders.
- A voice, rate or carrier change needs a new prefix (`az2`, then `az4`) and a full upload, because published URLs are immutable. The local cache keeps unchanged clips, so only the changed voice is billed again.
- 388 cells have no clip. A cell gains one only when a carrier exists.
- Loc rejected Azure syllables once as not accurate enough; this ADR ships them because one source was his call, and the grid is the place to hear the risk.
