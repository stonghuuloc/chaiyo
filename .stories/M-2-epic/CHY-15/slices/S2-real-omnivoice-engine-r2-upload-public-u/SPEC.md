# CHY-15 S2 — spec
ACs: AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (stacked on CHY-15 S1 and CHY-14 S2 / PR #63)

## Behaviour
- [AC5] `pnpm render:audio <manifest> [--only <voice>] [--limit N]` reads `{ sha, entries }` (`<out>/<sha>/audio-manifest.json`), calls S1's `render` with the OmniVoice engine and the R2 bucket, and prints `<uploaded> uploaded, <skipped> skipped` (exit 0). A `RenderError` prints one `failed: <ref> <message>` line per failure plus the counts and exits 1; a `key mismatch` exits 1.
- [AC5] Bucket adapter `src/lib/audio-renderer/r2.ts`: S3 API on `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com/<R2_BUCKET>/<name>` signed with SigV4 (`node:crypto` + `fetch`, no new dependency). `has` = HEAD (200 → true, 404 → false, anything else throws); `put` = PUT with `Content-Type: audio/mpeg` and `Cache-Control: public, max-age=31536000, immutable` (a key is a content hash, never rewritten).
- [AC5] Engine adapter `src/lib/audio-renderer/omnivoice.ts` reads `content/cast.yaml` (CHY-14 S2): `voices.<voice> = { id, instruct, seed, pace }`, `audition`, `overrides[<key>] = { hanzi, voice, say?, seed? }`. Per Cast voice it renders the `audition` text once from `instruct` + `seed` (cached as a wav under `node_modules/.cache/chaiyo-audio/voices/<id>.wav`) and uses that wav as `ref_audio` with `ref_text = audition` for every clip of that voice (ADR 0003 refclip arm). An unknown voice throws `unknown voice: <voice>` for that entry (one failure, run continues).
- [AC5] Per clip: text = `overrides[key].say ?? text`; seed = `overrides[key].seed ?? voice.seed`; OmniVoice runs in one long-lived Python worker (`src/lib/audio-renderer/omnivoice_worker.py`, model loaded once, JSON lines in and out, device mps) so 1,666 clips do not reload the model 1,666 times. The wav is encoded by one ffmpeg call: `atempo=<voice.pace>,loudnorm=I=-16:TP=-1.5:LRA=11`, mono, 24 000 Hz, 48 kbps mp3 (same as `scripts/tts-spike.ts:225`).
- [AC5] Render gate, ported from `scripts/tts-spike.ts` (audioFaults, `heard`, MAX_ATTEMPTS 4): an mp3 with a speech-rate or clipping fault, or whose Whisper transcript (`spike/asr_check.py`) differs from `heard(hanzi)` for a sentence/word entry, is re-rendered with seed + attempt × 1000 up to 4 attempts, then fails the entry (nothing is put). Entries with an override `seed` or `say` are never retried and skip the Whisper comparison (chosen by ear, CHY-14 DISCUSSION). Syllable entries (CHY-17) skip Whisper: isolated-syllable tone forcing is unreliable (CHAA-55).
- [AC5] Seam change to S1: `Engine.synthesize` request gains `key` (`{ text, voice, key }`, the entry's audio key), so overrides are looked up by key; `render` passes it, the fake records it, S1 tests gain the field.
- [AC5] Public URL: after rendering Bài 1, `GET <R2_PUBLIC_URL>/<key>.mp3` for a Bài 1 sentence key answers 200 with content type `audio/mpeg`, the body decodes (`ffprobe`: mp3, 1 channel, 24000 Hz) and plays; `OPTIONS`/`GET` with `Origin: <app origin>` returns `access-control-allow-origin` for it.
- [NFR] The CLI checks `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `OMNIVOICE_PYTHON` (env, then `.env`, like `scripts/assets_push.py`): the first empty one prints `<NAME> is missing or empty (set it in .env)` and exits 2 before any engine or network call. No key, secret or signature is printed or logged, including in error messages.
- [CHORE] `package.json` gains `"render:audio": "tsx scripts/render-audio.ts"`; `.env.example` gains `R2_PUBLIC_URL=` and `OMNIVOICE_PYTHON=` (the second is already added by CHY-14 if present; no duplicate).

## Not this slice
- Bundle `audioKey` (CHY-8 follow-up), player (CHY-16), `check-syllable-clips` (CHY-17), bucket creation, r2.dev toggle and CORS (Cloudflare dashboard, a Loc step).

## Seam
`render` (S1) ← `omniVoiceEngine(cast, opts)` and `r2Bucket(env)`, wired in `scripts/render-audio.ts`. Unit tests use `fakeEngine`/`fakeBucket` and a stubbed `fetch`; the real engine is proven live on the Mac.

## Test contract
- [AC5] vitest `r2.test.ts` (stubbed `fetch`): `has` 200 → true, 404 → false, 403 throws; `put` sends `PUT`, `content-type: audio/mpeg`, an `authorization` header starting `AWS4-HMAC-SHA256 Credential=<id>/<date>/auto/s3/aws4_request`; and the SigV4 signature for a fixed date, key pair and request equals a value computed independently with `python3 hashlib/hmac` (the test pins the hex).
- [AC5] vitest `omnivoice.test.ts` (stubbed worker and `spawnSync` seam): override `say` and `seed` reach the worker request by key; a voice without an override uses the cast seed; unknown voice → `unknown voice: x`; gate fail → seed + 1000 on retry, fail after 4; a pinned override is attempted once.
- [NFR] `R2_BUCKET= pnpm render:audio m.json` exits 2 with `R2_BUCKET is missing or empty (set it in .env)`, no network call.
- [AC5] Live on the Mac: `pnpm import:content content --sink bundle --only lessons/hsk1` then `pnpm render:audio <out>/<sha>/audio-manifest.json --limit 5` → `5 uploaded, 0 skipped`; again → `0 uploaded, 5 skipped` and the Python worker is not started; `curl -sI <R2_PUBLIC_URL>/<key>.mp3` → `200`, `content-type: audio/mpeg`; `curl -s … | ffprobe -` → mp3, 1 ch, 24000 Hz; a CORS `curl -H 'Origin: …'` returns the allow-origin header; then the full Bài 1 manifest (25 sentence/word keys), and its sentence keys play in a browser.

## Open assumptions
- [AC5] `content/cast.yaml` lands from PR #63 before S2 is pushed; the code reads its current shape (above) and S2 rebases on it.
- [AC5] Bucket and keys: the R2 keys on the cloud machine are scoped to the existing bucket (list and create are denied, HEAD on `R2_BUCKET` is allowed), so the public bucket, its r2.dev URL, CORS and a key pair scoped to it come from Loc (see PLAN Task 0).
