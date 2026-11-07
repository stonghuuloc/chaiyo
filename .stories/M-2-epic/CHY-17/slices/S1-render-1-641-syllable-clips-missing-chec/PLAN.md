# CHY-17 S1 — plan
ACs: AC1, AC2  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-17  ·  script work runs anywhere; the render and the probe run on Loc's Mac

## Anchors (verified 2026-11-07 on main fd2b67a)
- `src/lib/content/import/audio.ts:15` `audioKey(text, voice)`; `:29` `addTone(syllable, tone)`; `:70-84` how the 1,641 syllable entries are built (405 × 4 + chips + question prompts); both are exported, `audioManifest` is also re-exported by `import/index.ts:1`.
- `src/lib/content/import/bundle-sink.ts:12` `current.json` = `{ sha }`; `:44` writes `<sha>/audio-manifest.json` = `{ sha, entries: AudioEntry[] }`.
- `content/syllables.yaml` — 405 rows `{ syllable, initial, final }`, includes `lü`, `lüe`, `nü`, `nüe`.
- `scripts/lint-content.ts:4-8` — CLI style (argv, `statSync`, `console.error`, `process.exit`); `scripts/import-content.ts:7-12` — `fail()` helper shape.
- `package.json:18-19` — `lint:content`, `import:content`; add the script after :19. `yaml` is a dependency (package.json:58). Node 24 has `process.loadEnvFile`.
- `vite.config.ts:56` — vitest includes `src/**` only; this slice has no vitest file.
- Not on main yet (CHY-15 S2): the renderer CLI name, `R2_PUBLIC_URL`, object layout. Re-check against its branch before Task 3.

## Task 0 [CHORE] Probe: does the engine say the tone? (Mac, scratch, no commit; runs once CHY-14 S2's narrator profile exists, before CHY-15 S2 is planned; the Captain passes the winning form to CHY-15 S2's design)
Files: scratch only, `~/.capy/work/chy17-probe/` (a `probe.py`, run with `uv run --with parselmouth --with numpy`)
- Render 12 syllables (ba ma di xi yu lü zhi chi shu huo nian ang) × tones 1-4 with OmniVoice's narrator voice in form C (frame `请读，BA3。`, language Chinese) and, for cells that have a common character, form D. Trim C to the syllable after the pause (ffmpeg silencedetect; the first voiced run after the gap). Time the renders. Pace: the clip goes through the same ffmpeg encode as production, including the voice map's `atempo` once CHY-14 S2 pins it.
- F0 (parselmouth `to_pitch`, 75-400 Hz), voiced frames to semitones vs the clip median, thirds start/mid/end, classify per SPEC. Worked check: tone 2 thirds 180/200/230 Hz → +4.24 st rising ✓; tone 4 240/210/170 → 5.97 falling ✓; tone 1 215/220/218 → 0.24 level ✓; tone 3 190/160/185 → mid −2.97 vs start, −2.50 vs end, dip ✓.
- Paste `probe.py` into VERIFY.md. Set the language to Chinese explicitly.
- Verify: a 48-row table per form; the winner (B first on a tie) has ≥ 44 matches. Both < 44 → stop, report (DISCUSSION Q1). Winner C → message the CHY-15 lane (via the Captain) with the frame, the trim rule and the `lü` spelling the engine accepts (`LV3` or `LÜ3`; the probe's `lü` row decides). Winner D → the carrier table for L2 to read. Neither → stop. Seconds per clip × 1,641 = the render's wall time, written in VERIFY.md.

## Task 1 [AC1] [AC2] The check script
File: `scripts/check-syllable-clips.ts` (new)
- Test first: the fixture block's controls (in VERIFY.md, not committed) fail before Task 1 (script absent: ERR_MODULE_NOT_FOUND) and pass after.
- Load env: `process.loadEnvFile('.env')` when the file exists; process values win. Empty `R2_PUBLIC_URL` → exit 2 line (SPEC).
- Manifest: argv[2] or `static/content/current.json` → `<sha>/audio-manifest.json`; none → exit 2 line. `entries.filter(kind === 'syllable')`.
- Cells: parse `content/syllables.yaml` with `yaml`, for each row × tone 1-4 `addTone`, key `audioKey(text, 'narrator')`; a cell key absent from the manifest set → `not in manifest: <label>`.
- Label: cell → `row.syllable + tone`; chip → its marked `hanzi`. Chip = a syllable entry whose key is not a cell key.
- Pool of 8 workers over the entries; `fetch(url, { method: 'HEAD' })`; retry on 429, 5xx and thrown errors 3× with 500/1000/2000 ms; classify present / missing / unreachable.
- Output per SPEC: summary line, `missing:` lines in manifest order, final `missing: <n>`; exit 0 / 1 / 2 (2 wins over 1 when both occur, since the missing count is not trustworthy).
- Verify: the SPEC hermetic controls (exit codes and lines).

## Task 1b [AC1] --tones scoring
Files: `scripts/check-syllable-clips.ts`, `scripts/syllable-f0.py` (new)
- Promote Task 0's `probe.py` classifier into `syllable-f0.py` (path in, contour out). With `--tones` the script GETs each cell clip to a temp dir, runs it via `uv run --with parselmouth --with numpy`, prints SPEC lines, exit 1 on any mismatch.
- Verify: on the Task 0 clips, 44 or more match; a clip of `ba2` stored as `ba3` in the hermetic fixture → `tone: ba3 heard 2`, exit 1.

## Task 2 [CHORE] Wiring
Files: `package.json:19`
- Add `"check:syllable-clips": "tsx scripts/check-syllable-clips.ts"` after `import:content`. `.env.example` is L2's R2 public block: not edited here.
- Verify: `pnpm check && pnpm lint && pnpm test --maxWorkers=2` green; the strict `tsc` command from SPEC exits 0.

## Task 3 [AC1] Render and check live (Mac, after CHY-15 S2)
Files: none (run)
- Precondition: if Task 0 picked C or D, the renderer on the base builds syllable text and trims as Task 0 found; if not, stop and ask the Captain. No render.
- `pnpm import:content content --sink bundle --only lessons/hsk1`, then CHY-15's renderer on that manifest with the Task 0 text form; it is idempotent, so an interrupted run resumes.
- Verify: `pnpm -s check:syllable-clips` → exit 0, `missing: 0`, 1641 clips. Spot-check 5 public URLs with `curl -sI`: 200, `audio/mpeg`.

## Task 4 [AC2] Live delete control (Mac)
Files: none (run)
- `AWS_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY aws s3 rm s3://<public bucket>/<key(bǎ)>.mp3 --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com --region auto` (export from `.env`, never echo) → check exits 1, `missing: ba3`; the renderer re-run prints 1 uploaded; check exits 0.
- If the re-run prints 0 uploaded (the skip reads local state), re-upload bǎ with the renderer's force-one-key option, or ask L2; S1 is not done until the check exits 0 again.
- Run against the r2.dev URL. If `R2_PUBLIC_URL` is a cached custom domain, add `?nocache=<ts>` to the HEAD or purge first.

## Mutation paths covered
- Clean run (exit 0), one missing (exit 1), several missing incl. a chip, empty file, server down (exit 2), manifest without a cell, empty env var, no manifest. A re-run after repair (Task 4) returns to exit 0.

## Rollback
`git revert` of the script + package.json line. The 1,641 clips stay on R2 (idempotent store; deleting them needs the bucket owner).
