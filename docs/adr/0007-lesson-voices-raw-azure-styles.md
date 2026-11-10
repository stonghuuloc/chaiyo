# 0007 — Lesson audio is raw Azure, Xiaoxiao and Yunfeng, one style per clip

Status: accepted (2026-11-10). Supersedes [0004](0004-azure-single-tts-source.md) for lesson clips (words, sentences, chips). The pinyin-chart cells are not Azure (0005, and 0006 once merged).

## Context

0004 rendered every lesson clip with Dragon HD Flash voices (Xiaoke, Yunfeng) and then edited it: 100 ms padding, silence trim both ends, loudnorm, re-encode to 24 kHz 48 kbps, and up to 8 takes against a cut-off check. PR #96 added more: a tail-fall check and a Whisper transcription gate, up to 16 takes. Loc wants none of that: the clip is what Azure returns.

Measured on 2026-11-10 against the REST endpoint (southeastasia):

- Standard neural voices are deterministic: the same request twice gives the same audio (difference 49 dB below the signal). Retakes would return the same clip, so take selection has no purpose.
- Dragon HD Flash ignores `<phoneme>` (行 as `hang 2` and `xing 2` gave byte-identical files) and has no speaking styles on Xiaoke. The standard voices take both.
- `mstts:express-as` is applied: `chat-casual` and plain gave clips of 3.77 s and 4.01 s for the same line.

## Decision

Each clip is one request in Loc's template, stored byte for byte:

```xml
<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="zh-CN"><voice name="{voice}"><s /><mstts:express-as style="{style}"><prosody rate="-20%"> {hanzi} </prosody></mstts:express-as><s /></voice></speak>
```

Output format `audio-48khz-192kbitrate-mono-mp3` (`content/cast.yaml`). No ffmpeg, no padding, no trim, no loudnorm, no retakes; clips are not volume-matched.

| Clip | Voice | Style |
|---|---|---|
| word | redpanda = `zh-CN-XiaoxiaoNeural` | `poetry-reading` |
| Primer chip (multi-syllable, e.g. `nǐ hǎo`) | redpanda | `poetry-reading` |
| sentence with no speaker (examples, reading) | redpanda | `newscast` |
| dialogue line, speaker redpanda | redpanda | the line's `style:`, else `chat-casual` |
| dialogue line, speaker takin | takin = `zh-CN-YunfengNeural` | the line's `style:`, else `default` |
| pinyin-chart cell | not Azure | none |

**Dynamic style.** A sentence with a speaker may carry `style:` in the lesson YAML. Lint check 9 rejects a style on a line with no speaker and a style the voice does not have. The lists (`VOICE_STYLES`, `src/lib/content/lint/types.ts`) are Azure's `StyleList` for each voice from `voices/list`, plus `default`. Yunfeng has 7 styles (angry, cheerful, depressed, disgruntled, fearful, sad, serious); it has no chat style, so its dialogue default is `default`.

**Key.** The style is part of the clip: `key = sha256(text|voice/style)`. Without it, `你好！` as a dialogue line and as an example sentence (both redpanda) would share one clip. Pinyin-chart cells have no style, so their keys do not change. `audio_key` in Postgres uses the same rule (`sentenceVoice` in `src/lib/content/import/audio.ts`).

**URL.** `AUDIO_VERSION = 'lessons-1'`. `az4/` and `az6/` stay in place and unused. A change to any lesson clip's request (voice, style, rate, format, text) gives it a new key; a change to the template or the cast needs a new prefix (`lessons-2`), because clips are served `immutable`.

PR #96 (az6) is closed unmerged.

## Consequences

- One request per clip, about 153,000 billable characters for the HSK 1 scope (1,377 clips).
- Clips differ in loudness by whatever Azure gives; playback does no normalisation.
- `scripts/cut-first-syllable.py` and the take gates are gone. `gate.ts` stays for the recorded-clip staging script.
- Words whose reading differs from their hanzi (`split`) are still refused by the Azure engine; the standard voices take `<phoneme>`, so that is the way to add them.
