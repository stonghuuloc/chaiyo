# CHY-15 S2 — live verification (AC5)

Run 2026-11-08 on the Mac (MPS), repo at origin/main 406e2ee, OmniVoice venv from the CHY-14 spike (`OMNIVOICE_PYTHON`), bucket public URL `https://pub-edf5a7c495064102892f8f7b002d2259.r2.dev`.

**AC5: ticked.** Bài 1 clips play from the R2 public URL.

| # | Command | Output |
|---|---|---|
| 1 | `pnpm import:content content --sink bundle --only lessons/hsk1` | sha `02ff4a8e…7551`; `audio-manifest.json` holds 2997 entries (1346 sentence, 1641 syllable, 10 word), not the 1,666 the plan quoted. Bài 1 = 15 sentences (`s-h1-01`) + 10 words. |
| 2 | `pnpm render:audio <manifest> --kind sentence --ref-prefix s-h1-01 --limit 3` | `3 uploaded, 0 skipped` (97.8 s incl. model load; all three passed the gate: no failed lines) |
| 3 | same command again | `0 uploaded, 3 skipped` (skip-existing) |
| 4 | `pnpm render:audio <manifest> --kind sentence --ref-prefix s-h1-01` | `12 uploaded, 3 skipped` |
| 5 | `pnpm render:audio <manifest> --kind word` | `10 uploaded, 0 skipped` (376.5 s for 4 + 5 together) |
| 6 | both again | `0 uploaded, 15 skipped`, `0 uploaded, 10 skipped` |

Public URL, sample (`s-h1-01-18`, narrator, 不客气。): `curl -sI -H 'Origin: http://localhost:5173' $R2_PUBLIC_URL/0c434bfd…52e7.mp3`

```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Content-Length: 7005
Access-Control-Allow-Origin: http://localhost:5173
Cache-Control: public, max-age=31536000, immutable
```

`ffprobe` of the downloaded body: `codec_name=mp3 sample_rate=24000 channels=1 duration=1.075`. Two more samples (`s-h1-01-01` redpanda 你好！ 0.949 s, `s-h1-01-10` narrator 你好！ 1.329 s) gave the same headers and format.

Sweep: all 25 Bài 1 keys (15 sentences + 10 words) fetched with an Origin header: 25/25 answered `200 audio/mpeg` and decode as mp3, 24000 Hz, 1 channel.

Pace: durations match the per-voice atempo (redpanda 0.85, narrator 0.75; 你好！ is 0.95 s redpanda vs 1.33 s narrator). The gate ran in-process (rate, clipping, Whisper); no `failed:` line in any run.

Not checked here: playback in a browser (ffprobe decode only), CORS for the production origin (only `http://localhost:5173` was tested).
