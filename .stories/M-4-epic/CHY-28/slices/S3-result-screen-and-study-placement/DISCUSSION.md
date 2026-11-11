# CHY-28 S3 — discussion
ACs: AC4, AC5 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- M-3 Q3 A: `settings.tz` ends the learner's day; M-3 Q11 A: placed words get thẻ từ cards only.

## Answered here (≥80% rule, CREW.md)
- [AC5] Q: where does the app keep the learner's Ledger? A: `src/lib/learner`, one per uid, database `chaiyo-ledger-<uid>` (the per-learner rule CHY-26 S3 proves on `/dev/ledger`). Placement is its first caller; lesson screens (M-5) reuse it. Confidence 85%.
- [AC5] Q: record on the test page or on the result page? A: the result page: the Attempts reach the Ledger only when the run is over (AC3 exit saves nothing), and a reload there is safe because the Ledger ignores known ids. Confidence 85%.
- [AC5] Q: "lessons … open as 'qua bằng kiểm tra'" — whose label? A: Study marks them passed (progress.ts:55-58); the Roadmap (CHY-49) renders the label. This slice proves the state. Confidence 85%.
- [AC4] Q: where does the CTA go? A: `/today` for 0-4 (Home shows the current lesson, CHY-45; no lesson hub route exists; the prototype's roadmap link was itself a stand-in, "prototype: only Bài 1 has a lesson page", o3-result.html:79), `/roadmap` for "Xem Chuyên đề" (no Chuyên đề screen exists). Confidence 80%.
- [AC4] Q: which confetti size? A: the prototype rule (o3-result.html:83): none below 2 levels, normal at 2-3, big at 4-5; "yes" at 2 and "yes, bigger burst" at 4 and 5 in the AC table match it. Confidence 95%.
- [AC4] Q: a confetti library? A: no: the prototype's 75 lines port as is, and no dependency is added. Confidence 85%.
- [AC4] Q: 0 cleared, "no shame copy"? A: the prototype's Bài 0 copy, plus a test that the view holds none of "trượt", "chưa đạt", "tiếc". Confidence 85%.

## Open — needs an answer before execute
None: WAVE-PLAN Q3 is assumed A.

## Locked (do not re-open)
- Placement never demotes; words join unreviewed, ~20 new a day (CONTEXT.md "Placement Test", M-3 Q11 A).
