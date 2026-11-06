# CHY-14 S1 — spec
ACs: AC1, AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 3 (vs main 23f1db9; advisor r1 + r2 applied)

## Behaviour
- [AC2] `spike/sentences.yaml` = `{ voices, items }`. `items` holds exactly 30 rows `{ n, hanzi, voice, cases, expected, force? }`, `n` = 1..30 each once, `voice` ∈ {redpanda, takin, narrator}, `cases` ⊆ {hang, xing, bu-t4, bu, yi, t33, redpanda, takin, poly, force, syllable}, `force` = the reading the engine must say (only #28, #29). The rows are the table under "Test set".
- [AC2] Every AC2 example row has ≥1 item tagged with its case id whose `expected` contains the AC's reading: `hang` "yín háng" (#10, #12), `xing` "bù xíng" (#11), `bu-t4` "bú" (#6, #24), `yi` "yī", "yí" and "yì" across its rows (一 before tone 1 #21, tone 2 #22, tone 3 #23, tone 4 #20 yí; #19 is the date yī), `t33` "ní hǎo" (#1, #2). For `redpanda` (#1, #3, #4, #11, #20) and `takin` (#2, #5, #6, #7, #24) the rule is `voice` = the case id instead. Hachiware = redpanda, Momonga = takin (DISCUSSION).
- [AC2] `voices` = `{ azure: { redpanda, takin, narrator }, voicestudio: { engine, redpanda, takin, narrator } }`: one provider voice id per voice. Azure: zh-CN-XiaoxiaoNeural, zh-CN-XiaoyiNeural, zh-CN-YunxiNeural. VoiceStudio: `engine` and three saved voice profile ids, per WAVE-PLAN Q1/Q2.
- [AC1] `pnpm tts:spike render azure` and `pnpm tts:spike render voicestudio` each write `spike/<engine>/NN.mp3` for n = 01..30 (two digits), so clip NN is the same item in both folders. An existing `NN.mp3` is skipped. The last stdout line is `<engine>: <r> rendered, <s> skipped, <f> failed` with r + s + f = 30; f > 0 → exit 1.
- [AC1] Input per item: `hanzi` as written, engine default rate, the voice id `voices.<engine>.<voice>`. Items with `force` (#28, #29) send the reading through the engine's control: Azure wraps the hanzi in SSML `<phoneme alphabet="sapi" ph="…">`; VoiceStudio sends its documented pinyin input if the engine has one, else the plain hanzi. `spike/<engine>/inputs.json` holds exactly 30 entries, upserted by n: the exact text sent and `control` = `ssml-phoneme` | `pinyin` | `none`.
- [AC1] Both engines' raw audio pass through one encode: ffmpeg `loudnorm=I=-16`, mono, 24 000 Hz, 48 kbps mp3. Azure is asked for 24 kHz 16-bit mono PCM, so no clip is encoded twice.
- [AC1] `pnpm tts:spike check` exits 0 and prints `voicestudio 30/30 · azure 30/30` when both folders hold exactly `01.mp3`..`30.mp3`; otherwise it prints one line per gap (`missing: azure/17.mp3`, `extra: azure/31.mp3`) and exits 1. It runs the AC2 test-set checks first.
- [AC2] `check` on a bad test set exits 1 with one line per fault: `case missing: hang`, `unknown voice: hachiware (n=20)`, `items: 29, want 30`, `duplicate n: 12`.
- [AC3] `pnpm tts:spike sheet` writes `spike/order.json` once (seeded shuffle; 15 rows with A = voicestudio, 15 with A = azure; kept if present) and `spike/sheet.html`, a standalone page that works from `file://`. Per row: n, hanzi, voice (`redpanda (Hachiware)`, `takin (Momonga)`, `narrator`), `expected`, an `<audio>` for clip A and clip B, a pick (A better / B better), an optional note. Rows #28 and #29 also ask "which clip said <force>?" (A / B / both / neither), stored as `said`.
- [AC3] Picks persist in localStorage. With fewer than 30 picks the page shows `n/30 marked` and no engine names. At 30 it shows the tally `voicestudio V · azure Z` (V + Z = 30), the engine behind each A/B, and a winner picker. "Export" downloads `results.json` = `{ date, picks: [{ n, pick, engine, note?, said?: ('voicestudio' | 'azure')[] }], tally: { voicestudio, azure }, winner }` (`said` is resolved to engines at export like `engine`: both = two entries, neither = `[]`), `winner` ∈ {voicestudio, azure}.
- [AC3] Loc's export is committed as `spike/results.json`. `pnpm tts:spike tally spike/results.json` prints `voicestudio V · azure Z · winner <engine>` and exits 0; it exits 1 when picks ≠ 30, `tally` disagrees with the picks, `winner` ∉ {voicestudio, azure}, or #28/#29 lack `said`.
- [NFR] No secret reaches stdout or a file: `render azure` reads `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` from the environment or `.env`; when one is empty it prints `AZURE_SPEECH_KEY is missing or empty (set it in .env)` and exits 2 before any request. `render voicestudio` needs `VOICESTUDIO_URL` (the local backend's base URL, found in PLAN Task 0) the same way.
- [CHORE] `spike/*/*.mp3` is git-ignored; `spike/*/inputs.json` is committed (S2 reads it); `/spike/` joins .prettierignore (the browser writes `results.json` unformatted); `.env.example` lists the three variable names with empty values; `package.json` gains `tts:spike`. `pnpm check`, `pnpm lint` and `pnpm test` stay green, and a strict `tsc --noEmit` of `scripts/tts-spike.ts` exits 0 (`pnpm check` never reads `scripts/`).

## Test set
| n | hanzi | voice | cases | expected | force |
|---|---|---|---|---|---|
| 1 | 你好！ | redpanda | t33 redpanda | ní hǎo | |
| 2 | 你好！ | takin | t33 takin | ní hǎo | |
| 3 | 没关系。 | redpanda | redpanda | méi guānxi | |
| 4 | 谢谢！ | redpanda | redpanda | xièxie | |
| 5 | 对不起！ | takin | takin | duìbuqǐ | |
| 6 | 不客气。 | takin | bu-t4 takin | bú kèqi | |
| 7 | 再见！ | takin | takin | zàijiàn | |
| 8 | 您好！ | narrator | | nín hǎo | |
| 9 | 你们好！ | narrator | | nǐmen hǎo | |
| 10 | 我去银行。 | narrator | hang | wǒ qù yín háng | |
| 11 | 不行！ | redpanda | xing redpanda | bù xíng | |
| 12 | 他在银行工作。 | narrator | hang | tā zài yín háng gōngzuò | |
| 13 | 他还没来。 | narrator | poly | tā hái méi lái | |
| 14 | 我明天还你书。 | narrator | poly | wǒ míngtiān huán nǐ shū | |
| 15 | 我觉得很好。 | narrator | poly t33 | wǒ juéde hén hǎo | |
| 16 | 他在睡觉。 | narrator | poly | tā zài shuìjiào | |
| 17 | 他长得很高。 | narrator | poly | tā zhǎng de hěn gāo | |
| 18 | 这条路很长。 | narrator | poly | zhè tiáo lù hěn cháng | |
| 19 | 今天是一月一号。 | narrator | yi | jīntiān shì yī yuè yī hào | |
| 20 | 我有一个朋友。 | redpanda | yi t33 redpanda | wó yǒu yí ge péngyou | |
| 21 | 我学了一天。 | narrator | yi | wǒ xué le yì tiān | |
| 22 | 他来了一年了。 | narrator | yi | tā lái le yì nián le | |
| 23 | 我们一起去吧。 | narrator | yi | wǒmen yìqǐ qù ba | |
| 24 | 我不去。 | takin | bu-t4 takin | wǒ bú qù | |
| 25 | 我不喝茶。 | narrator | bu | wǒ bù hē chá | |
| 26 | 天气很好。 | narrator | t33 | tiānqì hén hǎo | |
| 27 | 我想去。 | narrator | t33 | wó xiǎng qù | |
| 28 | 行 | narrator | force hang | háng | háng |
| 29 | 行 | narrator | force xing | xíng | xíng |
| 30 | 马 | narrator | syllable | mǎ, full dip | |

## Not this slice
- AC4 (ADR 0003, licence status, voice map) and AC5 (open decision 3, `content/cast.yaml`) → S2. S2 reads `spike/results.json`, `voices` and `spike/*/inputs.json`.

## Seam
One CLI, `scripts/tts-spike.ts` (`render`, `check`, `sheet`, `tally`), and the `spike/` folder. No module under `src/`.

## Test contract (CLI, run by the tester on the Mac)
- [AC2] `pnpm tts:spike check` on the committed test set, before any render: test-set part passes, then `missing:` lines for 60 clips, exit 1.
- [AC2] Negative controls on a temp copy (`SPIKE_DIR=<tmp>`; every run there also prints 60 `missing:` clip lines, so each control reads the test-set lines): remove `hang` from the `cases` of #10 and #12 → stdout includes `case missing: hang` and no other test-set fault; set #20 voice to `hachiware` → stdout includes `unknown voice: hachiware (n=20)`; drop #30 → stdout includes `items: 29, want 30`.
- [AC1] After both renders: `check` exits 0 with `voicestudio 30/30 · azure 30/30`; `diff <(ls spike/azure/*.mp3 | xargs -n1 basename) <(ls spike/voicestudio/*.mp3 | xargs -n1 basename)` is empty; `ffprobe` on both `01.mp3` shows mp3, 1 channel, 24000 Hz.
- [AC1] Negative control: delete `spike/azure/17.mp3` → `check` prints `missing: azure/17.mp3`, exit 1; `render azure` then prints `azure: 1 rendered, 29 skipped, 0 failed`.
- [AC1] `inputs.json` of both engines: 30 entries; #28 and #29 carry the forced reading or `control: none`; every other n carries its `hanzi` unchanged. After the delete-17 control it still has 30 entries.
- [NFR] `AZURE_SPEECH_KEY= pnpm tts:spike render azure` exits 2 with the missing-key line, and no file changes under `spike/azure/`.
- [AC3] `order.json`: 30 entries, 15 `voicestudio`, 15 `azure`; a second `sheet` run leaves it byte-identical. In the browser: 29 picks show `29/30 marked` and no engine name; the 30th shows a tally summing to 30.
- [AC2] `sheet.html` embedded data: for every n, `voice` and `expected` equal `sentences.yaml`. In the browser row 1 shows `redpanda (Hachiware)` and `ní hǎo`, row 2 `takin (Momonga)`.
- [AC3] `pnpm -s tts:spike tally spike/results.json` equals the page's tally, exit 0. Negative controls: a copy with 29 picks → exit 1; a copy with `winner` removed → exit 1; a copy with `winner: "edge"` → exit 1; a copy with `said` removed from #28 → exit 1.
- [AC3] Loc listens to all 30 rows, picks a winner and exports; the tester records the tally in VERIFY.md.

## Open assumptions
- [AC1] VoiceStudio exposes HTTP `POST /generate` or `POST /v1/audio/speech` on its local backend (its API docs list both). If the chosen engine (WAVE-PLAN Q1) cannot be called that way, the render falls back to VoiceStudio's Batch Queue with the same 30 texts and names, and `inputs.json` says `via: batch-queue`. Then AC1's When ("the spike script renders") is met only in part: VERIFY.md records it as a deviation for Loc.
- [AC1] Azure `sapi` phoneme strings for zh-CN are pinyin with a tone digit (e.g. `hang 2`); Task 2 checks the syntax against Microsoft's zh-CN phone set before rendering #28-#29.
