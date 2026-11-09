# 0005 — Syllables are Tone Perfect recordings, not Azure

Status: accepted (2026-11-09). Amends [0004](0004-azure-single-tts-source.md) for the syllable grid only.

## Context

0004 moved every clip to Azure, including the toned-syllable cells, each rendered from a carrier hanzi. After listening on the preview, Loc found the Azure syllables unacceptable. The F0 classifier agreed: it matched the target tone on only 521 of 1,232 cells. An isolated toned syllable is the one thing a TTS voice does not say reliably.

## Decision

The 402 syllables of the `/dev/audio` grid (1,608 cells) play the human **Tone Perfect** recordings, speaker **FV3** (Michigan State University; six native speakers, FV1 to FV3 and MV1 to MV3). Loc first took FV2, found wrong or unclear tones on some syllables, listened to all six speakers on an ear page and picked FV3. As a cross-check, a per-speaker F0 tone classifier (fitted on half of each speaker's clips, tested on the other half) read 99.1% of FV3's 1,608 cells, the highest of the six (FV2 97.7%); Loc's ear is the judge. Each clip is encoded once as in 0003: no atempo, loudnorm -16 LUFS, 24 kHz mono, 48 kbps mp3. Everything else stays Azure: words, sentences, the 21 chips, 您好 and 您, and the cast voices.

**URL.** `az2/<key>.mp3` is served `immutable`, so overwriting an Azure syllable under its key would never reach browsers or the service worker that cached it. The FV3 clips go under a new prefix, `az5/`, for syllables only:

- `SYLLABLE_VERSION = 'az5'` in `src/lib/audio/version.ts` is the one constant. `SYLLABLE_BASE` and `playSyllable` read it, and the grid plays its cells with `playSyllable`. Chips, words, sentences and cast stay on `AUDIO_VERSION` (`az2`).
- `key = sha256(marked syllable|redpanda)`, the same key the grid already used.
- The clips were staged with `scripts/stage-recorded-clips.ts <corpus> FV3 <manifest> <dir>` and uploaded with `render-audio --from-dir <dir> --kind syllable --prefix az3`; nothing is rendered by Azure. The Azure syllable objects in `az2/` stay in place and unused by the grid.

**Prefix history.** The FV3 set was first uploaded to `az3/`. The o cells were then re-cut, and immutable caching means az3 cannot be overwritten, so the whole set lives at `az5/` (a server-side copy of az3 with o1 to o4 replaced). `az4/` belongs to the words, sentences and chips render. `az3/` stays in place and unused.

**The o cut.** The corpus `o` clips end in a closing glide toward u, so ō sounded like ōu. Measured on FV3, F1 falls 180 to 270 Hz from the vowel nucleus to the end of o1 to o4, like ou1 to ou3 (165 to 266 Hz). The o cells are cut to the front of the clip with a 15 ms fade-in and a 60 ms fade-out, then loudnorm like every other clip. Each cut keeps the tone readable by the F0 classifier. Cut ends in seconds on the original files, which start at 0.03: o1 0.45 (of 0.72), o2 0.71 (of 0.85), o3 0.60 (of 1.06), o4 0.40 (of 0.51). The glide is gone in tones 1 and 2 (F1 change -53 and -12 Hz) and reduced in tones 3 and 4 (-112 and -127 Hz): cutting further would remove the part of the contour that carries those tones. ou is unchanged.

**Single sounds.** The primer's single sounds (a o e, yi wu yu, the initials through their drill syllables, and so on) are all marked syllables, for example `bō`, `fó`, `rì`. They are cells of the grid, so they use the same az3 keys with no content change. `éi` and `lē` had no Azure clip in `az2/`; the recordings cover them.

**No-clip cells.** Tone Perfect has every cell of the 402 syllables. Cells that Azure had no carrier for (388 in 0004) are enabled. Only bia, fiao and tei (12 cells) have no recording; they are not in the grid and sit on the `NO_CLIP` allow-list in `recorded.ts`. `noClipReason` in `carriers.ts` no longer drives the grid.

**Gate.** `pnpm check:syllable-clips` probes cells at `az5/` and everything else at `az2/`, expects 0 missing apart from the `NO_CLIP` cells, and header-checks a sample of 20 public cell URLs (200, `audio/mpeg`, `immutable`). `--prefix` overrides the prefix for all entries.

### Licence

Tone Perfect is CC BY-NC-SA. Loc said to ignore licensing for now; Chaiyo stays non-commercial, and this is noted only so it is not lost.

## Consequences

- The grid is the only place where recordings and Azure voices mix. Syllables sound like the FV3 speaker, the rest like Xiaoke.
- A change to syllable audio needs another prefix (`az4`), for the same cache reason as 0004.
