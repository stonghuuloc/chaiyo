# CHY-28 S1 — discussion
ACs: AC1, AC2 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- M-3 Q11 A (placed words: thẻ từ only, 20 a day) and the placement rules in Study (CHY-20 S2). ADR 0007: lesson audio is raw Azure.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: which bank? A: the prototype's 50 items, unchanged (prototype/data/placement.js). Loc wrote it for this screen; it is marked DRAFT, so a content edit later changes data only, not code. Confidence 80%.
- [AC1] Q: bank in `content/` through the importer, or a TS module? A: a TS module. The importer's bundles reach production only after CHY-25 S2 adds `vercel.json` (CHY-25 STORY), and the bank is one fixed 50-item list, not per-lesson content. Confidence 80%.
- [AC1] Q: which voice for the listening clips? A: the lesson word rule (redpanda, `poetry-reading`, `words/`), so a word that a lesson also teaches (谢谢, 再见) reuses the same clip and key. The prototype's edge-tts clips break ADR 0004/0007. Confidence 90%.
- [AC1] Q: why commit clips.json instead of hashing in the browser? A: `audioKey` uses `node:crypto` (audio.ts:1); a generated file plus a drift test keeps the browser free of it. Confidence 85%.
- [AC1] Q: what is `contentSha` on a Placement Attempt? A: `'placement-1'`, the bank version; a bank edit bumps it so old Attempts stay traceable. Confidence 80%.
- [AC2] Q: answer all 10 items of a level that is already cleared? A: yes, as the prototype does (o2-placement.html:65-72): Study closes a run only at `of` answers (progress.ts:36-42), so stopping at 8 right would place nobody. Confidence 90%.
- [AC2] Q: one run id per level or per test? A: per level: Study's run check rejects a step whose `level` differs from the run's first step (progress.ts:25). Confidence 95%.
- [CHORE] Q: why is the curriculum here? A: S3 needs lessons per level for the result copy and for Study's placement fold, and no module provides them (WAVE-PLAN Q3). It is generated from `content/lessons` and guarded by a drift test, so new lessons (CHY-59) show up after `pnpm curriculum`. Confidence 80% for the shape; the source itself is Q3.

## Open — needs an answer before execute
None: WAVE-PLAN Q3 is assumed A.

## Locked (do not re-open)
- Blocks of 10, 80 % per block, never demoted (CONTEXT.md "Placement Test").
