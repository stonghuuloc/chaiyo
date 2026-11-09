# CHY-22 S1 — discussion
ACs: AC1, AC2, AC3, AC4, AC5 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- Q9 A: Study takes a Mock Test result Attempt now; its shape is SPEC's `step { kind: 'mock', level, mode }` + `correct` = passed, added to C-M3-1. Q4 A shapes the AC2/AC4 sequences (Freeze at 7). The others do not touch this slice.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: where do titles live? A: in Study's `BADGES` list and in the event, as the AC asks ("emits BadgeEarned … titled …"). They are the prototype's (u1-badges.html:94-102), Vietnamese, the app's only language. Confidence 85%.
- [AC1] Q: "passes the Bài 0 Gate Test" — does placement count? A: yes. Passing the HSK 1 placement block "also passes" Bài 0 (CONTEXT.md "Pinyin Primer"), and the badge text is "Qua Bài 0" (u1-badges.html:94). Rule: Bài 0 has `passed: true`. Confidence 80%.
- [AC1] Q: "writes 50 characters correctly" — Attempts or characters? A: characters: each right `viet` card Attempt adds the hanzi count of its word (你好 = 2), matching "Viết đúng 50 chữ Hán" (u1-badges.html:102). A Luyện viết section Attempt counts when the lesson runner sends it with `card { word, skill: 'viet' }` (M-5). Confidence 80%.
- [AC1] Q: Mock Test result shape? A: one Attempt per sitting: `questionId` = the Mock Test id, `step { kind: 'mock', level, mode }`, `correct` = passed, `ms` = time taken, `answer` free for the runner. It rides the existing `step jsonb` column (CHY-24 S1), so no new column. Confidence 85%.
- [AC3] Q: "with the earned badges in state": how does a replay start with badges? A: `initialState({ badges })`. It also makes "never taken away" hold across a rule change: a badge earned under old rules stays when the Ledger refolds with the old badge map as seed. Keeping that map across restarts is CHY-24's (parked P8). Confidence 80%.
- [AC2] Q: Streak badges at "reaches 7": `=` or `≥`? A: `≥`, checked after each call, so a seeded State or a jump can never skip one. Confidence 90%.
- [AC4] Q: can `rollover` earn a badge? A: no: it only spends Freezes or resets, so nothing can newly hold. Confidence 90%.

## Open — assumed the recommendation, not blocking
### Q12 [AC1] Owner: Loc — Do words100 / words300 count Lexicon words that were never reviewed?
The AC says "the Lexicon reaches 100 words"; CONTEXT.md "Badge" says "words known"; the prototype card says "Học và lưu 100 từ vào Từ của tôi" (learn and save). A learner placed into HSK 2 gets about 505 HSK 1 words with no card at once (CHY-20 S2; its test fixture uses 250).
| | A — every Lexicon entry (AC literal) | B — entries with at least one card |
|---|---|---|
| placed into HSK 2, placement day | words100 fires | nothing |
| that learner, 20 new cards a day | — | words100 on day **5** (5 × 20) |
| 100 saved words, none reviewed | words100 fires | nothing |
| code | `Object.keys(lexicon).length` | count entries with `cards` non-empty |
rec: **A**. The AC is explicit and Loc's rule puts the AC over the design doc; a Badge is permanent, so B is the safer pick only if the "known" wording matters more. SPEC assumes A.

## Locked (do not re-open)
- Earned once, never removed, kept on reset; only Exam-mode results earn (STORY.md).
