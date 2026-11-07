# CHY-14 S1 — discussion
ACs: AC1, AC2, AC3 · design lead CHAA-49 · 2026-11-06

## Answered here (≥80% rule, CREW.md)
- [AC2] Q: the ticket names Hachiware and Momonga; which voices? A: Hachiware = `redpanda`, Momonga = `takin`, plus `narrator`. Confidence 95%: CONTEXT.md:177 and lint/types.ts:46-48 name the two speaking members; lint.test.ts:174-179 rejects `hachiware`; the role tables in NOTES.md:57-60 map 1:1 (talker in sentences = red panda, "call me cute" demander = takin).
- [AC2] Q: which 30 items? A: the SPEC table: 9 Bài 1 lines (h1-01.yaml:14-22, real Cast lines), 9 polyphone items (行 ×3, 还 ×2, 觉 ×2, 长 ×2), 9 sandhi items (一 ×5, 不 ×2, 3-3 ×2), 2 forced-reading items, 1 isolated syllable. Confidence 85%: covers every AC2 example row at least once, keeps clear of 3-3-3 chains, which have two accepted readings.
- [AC2] Q: what goes in `expected`? A: the reading a teacher says for the whole item, written by hand. Fed citation pinyin (#20 as `yī gè`), our `deriveSpoken` gives the same sandhi syllables on 29 of 30 items; #19 今天是一月一号 differs: derive gives `yí yuè yí hào`, a teacher says `yī yuè yī hào` (dates keep yī). Confidence 90%: computed with derive/spoken.ts:5-22 on main 23f1db9. The derive gap is parked in WAVE-PLAN P1, not fixed here.
- [AC1] Q: what does each engine get as input? A: the plain hanzi at normal rate, the same text the renderer will send (C5: the renderer sends `hanzi`, or `reading` for a split Word). Items #28 and #29 (行 forced to háng and xíng) send the reading through each engine's control: Azure SSML `<phoneme alphabet="sapi">`; VoiceStudio its documented pinyin input, else plain 行. Confidence 85%: this measures the case CHY-15 needs for split Words (打-da2).
- [AC1] Q: why one shared encode? A: both engines' raw audio go through one ffmpeg pass (loudnorm -16 LUFS, mono, 24 kHz, 48 kbps mp3), so a louder or brighter file cannot win by ear. Confidence 85%.
- [AC1] Q: rate? A: engine default (1.0). The prototype's edge-tts `--rate -10%` (build-lesson-media.py:27) is not used: slow play is the client at 0.5×. Confidence 90%: content-schema.md:331.
- [AC3] Q: blind? A: engine per row from `spike/order.json` (fixed seed, 15 rows A = voicestudio, 15 A = azure); the tally and the mapping stay hidden until all 30 rows are marked. Confidence 85%: a visible tally biases the remaining picks.
- [AC1] Q: where do files live? A: `spike/voicestudio/NN.mp3` and `spike/azure/NN.mp3` as the AC names them, git-ignored like prototype/audio (.gitignore:28-30). Committed: `spike/sentences.yaml`, `order.json`, `sheet.html`, `results.json`, `spike/*/inputs.json`. Confidence 85%.
- [CHORE] Q: TS or Python? A: TS run by tsx (`pnpm tts:spike`), like lint-content.ts, so CHY-15 can lift the Azure call. No vitest file: vitest only includes `src/**` (vite.config.ts:56); the CLI `check` and `tally` commands carry the falsifiable checks. Confidence 80%.
- [AC1] Q: Cast genders and Azure voices? A: keep the prototype's: redpanda zh-CN-XiaoxiaoNeural, takin zh-CN-XiaoyiNeural, narrator zh-CN-YunxiNeural (build-lesson-media.py:15). Loc has heard these in the Bài 1 prototype. Confidence 80%. VoiceStudio voices follow WAVE-PLAN Q2.

- [AC3] Q (advisor r1): rows #28/#29 are A-vs-B; how does S2 learn whether an engine said the forced reading? A: those two rows also ask "which clip said <force>?" (A / B / both / neither), stored as `said`. Confidence 85%.
- Parked (advisor r1, no AC): clip `src` paths (`azure/NN.mp3`) and the committed `order.json` reveal the engine to anyone who looks; AC3 asks only for a shuffled sheet. Loc listens without opening devtools.

- [AC1] Changed at execute (Loc, 2026-11-07, WAVE-PLAN Q1-Q3 answers): one engine, OmniVoice, called directly through its Python package (`spike/omnivoice_render.py`); the VoiceStudio app, Azure and CosyVoice are dropped. "Both engines" became two OmniVoice arms: **design** (voice prompt + seed) and **refclip** (one reference clip per voice). Folders `spike/design` and `spike/refclip` replace `spike/voicestudio` and `spike/azure`; `order.json` and the sheet shuffle those two arms. Confidence 100%: Loc's decision.
- [AC2] Changed at execute: `voices` in `sentences.yaml` holds text prompts and seeds (redpanda fixed by Loc, three candidates each for takin and narrator), plus `chosen`, `pace` (atempo factor) and optional per-item `say` and `seed`. Loc picked takin-3, narrator-1; paces 0.85 / 0.85 / 0.75. Row 8 sends `NIN2HAO3！` with seed 7 (ear-checked).
- [CHORE] Added at execute after Loc's "broken" rows: `render` gates each clip (speech per syllable, clipping, silence, Whisper), retries with a new seed, and `check` flags stale ref, tempo, text and pinned seed. Confidence 90%: the broken rows were rushed, not garbled.

## Open — needs an answer before execute
None in this file. WAVE-PLAN.md Q1 (which VoiceStudio engine), Q2 (VoiceStudio voices) and Q3 (Azure resource) gate execute, not spec: their answers are values in `spike/sentences.yaml` `voices` and in the Mac's `.env`, and no requirement here changes with them.

## Locked (do not re-open)
- Audio key normal speed only; slow = client 0.5× (content-schema.md:331). Speaking Cast = redpanda, takin (lint check 9).
