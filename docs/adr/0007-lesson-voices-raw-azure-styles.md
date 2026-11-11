# 0007 — Lesson audio is raw Azure, Xiaoxiao and Yunfeng, one style per clip

Status: accepted (2026-11-10). Supersedes [0004](0004-azure-single-tts-source.md) for lesson clips (words, sentences, chips). The pinyin-chart cells are not Azure ([0006](0006-pinyin-chart-plays-yoyo-recordings.md)).

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

Output format `audio-48khz-192kbitrate-mono-mp3`. Voices, rate and format live in `src/lib/audio/cast.ts` (`CAST`). No ffmpeg, no padding, no trim, no loudnorm, no retakes; clips are not volume-matched.

| Clip | Voice | Style |
|---|---|---|
| word | redpanda = `zh-CN-XiaoxiaoNeural` | `poetry-reading` |
| Primer chip (multi-syllable, e.g. `nǐ hǎo`) | redpanda | `poetry-reading` |
| sentence with no speaker (examples, reading) | redpanda | `newscast` |
| dialogue line, speaker redpanda | redpanda | the line's `style:`, else `chat-casual` |
| dialogue line, speaker takin | takin = `zh-CN-YunfengNeural` | the line's `style:`, else `default` |
| pinyin-chart cell | not Azure | none |

**Dynamic style.** A sentence with a speaker may carry `style:` in the lesson YAML. Lint check 9 rejects a style on a line with no speaker and a style the voice does not have. The lists (`VOICE_STYLES`, `src/lib/content/lint/types.ts`) are Azure's `StyleList` for each voice from `voices/list`, plus `default`. Yunfeng has 7 styles (angry, cheerful, depressed, disgruntled, fearful, sad, serious); it has no chat style, so its dialogue default is `default`.

**Key.** A lesson clip's key is its folder plus the hash of its whole Azure request: `key = <folder>/sha256(text|<Azure voice>/<style>|<rate>|<format>)`. With the style in it, `你好！` as a dialogue line and as an example sentence get two clips. With voice, rate and format in it, any change to `CAST` gives every clip a new key and URL, so `immutable` caching never serves an old clip and no version prefix is needed. Pinyin-chart cells are recordings: their key stays `sha256(text|redpanda)`. `audio_key` in Postgres uses the same rule (`sentenceVoice` in `src/lib/content/import/audio.ts`).

**Folders.** One folder per kind of clip at the bucket root, so the bucket can be read by eye (Loc, 2026-11-11):

| Folder | Clips |
|---|---|
| `words/` | words |
| `chips/` | Primer chips |
| `examples/` | sentences with no speaker: the word example corpus (`content/sentences/`) and lesson reading lines |
| `dialogue/` | sentences with a speaker |

**URL.** `AUDIO_BASE` is the bucket root; the player fetches `<AUDIO_BASE>/<key>.mp3`, so the folder needs no client change. The clips were moved from `lessons-1/` by a server-side copy (same bytes, no re-render); `lessons-1/` and `lessons-2/` are unused.

PR #96 (az6) is closed unmerged.

## Consequences

- One request per clip, about 153,000 billable characters for the HSK 1 scope (1,377 clips).
- Clips differ in loudness by whatever Azure gives; playback does no normalisation.
- `scripts/cut-first-syllable.py` and the take gates are gone. `gate.ts` stays for the recorded-clip staging script.
- Words whose reading differs from their hanzi (`split`) are still refused by the Azure engine; the standard voices take `<phoneme>`, so that is the way to add them.
