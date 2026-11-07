# CHY-17 S2 — discussion
ACs: AC3, AC4 · design lead CHAA-58 · 2026-11-07

## Answered here (≥80% rule, CREW.md)
- [AC3] Q: "the Pinyin Table" is an M-5 screen (CHY-40, which depends on CHY-17). Where is AC3 proven? A: a "Syllables" section on the dev-only `/dev/audio` route, as Loc ruled (WAVE-PLAN Q6 A). The grid is the 405 `syllables.yaml` rows grouped by initial; tap a cell, then a tone button 1-4. Confidence 95%: Loc's answer.
- [AC3] Q: what proves "the clip played is ba3 in the narrator voice"? A: the browser's request for `<R2_PUBLIC_URL>/<key>.mp3` with `key = sha256("bǎ|narrator")`, plus an on-page line `Last played: ba3 · bǎ · <first 8 chars of key>`. The tone button also carries `data-clip="ba3"`. Confidence 90%: the key encodes text and voice, so a matching URL is the clip (audio.ts:15).
- [AC3] Q: "the tone I hear is rising"? A: Loc's ear (AC4 states it for 20 cells); the tester adds a machine check by running S1's F0 probe on the 4 clips of `ba`. Each tone button shows its contour text from the AC table (1 high and level, 2 rising, 3 falling then rising, 4 falling) so the expected sound is on screen. Confidence 85%.
- [AC4] Q: how are "20 randomly chosen cells" picked and checked? A: a "Random 20" button draws 20 distinct (syllable, tone) pairs out of 1,620 with a seeded PRNG; the seed is shown and `?seed=N` repeats a draw. Each row has ▶, "right", "wrong". Header `played k/20 · right r · wrong w`; when all 20 are marked, a line `wrong: ba3, lü2` (or `wrong: none`) is shown to copy. Confidence 85%: AC4 needs "every one plays" and "Loc confirms by ear", so the page must count plays and record his verdicts.
- [AC3] Q: where do the 4 keys per cell come from? See Q2.
- [CHORE] Q: files? A: new files only under `src/routes/dev/audio/`; the route itself (+page.svelte, dev guard, prerender off) is CHY-16 S2's (lane L3). Edits to L3's files are the 2-line mount and, if it has a `+page.server.ts`, one returned key. Confidence 85%.

### Q2 [AC3] Owner: self — Where does the grid get `sha256("bǎ|narrator")`?
**Setup** — cell `ba`, tone 3 → text `bǎ` → key (first 8 hex shown by the check output).

| | A — route `load` on the server | B — browser `crypto.subtle` |
|---|---|---|
| `addTone` / `audioKey` | imported from the importer (audio.ts:15, :29) | `addTone` copied (≈17 lines); audio.ts imports `node:crypto`, so it cannot be imported |
| copies of the key rule | 1 (importer) | 2 (importer + page); the duplication Q5 A exists to avoid |
| prod exposure | route 404s outside dev (L3's guard); the server function still ships | none |
| keys async in browser | no | 1,620 awaits on first paint |

**Gap: 1 copy of the key rule, 0 vs 17 lines.** Answered here, 85%: A. The product Pinyin Table gets keys from the bundle (Request below), not from either.

## Request (outside M-2 lanes) — for the Captain to route
CHY-37 (Primer) and CHY-40 (Bảng pinyin) need each syllable cell's four keys and each chip's key at runtime. Q5 A covers sentences, words, chips; syllable cells are a fourth shape. Ask for a CHY-8 follow-up slice: the bundle gets `syllables: [{ syllable, initial, final, audioKey: [k1, k2, k3, k4] }]` built with `addTone` + `audioKey` (`bundle.ts`, bundle-sink.ts:44 area). Cost today: 405 × 4 × 64 B ≈ **104 KB** raw before gzip, so it may prefer a lazy `syllables.json` fetched on first Primer visit. Parked, not built (story.py park).

## Open — needs an answer before execute
None for Loc. Execute needs CHY-16's `play` and the `/dev/audio` route (SPEC open assumption), and S1's clips on R2.

## Locked (do not re-open)
- One dev-only `/dev/audio` route, not in nav, not prerendered (Q6 A). Key rule and narrator voice (STORY.md).
