# CHY-17 S1 — discussion
ACs: AC1, AC2 · design lead CHAA-58 · 2026-11-07

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: which clips must exist? A: every manifest entry of kind `syllable`: 1,641 = 1,620 cells (405 `syllables.yaml` rows × 4 tones, via `addTone`) + 21 multi-syllable Primer chips. The check reads the importer's manifest (C2) and also asserts all 1,620 cells are in it, so a manifest that lost a cell fails instead of passing short. Confidence 90%: counted on main fd2b67a (`1620 + 21 = 1641`).
- [AC1] Q: how does the check see the bucket? A: one `HEAD <R2_PUBLIC_URL>/<key>.mp3` per clip, 8 at a time. No secret needed, and it tests the URL a browser uses (CHY-15 AC5). 200 with `Content-Length` > 0 = present; 404 or an empty body = missing; 401/403, 429, 5xx or a network error = retried 3× where transient, then `unreachable`, exit 2, so an outage never reads as "1,641 missing". Confidence 85%. The alternative, a ListObjectsV2 with the R2 keys, needs secrets on every machine that runs the check and skips the public path.
- [AC1] Q: URL layout and env name? A: `<R2_PUBLIC_URL>/<key>.mp3` with `R2_PUBLIC_URL` from the process or `.env`, no trailing slash. Confidence 75%: CHY-15 S2 owns both and its design is not on main yet; the check changes in two lines if it picks other names (SPEC open assumption).
- [AC2] Q: label printed for a missing cell? A: `<syllable><tone digit>`, e.g. `ba3` for `bǎ`, `lü3` for `lǚ`; a chip prints its marked text (`nǐ hǎo`). Last line is always `missing: <count>`. Confidence 90%: AC2 prints `missing: ba3`; AC1 prints `missing: 0`.
- [AC2] Q: how is "deleted from the bucket" proven without hurting prod? A: two ways. (1) Hermetic: a temp folder of 1,641 empty-but-non-zero files served by `python3 -m http.server`, `R2_PUBLIC_URL` pointed at it, `ba3`'s file removed. (2) Live: delete `<key(bǎ)>.mp3` from the new dev bucket with the aws CLI, run the check, re-run the renderer (it re-uploads 1). The bucket is new and only dev reads it. Confidence 85%.
- [CHORE] Q: why no vitest file? A: vitest includes `src/**` only (vite.config.ts:56) and lane L4 owns no `src/` folder in S1; the falsifiable checks are the CLI controls, as in CHY-14 S1. Confidence 80%.

### Q1 [AC1] Owner: self (probe, then L2) — Which text makes the engine say the tone of a syllable?
**Setup** — manifest entry `{ kind: syllable, hanzi: "bǎ" }`. CHY-14's probe (45 clips, F0-scored) says no isolated form is reliable: `XING2` 4/9, toned marks 3/9, hanzi + uppercase 1/9.

| | C — in-sentence form | D — hanzi carrier by ear |
|---|---|---|
| text for `bǎ` | frame + `BA3`, e.g. `请读，BA3。` (the documented `打ZHE2出售` shape), clip trimmed to the syllable after the pause | a common character read `bǎ` (把) |
| covers all 1,620 cells | yes, any pinyin | no: many cells have no common character with that tone |
| work | trim step in the renderer's encode (L2) | a carrier table 405 × 4, partly hand-picked |
| risk | engine ignores the digit after a short frame; trim cuts wrongly | a wrong or rare character |

**Gap: unknown until scored; the isolated forms already fail (4/9 at best).** Settled by the same gate as before, not opinion: Task 0 renders the 48 probe clips in form C (and D for the cells that have a carrier) and scores the F0 contours (SPEC). 44 or more of 48 → C goes to L2; fewer → S1 stops and the Captain rules (a per-cell ear pass by Loc, or drop forced tones). Answered here, 60% that C passes, so this is the slice's main risk, stated up front.

### Q3 [AC1] Owner: self — How does the check see a wrong tone?
**Setup** — cell `ba3` exists on R2 but the engine said a rising tone.

| | A — HEAD only (today) | B — add `--tones`: download, score F0 |
|---|---|---|
| `ba3` wrong tone | `missing: 0`, exit 0 | `tone: ba3 heard 2`, exit 1 |
| cost | 1,641 HEADs, about 20 s | 1,620 GETs, about 20 MB, plus a scorer |
| files | 1 | + `scripts/syllable-f0.py` (parselmouth, run by uv) |

**Gap: 1 wrong clip passes today.** Answered here, 85%: B, behind a flag so the default check stays fast and needs no Python. Contour rules are the SPEC probe thresholds; chips are skipped.

## Open — needs an answer before execute
None for Loc.

## Routing
Captain: pass Task 0's result (the winning syllable text form) to CHY-15 S2 before it plans. Execute needs CHY-15 S2 (renderer, bucket, `R2_PUBLIC_URL`) for the render run; the check script itself can be built and proven on the hermetic fixture before that.

## Locked (do not re-open)
- Key rule and `narrator` voice (STORY.md). The check never calls the importer; it reads the manifest C2 writes.
