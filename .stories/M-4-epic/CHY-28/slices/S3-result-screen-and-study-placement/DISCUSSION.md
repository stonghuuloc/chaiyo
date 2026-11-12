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

- [AC5] Q: how do the 25 Attempts reach the server while the learner stays online (PR #107 review)? A: the page calls `ledger.sync()` after recording. CHY-26 S3 makes a sync already in flight push the records that land during it. Without both, the Attempts stay pending until a network change, and a second device never sees the placement. Confidence 85%.

- [AC5] Q: offline with an expired access token, getSession() is null; does the learner Ledger fall back to a shared db (the dev ledger opens chaiyo-ledger-dev)? A: no. learnerLedger takes a session and has no shared fallback. With no session the result page shows the result but records nothing and keeps the handoff in sessionStorage, so the Attempts reach the learner's own Ledger on the next visit with a session (sessionStorage survives a reload). Confidence 85%.
- [AC5] Q: when does /placement/result remove the handoff? A: it reads it on mount and removes it once every record has persisted (a reload in between re-records known ids, which the Ledger ignores). An exit from /placement writes nothing (S2). Confidence 85%.
- [AC4] Q: the desktop result is 1040px wide, wider than FocusFrame's columns. A: FocusFrame gets a `wide` prop (R2 file, 3 lines) instead of a second frame in the page; --col = narrow + form + 80px (1040), no new token. Result art ships placed-1280.webp (3:2, from assets/onboard/placed.png). Confidence 80%.
- [AC4] Q: the Bài 0 start art at desktop? A: start-b0.webp (860w) only; the SPEC names only placed-1280. Confidence 80%.

## Open — needs an answer before execute
None: WAVE-PLAN Q3 is assumed A.

## Locked (do not re-open)
- Placement never demotes; words join unreviewed, ~20 new a day (CONTEXT.md "Placement Test", M-3 Q11 A).
