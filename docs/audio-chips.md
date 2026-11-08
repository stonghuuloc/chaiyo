# Primer chip clips (Azure Yunxi)

The 21 multi-syllable Primer chips (`nǐ hǎo`, `mā ma`, `duì bu qǐ`, …) are not part of the Tone Perfect corpus, and a toneless syllable on its own is what OmniVoice cannot say ([ADR 0003](adr/0003-tts-engine.md#syllable-clips-are-recorded-not-rendered)). They are Azure Speech renders of the real phrase.

`scripts/render-chip-clips.ts` rebuilds the 21 clips into a staged directory. It does not upload: `render:audio --from-dir` uploads the staged files, exactly like the recorded syllable clips.

## Usage

The script reads `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` from the environment only. It never reads `.env` and never prints either value. Do not commit them.

```sh
export AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=...

# 1. Build the HSK1 bundle and its audio manifest (git-ignored).
pnpm import:content content --sink bundle --only lessons/hsk1

# 2. Render the 21 chips to <audioKey>.mp3. It skips files that already exist.
pnpm render:chips --out .cache/chip-clips

# 3. Upload them as the FV2 chips, then as the MV1 chips.
pnpm render:audio static/content/<sha>/audio-manifest.json --kind syllable --from-dir .cache/chip-clips
pnpm render:audio static/content/<sha>/audio-manifest.json --kind syllable --from-dir .cache/chip-clips --prefix mv1
```

`<sha>` is the folder `pnpm import:content` printed. Without a positional manifest argument, the script reads `static/content/current.json`, the same default as `check:syllable-clips`.

The 21 clips already on R2 came from the scratch script in the Captain Drive; do not re-render or re-upload them without a reason. The script skips a chip whose `<audioKey>.mp3` is already in the output directory, so a re-run only fills gaps.

## How a chip is rendered

| Step | Value |
|---|---|
| Voice | `zh-CN-YunxiNeural` |
| SSML | `<prosody rate="-10%">` around the hanzi phrase, `xml:lang="zh-CN"` |
| Azure output format | `riff-24khz-16bit-mono-pcm` |
| ffmpeg filter | trim silence at both ends (`silenceremove` at -45 dB), then `loudnorm=I=-16:TP=-1.5:LRA=11` |
| Encoding | mono, 24 kHz, 48 kbps mp3 |
| Tempo | none: the SSML rate is the pace, so no `atempo` |
| File name | `<audioKey>.mp3`, `audioKey = sha256(marked pinyin|narrator)` |

The marked pinyin is the chip text the audio manifest stores (`hanzi` of a syllable entry that contains a space). The phrase Azure reads is the hanzi the Primer card shows; the script keeps that mapping in `CHIP_HANZI` in `src/lib/audio-renderer/chips.ts`, and `chips.test.ts` checks its keys against the manifest built from `content/`.

## Chip-to-hanzi mapping

| Manifest text | Phrase |
|---|---|
| `yì qǐ` | 一起 |
| `nǐ men` | 你们 |
| `shí yī` | 十一 |
| `hěn hǎo` | 很好 |
| `hǎo chī` | 好吃 |
| `ní hǎo` | 你好 |
| `bù chī` | 不吃 |
| `bú shì` | 不是 |
| `yí gè` | 一个 |
| `bù lái` | 不来 |
| `yí dìng` | 一定 |
| `lǎo shī` | 老师 |
| `bú qù` | 不去 |
| `shuǐ guǒ` | 水果 |
| `yí xià` | 一下 |
| `bù hǎo` | 不好 |
| `yì tiān` | 一天 |
| `yì nián` | 一年 |
| `mā ma` | 妈妈 |
| `nǐ hǎo` | 你好 |
| `duì bu qǐ` | 对不起 |

Two keys map to 你好: the Primer card `nǐ hǎo` (written pinyin) and the sandhi drill prompt, which stores the spoken `ní hǎo`. They have different audio keys and their own clips.
