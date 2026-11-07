# CHY-15 S2 — plan
ACs: AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-15-S2 (stacked on CHY-15, then CHY-14-s2) · renders on Loc's Mac

## Anchors (verified 2026-11-08 on main a55ee88 and origin/CHY-14-s2)
- `src/lib/audio-renderer/types.ts`, `render.ts` — S1 seam (on branch CHY-15).
- `content/cast.yaml` (origin/CHY-14-s2) — `voices`, `audition`, `overrides` by key.
- `scripts/tts-spike.ts:145` `itemText`; `:190-231` `encode` (atempo + loudnorm); `:252-300` job and Whisper `transcribe`; `:300-415` render loop with seed retry; `heard` and `audioFaults` in the same file.
- `spike/omnivoice_render.py` — OmniVoice call (`from_pretrained("k2-fsa/OmniVoice", device_map="mps", dtype=torch.float16)`, `generate(text, ref_audio, ref_text)`); `spike/asr_check.py` — Whisper small, zh.
- `scripts/assets_push.py:18-30` — `.env` read and the missing-variable message with exit 2.
- `src/lib/content/import/bundle-sink.ts:44-45` — manifest shape. `package.json:19` script slot. `.env.example:4-8` R2 block.

## Task 0 [AC5] Preconditions (Loc, no code)
- [AC5] In Cloudflare: create a public bucket (r2.dev enabled), CORS `GET` for the app origin, an R2 API token with object read/write scoped to it; put `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_PUBLIC_URL` in the Mac `.env` (the `chaiyo-assets` values must not be reused).
- [AC5] On the Mac: `OMNIVOICE_PYTHON` (the CHY-14 venv), ffmpeg and ffprobe on PATH.

## Task 1 [AC5] R2 bucket adapter
Files: `src/lib/audio-renderer/r2.ts`, `r2.test.ts` (new)
- [AC5] Test first (stubbed `fetch`, pinned SigV4 value computed in python). Then `r2Bucket({ accountId, accessKeyId, secretAccessKey, bucket }, fetchImpl = fetch)`.
- [AC5] Verify: `pnpm test --maxWorkers=2 src/lib/audio-renderer`.

## Task 2 [AC5] Seam: key in the engine request
Files: `types.ts`, `render.ts`, `fakes.ts`, `render.test.ts`
- [AC5] `{ text, voice, key }` everywhere; S1 tests assert the key in `engine.calls`.
- [AC5] Verify: same command.

## Task 3 [AC5] OmniVoice engine + worker + gate
Files: `src/lib/audio-renderer/omnivoice.ts`, `omnivoice_worker.py`, `gate.ts`, `omnivoice.test.ts` (new)
- [AC5] Test first with a stubbed worker (injected `run(request) → wav path`, `encode`, `transcribe` seams). Then: cast parse with `yaml` (a shape check that throws on a missing field), ref wav per voice (rendered once, cached), per-clip job, `encode` via `spawnSync ffmpeg` as tts-spike.ts:225, gate (`audioFaults`, `heard`, Whisper via `spike/asr_check.py` for sentence/word entries without override), seed + attempt × 1000 retries, `MAX_ATTEMPTS = 4`.
- [AC5] `omnivoice_worker.py`: model loaded once, one JSON request per line `{ out, text, seed, instruct?, ref_audio?, ref_text? }`, reply `{ out }` or `{ error }` per line.
- [AC5] Verify: unit tests; then on the Mac render one clip per voice and listen.

## Task 4 [AC5] CLI + wiring
Files: `scripts/render-audio.ts` (new), `package.json:19`, `.env.example`
- [NFR] Env check order and message, exit 2; `--only`, `--limit`; `RenderError` printing; exit codes per SPEC.
- [CHORE] `render:audio` script and the two `.env.example` names.
- [AC5] Verify: `R2_BUCKET= pnpm render:audio x.json` → exit 2, message; `pnpm check && pnpm lint && pnpm test --maxWorkers=2`; strict `tsc --ignoreConfig --noEmit` on `scripts/render-audio.ts`.

## Task 5 [AC5] Live run on the Mac
- [AC5] Run the SPEC live test lines: import, `--limit 5`, re-run (0 uploaded, worker not started), `curl -sI`, `ffprobe`, CORS curl, full Bài 1, open in a browser.

## Mutation paths covered
- First render, re-render (no worker start), partial failure then re-run, gate retry then fail, override pinned, unknown voice, missing env, a 403 from R2.
