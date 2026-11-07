# CHY-15 S2 — plan
ACs: AC5  ·  Spec rev 2  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-15-S2 (stacked on CHY-15, then CHY-14-s2) · renders on Loc's Mac

## Anchors (verified 2026-11-08, S1 head a55ee88 on CHY-15; main fd2b67a lineage; origin/CHY-14-s2)
- `src/lib/audio-renderer/types.ts`, `render.ts:31` — S1 seam (branch CHY-15).
- `content/cast.yaml` (origin/CHY-14-s2) — `voices`, `audition`, `overrides` by key.
- `scripts/tts-spike.ts:145` `itemText`; `:223-246` `encode` (atempo + loudnorm); `:248-265` `Job`; `:274-282` `transcribe`; `:283-425` render loop with seed retry (`:349` cumulative bump); `heard` and `audioFaults` in the same file.
- `spike/omnivoice_render.py` — OmniVoice call (`from_pretrained("k2-fsa/OmniVoice", device_map="mps", dtype=torch.float16)`, `generate(text, ref_audio, ref_text)`); `spike/asr_check.py` — Whisper small, zh.
- `scripts/assets_push.py:18-30` — `.env` read and the missing-variable message with exit 2.
- `src/lib/content/import/bundle-sink.ts:44-45` — manifest shape. `package.json:19` script slot. `.env.example:4-8` R2 block, `:17` `OMNIVOICE_PYTHON`.

## Task 0 [AC5] Preconditions (Loc, no code)
- [AC5] In Cloudflare: create a public bucket (r2.dev enabled), CORS `GET` for the app origin, an R2 API token with object read/write scoped to it; put `R2_AUDIO_BUCKET`, `R2_AUDIO_ACCESS_KEY_ID`, `R2_AUDIO_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` in the Mac `.env` (`R2_ACCOUNT_ID` is shared; `chaiyo-assets` values stay as they are).
- [AC5] On the Mac: `OMNIVOICE_PYTHON` (the CHY-14 venv, with whisper), ffmpeg and ffprobe on PATH.

## Task 1 [AC5] R2 bucket adapter
Files: `src/lib/audio-renderer/r2.ts`, `r2.test.ts` (new)
- [AC5] Test first (stubbed `fetch`, pinned SigV4 value computed in python from the fixtures). Then `r2Bucket({ accountId, bucket, accessKeyId, secretAccessKey }, fetchImpl = fetch)`.
- [AC5] Verify: `pnpm test --maxWorkers=2 src/lib/audio-renderer`.

## Task 2 [AC5] Seam: richer engine request
Files: `types.ts`, `render.ts`, `fakes.ts`, `render.test.ts`
- [AC5] `{ text, voice, key, kind, hanzi }`; S1 tests assert the fields in `engine.calls`.
- [AC5] Verify: same command.

## Task 3 [AC5] OmniVoice engine, worker, gate
Files: `src/lib/audio-renderer/omnivoice.ts`, `omnivoice_worker.py`, `gate.ts`, `omnivoice.test.ts` (new)
- [AC5] Test first with injected `worker`, `encode` and `faults` seams. Then: cast parse with `yaml` (throws on a missing field), cache-keyed ref wav, per-clip job, `encode` via `spawnSync ffmpeg` as tts-spike.ts:223, gate (`audioFaults`, `heard`, Whisper through the worker's `transcribe` op), cumulative seed retries, `MAX_ATTEMPTS = 4`, lazy worker start.
- [AC5] `omnivoice_worker.py`: ops `render { out, text, seed, instruct?, ref_audio?, ref_text? }` and `transcribe { mp3 }`, one JSON object per line, reply `{ out }`, `{ text }` or `{ error }`.
- [AC5] Verify: unit tests; then on the Mac one clip per voice, listened to.

## Task 4 [AC5] CLI and wiring
Files: `scripts/render-audio.ts` (new), `package.json:19`, `.env.example`
- [NFR] Env check order and message, exit 2; `--kind`, `--ref-prefix`, `--limit`; `RenderError` printing; exit codes per SPEC.
- [CHORE] `render:audio` script and the four `.env.example` names.
- [AC5] Verify: `R2_AUDIO_BUCKET= pnpm render:audio x.json` → exit 2, message; `pnpm check && pnpm lint && pnpm test --maxWorkers=2`; strict `tsc --ignoreConfig --noEmit` on `scripts/render-audio.ts`.

## Task 5 [AC5] Live run on the Mac
- [AC5] The SPEC live test lines: import, `--limit 5`, re-run (0 uploaded, no worker), `curl -sI`, `ffprobe`, CORS curl, all of Bài 1 in two runs, browser play.

## Mutation paths covered
- First render, re-render (no worker start), partial failure then re-run, gate retry then fail, pinned override, unknown voice, missing env, a 403 from R2.
