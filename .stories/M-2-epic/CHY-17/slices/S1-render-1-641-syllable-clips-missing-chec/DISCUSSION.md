# CHY-17 S1 — discussion
ACs: AC1, AC2 · design lead CHAA-58 · 2026-11-07

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: which clips must exist? A: every manifest entry of kind `syllable`: 1,641 = 1,620 cells (405 `syllables.yaml` rows × 4 tones, via `addTone`) + 21 multi-syllable Primer chips. The check reads the importer's manifest (C2) and also asserts all 1,620 cells are in it, so a manifest that lost a cell fails instead of passing short. Confidence 90%: counted on main fd2b67a (`1620 + 21 = 1641`).
- [AC1] Q: how does the check see the bucket? A: one `HEAD <R2_PUBLIC_URL>/<key>.mp3` per clip, 8 at a time. No secret needed, and it tests the URL a browser uses (CHY-15 AC5). 200 with `Content-Length` > 0 = present; 404 or an empty body = missing; 401/403, 429, 5xx or a network error = retried 3× where transient, then `unreachable`, exit 2, so an outage never reads as "1,641 missing". Confidence 85%. The alternative, a ListObjectsV2 with the R2 keys, needs secrets on every machine that runs the check and skips the public path.
- [AC1] Q: URL layout and env name? A: `<R2_PUBLIC_URL>/<key>.mp3` with `R2_PUBLIC_URL` from the process or `.env`, no trailing slash. Confidence 75%: CHY-15 S2 owns both and its design is not on main yet; the check changes in two lines if it picks other names (SPEC open assumption).
- [AC2] Q: label printed for a missing cell? A: `<syllable><tone digit>`, e.g. `ba3` for `bǎ`, `lü3` for `lǚ`; a chip prints its marked text (`nǐ hǎo`). Last line is always `missing: <count>`. Confidence 90%: AC2 prints `missing: ba3`; AC1 prints `missing: 0`.
- [AC2] Q: how is "deleted from the bucket" proven without hurting prod? A: two ways. (1) Hermetic: a temp folder of 1,641 empty-but-non-zero files served by `python3 -m http.server`, `R2_PUBLIC_URL` pointed at it, `ba3`'s file removed. (2) Live: delete `<key(bǎ)>.mp3` from the new dev bucket with the aws CLI, run the check, re-run the renderer (it re-uploads 1). The bucket is new and only dev reads it. Confidence 85%.
- [CHORE] Q: why no vitest file? A: vitest includes `src/**` only (vite.config.ts:56) and lane L4 owns no `src/` folder in S1; the falsifiable checks are the CLI controls, as in CHY-14 S1. Confidence 80%.

### Q1 [AC1] Owner: self (probe, then L2) — Which text does the engine get for a syllable?
**Setup** — manifest entry `{ kind: syllable, hanzi: "bǎ" }`; the renderer sends `hanzi` unless it says otherwise (audio.ts:5-13).

| | A — marked pinyin as is | B — OmniVoice tone-number pinyin |
|---|---|---|
| text sent for `bǎ` | `bǎ` | `BA3` |
| text sent for `nǐ hǎo` | `nǐ hǎo` | `NI3 HAO3` |
| engine support | none documented; may spell letters or guess a hanzi | documented (`ZHE2`) |
| work for L2 | none | a pure `syllableText(entry)` for kind `syllable` |

**Gap: unknown until heard.** Settled by a measured gate, not by opinion: Task 0 renders 12 syllables × 4 tones = 48 clips each way and measures the F0 contour (SPEC thresholds). The form with ≥ 44/48 matching contours wins; B first if both pass. Answered here, 80% that B passes; the probe is cheap (96 clips). If neither passes, S1 stops and reports to the Captain: the fix is a different carrier, a CHY-15/CHY-14 decision.

## Open — needs an answer before execute
None for Loc.

## Routing
Captain: pass Task 0's result (the winning syllable text form) to CHY-15 S2 before it plans. Execute needs CHY-15 S2 (renderer, bucket, `R2_PUBLIC_URL`) for the render run; the check script itself can be built and proven on the hermetic fixture before that.

## Locked (do not re-open)
- Key rule and `narrator` voice (STORY.md). The check never calls the importer; it reads the manifest C2 writes.
