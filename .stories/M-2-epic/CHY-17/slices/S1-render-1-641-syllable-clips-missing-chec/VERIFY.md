# CHY-17 S1 — verify
Branch CHY-17-S1 · run on Loc's Mac, 2026-11-08 · evidence files: Captain Drive `handoffs/CHY-17-S1-probe/`

## Task 0: the TTS text forms (gate 44 of 48 by F0)
| Engine and form | Match | Note |
|---|---|---|
| OmniVoice, frame `请读，BA3。` trimmed to the syllable (12 syllables × 4 tones) | 15 / 48 | 8.5 s per clip; `probe.py`, `C.jsonl` |
| OmniVoice, hanzi carrier (46 cells with a character) | 21 / 46 | `D.jsonl` |
| Azure Yunxi, sapi phoneme tag, original classifier | 20 / 48 | contours distinct by eye; Loc heard the first cells as toneless |
| Azure Yunxi, plain hanzi, Azure-fitted classifier | 32 / 46 | tone 1 read low or falling |
| Azure Yunxi, two-character word cut to the first syllable | 26 / 45 first word, 35 / 45 best of two | biased by picking the word the classifier likes |

No synthetic form passed. Decision (Loc via the Captain): recorded human clips.

## Recorded clips: Tone Perfect (CC BY-NC-SA)
- Source: GitHub mirror `tayburke/Learning-Tones` (tone.lib.msu.edu answers 403 to scripts). 9,840 files = 6 speakers × 1,640 toned syllables, all downloaded, none empty.
- Coverage against the manifest (1,641 syllable entries = 1,620 cells + 21 chips): 1,608 cells have a recording. The 12 without are on the allow-list: bia1-4, fiao1-4, tei1-4 (not standard Mandarin syllables). The 21 chips are not in the corpus.
- Speakers: Loc picked FV2 (default, clips at `<key>.mp3`) and MV1 (`mv1/<key>.mp3`). Chips: Azure Yunxi at SSML rate -10%, loudnorm, no atempo, stored under both locations.
- Pace, raw clip length over ba ma shi ni hao × 4 tones (20 clips, includes trailing silence):

| Speaker | Mean s | Median s |
|---|---|---|
| FV1 | 0.829 | 0.823 |
| FV2 | 0.781 | 0.744 |
| FV3 | 0.823 | 0.784 |
| MV1 | 0.594 | 0.575 |
| MV2 | 0.771 | 0.731 |
| MV3 | 0.579 | 0.562 |

  The 21 Azure chips have a mean of 0.44 s of audio. No atempo is applied to any clip (Loc, after trying 0.8).

## Live runs on the final tree (R2_PUBLIC_URL set; no values printed)
| Run | Result |
|---|---|
| `render:audio <manifest> --kind syllable --from-dir staged-FV2` | 1629 uploaded, 0 skipped |
| `... --from-dir staged-MV1 --prefix mv1` | 1629 uploaded, 0 skipped |
| `pnpm check:syllable-clips` | `syllable clips: 1629 (1608 cells, 21 chips)`, the 12 allow-listed cells, `missing: 0`, exit 0 |
| `pnpm check:syllable-clips --prefix mv1` | same, exit 0 |
| `pnpm check:syllable-clips --tones` (FV2) | `tone mismatches: 420` of 1,608, exit 1 |
| `pnpm check:syllable-clips --tones --prefix mv1` | `tone mismatches: 597` of 1,608, exit 1 |

## Tone check reading
The F0 classifier (`spike/tone_probe.py`, lifted into `scripts/syllable-f0.py`) was tuned on OmniVoice output. On the human clips it matches FV1 88.2%, FV2 73.9% and FV3 90.6% before upload (scored locally), so a mismatch list of this size marks a weak classifier, not 420 wrong clips. `--tones` is therefore not a gate for recorded speakers; it needs a classifier fitted to them, or Loc's ear on a sample. Nothing was overridden per cell: mixing speakers inside one voice set would be audible. The mismatch lists are in `handoffs/CHY-17-S1-probe/tones-fv2.txt` and `tones-mv1.txt` in the Captain Drive.

## Follow-ups
- Issue request: the 12 allow-listed cells (bia, fiao, tei) have no clip, so a grid cell for them must hide or disable its tap.
- Issue request: a classifier fitted to Tone Perfect (or a sampled ear check) to make `--tones` a gate.
- The chip renders came from a scratch Azure script kept in the Captain Drive, not in the repo; the 21 clips are reproducible only from there.
