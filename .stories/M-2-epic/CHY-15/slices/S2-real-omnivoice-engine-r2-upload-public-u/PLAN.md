# CHY-15 S2 — plan
ACs: AC5  ·  Spec rev 0 (frame)  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-15-S2 (stacked on CHY-15)

## Anchors
- [CHORE] `src/lib/content/import/bundle-sink.ts:44-45` manifest shape; `.env.example:4-8` R2 block; `package.json:19` script slot; `scripts/lint-content.ts:4-8` CLI style.

## Tasks (frame; detailed once ADR 0003 names how voices are pinned)
- [AC5] R2 bucket adapter `src/lib/audio-renderer/r2.ts` + test with a stubbed S3 client.
- [AC5] OmniVoice engine adapter `src/lib/audio-renderer/omnivoice.ts` per ADR 0003.
- [AC5] CLI `scripts/render-audio.ts`, `package.json` script, `.env.example` block.
- [AC5] Live: create bucket, render Bài 1 on the Mac, curl the public URL.
