# CHY-14 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 3  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-14  ·  runs on Loc's Mac

## Anchors (verified 2026-11-06 on main 23f1db9)
- `package.json:18-19` — `lint:content`, `import:content` (`tsx scripts/…`); add `"tts:spike": "tsx scripts/tts-spike.ts"` after :19.
- `scripts/lint-content.ts:4-8` — CLI style to copy: positional arg, `statSync` guard, `console.error` + `process.exit(1)`.
- `scripts/assets_push.py:18-30` — `.env` read where a process variable wins, and the exact missing-var message + `sys.exit(2)` the NFR copies.
- `scripts/build-lesson-media.py:15` — prototype voices (takin Xiaoyi, redpanda Xiaoxiao, narrator Yunxi); `:27` edge-tts `--rate -10%` (not copied).
- `content/lessons/hsk1/h1-01.yaml:14-22` — Bài 1 lines and speakers for items #1-#9.
- `src/lib/content/derive/spoken.ts:5-22` — `deriveSpoken`; item #19 is the one item where it differs from `expected` (WAVE-PLAN P1).
- `src/lib/content/import/audio.ts:5-13` — `AudioEntry.reading` (split Word TTS input), the case items #28-#29 stand for.
- `.gitignore:28-30` — "Generated art + audio live on R2"; add `spike/*/*.mp3` after :30.
- `.prettierignore:24-28` — "Tool-owned / generated" block; add `/spike/` after :28.
- `.env.example:4-8` — R2 block; append an Azure + VoiceStudio block after :15.
- `vite.config.ts:56` — vitest includes `src/**` only, so this slice has no vitest file.
- Node 24 has `process.loadEnvFile` (checked: `typeof process.loadEnvFile === 'function'`).

## Task 0 [AC1] Preconditions on the Mac (no code)
- Loc's answers to WAVE-PLAN Q1-Q3 are in: VoiceStudio installed with the Q1 engine; three voices saved as profiles (Q2); `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` in `.env` (Q3). Report set/unset only.
- `ffmpeg -version` and `ffprobe -version` succeed (`brew install ffmpeg` otherwise).
- VoiceStudio's API docs (voicestudio.sh/docs/api-reference/audio, read by the advisor 2026-11-06) list `POST /generate` (multipart/form-data) and the OpenAI-style `POST /v1/audio/speech` (JSON `model` = engine id, `voice` = profile id, `response_format: wav`). Confirm on the running backend's OpenAPI (`/docs` or `/openapi.json`) which one takes a saved profile, record in DISCUSSION the base URL, the fields, and whether the engine takes inline pinyin. Set `VOICESTUDIO_URL` in `.env`.
- Verify: one manual `curl` to the endpoint Task 0 chose returns audio for 你好.

## Task 1 [AC2] Test set + `check` (test-set part)
Files: `spike/sentences.yaml` (new), `scripts/tts-spike.ts` (new)
- Write the 30 rows from SPEC "Test set" verbatim (`force` only on #28, #29), plus `voices` (Azure ids now, VoiceStudio ids from Task 0).
- `check`: load `${SPIKE_DIR ?? 'spike'}/sentences.yaml` with `yaml`; faults: row count ≠ 30, duplicate or out-of-range n, voice ∉ {redpanda, takin, narrator}, a case id outside the SPEC set, each required case (`hang` "yín háng", `xing` "bù xíng", `bu-t4` "bú", `t33` "ní hǎo", `yi` ⊇ {yī, yí, yì} across its rows, `redpanda`/`takin` by `voice`), `voices` missing an id for any engine × voice.
- Test first (negative controls from SPEC, on `SPIKE_DIR=$(mktemp -d)` copies): `hang` removed from #10 + #12 cases; voice `hachiware` at n=20; drop #30. Each run's stdout includes its line.
- Verify: `pnpm tts:spike check` → test-set part clean, then 60 `missing:` lines, exit 1.

## Task 2 [AC1] `render azure`
File: `scripts/tts-spike.ts`
- Env: `process.loadEnvFile('.env')` when the file exists, process values win (assets_push.py:18-30 semantics); empty key or region → the NFR line, exit 2, before any request.
- Per item without an existing `NN.mp3`: POST `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`, headers `Ocp-Apim-Subscription-Key`, `Content-Type: application/ssml+xml`, `X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm`, `User-Agent: chaiyo-tts-spike`. Body = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="…">TEXT</voice></speak>`, TEXT XML-escaped; for `force` items TEXT = `<phoneme alphabet="sapi" ph="…">行</phoneme>`, where `sapi('háng')` strips the mark and appends its tone digit (`hang 2`; `xíng` → `xing 2`). Check the zh-CN `sapi` syntax (pinyin + tone digit) on learn.microsoft.com "speech-ssml-phonetic-sets" before the run.
- Non-2xx → print `azure: n=NN HTTP <status>` (never headers), write no file, count it in `failed`, exit 1 at the end.
- WAV → `encode()` (Task 4) → `spike/azure/NN.mp3`; upsert `{ n, text, control }` by n into `inputs.json` (always 30 entries after a full run).
- Verify: `pnpm tts:spike render azure` → `azure: 30 rendered, 0 skipped, 0 failed`; again → `0 rendered, 30 skipped, 0 failed`. NFR control: `AZURE_SPEECH_KEY= pnpm tts:spike render azure` → exit 2, `git status spike/` unchanged.

## Task 3 [AC1] `render voicestudio`
File: `scripts/tts-spike.ts`
- POST `${VOICESTUDIO_URL}<endpoint from Task 0>` with the Task 0 field names: text, `voices.voicestudio.engine`, the voice profile id, wav output. `force` items send the engine's pinyin form when Task 0 found one (`control: 'pinyin'`), else plain 行 (`control: 'none'`).
- Same skip, error and `inputs.json` rules as Task 2. No HTTP route for the engine → SPEC open assumption: Batch Queue by hand, same names, `via: 'batch-queue'` in `inputs.json`.
- Verify: `voicestudio: 30 rendered, 0 skipped, 0 failed`.

## Task 4 [AC1] Shared encode + folder `check`
File: `scripts/tts-spike.ts`
- `encode(wav, out)`: `ffmpeg -y -loglevel error -i <tmp>.wav -af loudnorm=I=-16:TP=-1.5:LRA=11 -ac 1 -ar 24000 -b:a 48k out.mp3` via `spawnSync`; non-zero → exit 1 with ffmpeg's stderr.
- `check` (after the test-set part): for each engine list `*.mp3`; want exactly `01..30`; print `missing:` / `extra:` lines; all good → `voicestudio 30/30 · azure 30/30`, exit 0.
- Verify: SPEC AC1 test lines: `check` exit 0, the `diff` of names empty, `ffprobe -v error -show_entries stream=codec_name,channels,sample_rate spike/*/01.mp3` → `mp3`, `1`, `24000` twice; delete `azure/17.mp3` → `missing: azure/17.mp3`, re-render → `1 rendered, 29 skipped, 0 failed`, `inputs.json` still 30 entries.

## Task 5 [AC3] `sheet` + `order.json`
Files: `scripts/tts-spike.ts`, `spike/order.json`, `spike/sheet.html` (generated, committed)
- `order.json` only if absent: `mulberry32(hash('CHY-14'))` Fisher-Yates over 15 × `voicestudio` + 15 × `azure` → `[{ n, A }]`. `check` also asserts 30 entries and 15/15 once the file exists.
- `sheet.html`: one file, inline CSS + JS, data embedded as JSON (no fetch, so `file://` works). Rows: n, hanzi, voice (`redpanda (Hachiware)`, `takin (Momonga)`, `narrator`), expected, `<audio src="<A>/NN.mp3">`, `<audio src="<B>/NN.mp3">`, radio A/B, note input; #28/#29 add a `said` radio (A / B / both / neither), exported as the engines it names. localStorage key `chy14-picks`. Under 30 picks: `k/30 marked`; at 30: tally, engine per row, winner `<select>`, Export (Blob download of `results.json` per SPEC).
- Verify: `sheet` twice → `shasum spike/order.json` unchanged; open in Safari, mark 29 → no engine names; mark 30 → tally sums to 30.

## Task 6 [AC3] `tally`
File: `scripts/tts-spike.ts`
- Read the given file; faults: picks ≠ 30 or duplicate n, `engine` ≠ the order.json side for that pick, `tally` ≠ counted picks, `winner` ∉ {voicestudio, azure}, #28/#29 without `said`. Clean → `voicestudio V · azure Z · winner <engine>`, exit 0.
- Verify: `pnpm -s tts:spike tally spike/results.json` on Loc's file → exit 0, same numbers as the page; copies with 29 picks, without `winner`, with `winner: "edge"`, and with `said` removed from #28 → exit 1.

## Task 7 [CHORE] Wiring
Files: `package.json:19`, `.gitignore:30`, `.prettierignore:28`, `.env.example:15`
- Add the script line, `spike/*/*.mp3`, `/spike/`, and `# Azure Speech (TTS spike, CHY-14) + local VoiceStudio` with `AZURE_SPEECH_KEY=`, `AZURE_SPEECH_REGION=`, `VOICESTUDIO_URL=`.
- Verify: `git status --short spike/` lists no mp3; `pnpm check && pnpm lint && pnpm test` green on the final tree; `npx tsc --ignoreConfig --noEmit --strict --module preserve --moduleResolution bundler --target es2023 --types node --skipLibCheck scripts/tts-spike.ts` exits 0 (`pnpm check` reads only `src` + vite.config.ts; the same command exits 0 on lint-content.ts today).

## Mutation paths covered
- First render, re-render (skip), partial re-render after a delete (Task 4), a failed request (Task 2: no file written, exit 1), a missing key (NFR). The sheet: reload keeps picks (localStorage); a second `sheet` run keeps `order.json`, so picks made before stay valid.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
const [cmd, arg] = process.argv.slice(2);
const DIR = process.env.SPIKE_DIR ?? 'spike';
const pad = (n: number) => String(n).padStart(2, '0');
const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
function need(k: string): string {
	const v = process.env[k] ?? '';
	if (!v) { console.error(`${k} is missing or empty (set it in .env)`); process.exit(2); }
	return v;
}
function mulberry32(a: number) {
	return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const ssml = (voice: string, it: Item) =>
	`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"><voice name="${voice}">` +
	(it.force ? `<phoneme alphabet="sapi" ph="${sapi(it.force)}">${esc(it.hanzi)}</phoneme>` : esc(it.hanzi)) +
	'</voice></speak>';
```

## Rollback
`git revert` of the slice commits; delete `spike/`. No migration, nothing in `src/`, nothing on R2.
