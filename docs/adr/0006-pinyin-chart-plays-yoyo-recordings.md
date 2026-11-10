# 0006 — The pinyin chart plays Yoyo Chinese recordings

Status: accepted (2026-11-10). Supersedes [0005](0005-syllables-are-tone-perfect-recordings.md) for the syllable cells. [0004](0004-azure-single-tts-source.md) still holds for everything else.

## Context

Loc compared Azure Xiaoxiao (with the `sapi` phoneme tag) against the human recordings of the Yoyo Chinese pinyin chart, cell by cell, and chose Yoyo for the chart. Azure stays the source for lessons: words, sentences, chips and the cast voices.

## Decision

The 1,608 toned-syllable cells (402 syllables × 4 tones) play the Yoyo Chinese pinyin-chart recordings. Every other clip stays Azure.

**Source.** The chart page's script `pinyin-table.*.mjs` lists each clip as `https://cdn.yoyochinese.com/audio/pychart/<syllable><tone>.mp3`; 1,612 files, 403 syllables. ü is written `v` (`lv3`, `lve2`), except nüe, which Yoyo spells `nue`.

**Staging.** `scripts/stage-recorded-clips.ts <dir> '{cell}.mp3' <audio-manifest.json> <out> --alias nve=nue`. The script now takes a file template instead of a Tone Perfect speaker, and keeps a clip already in `<out>` when the corpus has none. Each clip is encoded once as before: loudnorm -16 LUFS, 24 kHz mono, 48 kbps mp3, no atempo. Upload: `render:audio <manifest> --from-dir <out> --kind syllable --prefix az7`.

**Gaps.** Yoyo has no nou (4 cells). Those keep the Tone Perfect FV3 clip, copied from `az5/` into the staging directory before staging. bia, fiao and tei stay on `NO_CLIP`: neither source has them.

**URL.** `az6/` is taken by the Azure raw-takes render (PR #96), so the cells move to `az7/`. `SYLLABLE_VERSION = 'az7'`. `az5/` stays in place and unused.

### Licence

The recordings belong to Yoyo Chinese. Loc's call: Chaiyo is for Loc and a friend to learn, not commercial. The clips sit in the public R2 audio bucket like every other clip. If Chaiyo goes public or commercial, the chart audio must be replaced or licensed first.

## Consequences

- The chart sounds like one Yoyo speaker, except the 4 nou cells (FV3).
- The future learner chart (CHY-40) gets Yoyo audio by reading `SYLLABLE_BASE`, as the `/dev/audio` grid does.
- A change to syllable audio needs another prefix, for the same immutable-cache reason as 0005.
