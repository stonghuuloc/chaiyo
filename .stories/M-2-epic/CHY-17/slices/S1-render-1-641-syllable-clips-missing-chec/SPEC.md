# CHY-17 S1 — spec
ACs: AC1, AC2  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a)

## Behaviour
- [AC1] `pnpm check:syllable-clips` reads `static/content/current.json` → `static/content/<sha>/audio-manifest.json` (or the path given as the first argument). Expected set = every entry of kind `syllable` (1,641 on main today).
- [AC1] It also derives the cells from `content/syllables.yaml` (each row × tones 1-4 via `addTone`, key via `audioKey(text, 'narrator')`): 405 × 4 = 1,620 cells, each must be a manifest entry, else it prints `not in manifest: <label>` and exits 1.
- [AC1] For each expected entry it sends `HEAD ${R2_PUBLIC_URL}/<key>.mp3`, 8 in flight. Present = HTTP 200 with `Content-Length` > 0. 404, or 200 with `Content-Length` 0 = missing; any other status = unreachable (exit 2).
- [AC1] All present → stdout ends with `missing: 0`, preceded by `syllable clips: 1641 (1620 cells, 21 chips)`; exit 0.
- [AC2] Any missing → one line `missing: <label>` per clip, in manifest order, then the last line `missing: <count>`; exit 1. Label = `<syllable><tone digit>` for a cell (`ba3`, `lü3`), the marked text for a chip (`nǐ hǎo`).
- [AC2] Deleting only the clip of `bǎ` → stdout contains `missing: ba3` and the last line is `missing: 1`; no other `missing:` line.
- [AC1] A transport failure (connection refused, 429, 5xx after 3 tries with 0.5 s, 1 s, 2 s waits) prints `unreachable: <label> <status or error>` per failing clip and starts no new probe after the 5th (in-flight ones finish; a dead server costs about 8 s, not 12 minutes), then `unreachable: <count>`, exit 2. It never prints `missing: 0`.
- [AC1] `R2_PUBLIC_URL` comes from the process or `.env` (`process.loadEnvFile`, process wins). Empty → `R2_PUBLIC_URL is missing or empty (set it in .env)`, exit 2, no request. No manifest → `no audio manifest: run pnpm import:content content --sink bundle --only lessons/hsk1`, exit 2.
- [NFR] The only thing logged about the request is label, status and error text: never a header, never an env value.
- [AC1] The 1,641 clips exist in the new R2 bucket after Loc's Mac runs CHY-15's renderer on the manifest.
- [CHORE] Each clip must sound as its toned syllable (S2's AC3/AC4 depend on it); the probe gate below decides the text form before any full render.
- [CHORE] Probe gate before the full render: 12 syllables (ba ma di xi yu lü zhi chi shu huo nian ang) × 4 tones, rendered the way the renderer will send them. F0 per clip in semitones relative to its median, three thirds (start, mid, end): tone 1 level (|end−start| < 2), tone 2 rising (end−start ≥ 3), tone 3 dip (mid ≤ start−1 and mid ≤ end−1), tone 4 falling (start−end ≥ 4). Pass = ≥ 44 of 48 clips match.
- [CHORE] `package.json` gains `"check:syllable-clips": "tsx scripts/check-syllable-clips.ts"`; `pnpm check`, `pnpm lint`, `pnpm test` stay green; a strict `tsc --noEmit` of the script exits 0.

## Not this slice
- AC3 (cell plays the tone) and AC4 (20-cell tap test) → S2.
- The renderer's text for a syllable, R2 upload, the bucket and `R2_PUBLIC_URL` → CHY-15; the check only consumes them.

## Seam
One CLI, `scripts/check-syllable-clips.ts`. It imports `audioKey`, `addTone` from `src/lib/content/import/audio.ts`; it writes nothing.

## Test contract
- [AC1] Hermetic: a temp dir `D` holds a file `<key>.mp3` (1 byte) for each of the 1,641 manifest syllable keys; `python3 -m http.server` serves `D`; `R2_PUBLIC_URL=http://127.0.0.1:<port> pnpm -s check:syllable-clips` → exit 0, last line `missing: 0`, line `syllable clips: 1641 (1620 cells, 21 chips)`.
- [AC2] Same fixture, delete `<audioKey('bǎ','narrator')>.mp3` → exit 1, stdout has `missing: ba3`, last line `missing: 1`. Delete the files of `lǚ` and `nǐ hǎo` too → lines `missing: lü3` and `missing: nǐ hǎo`, last line `missing: 3`. Replace one file with a 0-byte file → counted missing.
- [AC1] Controls: server stopped → exit 2, `unreachable:` lines, no `missing: 0`. `R2_PUBLIC_URL= pnpm check:syllable-clips` → exit 2 with the missing-var line. A manifest copy without the `bǎ` entry (path argument) → `not in manifest: ba3`, exit 1.
- [AC1] Live, Mac, after CHY-15 S2 and the render: the check against the real `R2_PUBLIC_URL` → exit 0, `missing: 0`. The probe gate's 48-row table (syllable, tone, start, mid, end, verdict) goes in VERIFY.md.
- [AC2] Live: `aws s3 rm` the key of `bǎ` from the dev bucket → check exits 1 with `missing: ba3`; the renderer's re-run prints 1 uploaded; check exits 0 again.
- [CHORE] `pnpm check && pnpm lint && pnpm test --maxWorkers=2` green; `npx tsc --ignoreConfig --noEmit --strict --module preserve --moduleResolution bundler --target es2023 --types node --skipLibCheck scripts/check-syllable-clips.ts` exits 0.

## Open assumptions
- [AC1] URL = `<R2_PUBLIC_URL>/<key>.mp3` and the variable is `R2_PUBLIC_URL` (DISCUSSION answered-here, 75%). If CHY-15 S2 picks another layout, the wrong guess costs a two-line change; the 1,641 HEADs would all read `missing` until fixed, which is loud.
- [AC1] The renderer sends a syllable's text as in Q1 (B first). If neither form passes the probe, AC1's "has a clip" is met by file presence only; AC1 can still pass on file presence; the render does not run until the Captain rules.
