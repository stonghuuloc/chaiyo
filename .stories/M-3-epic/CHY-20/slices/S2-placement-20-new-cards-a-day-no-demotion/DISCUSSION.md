# CHY-20 S2 — discussion
ACs: AC6, AC7, AC8 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10)
- All ten on the recommended option. Q1 A sets the "about 4.8 days" in SPEC's table note; no other value here depends on them.

## Answered here (≥80% rule, CREW.md)
- [AC6] Q: does Study score placement blocks or take a "result"? A: Study scores them: one run per block (`step.kind = 'placement'`, `level`, `of = 10`), same run rules as the Gate. docs/architecture.md:30 lists "Placement blocks" among Study's hidden rules, and the block answers are Attempts like any other. Confidence 80%.
- [AC6] Q: when does a placed level take effect? A: as soon as its block passes. "The Learner may also stop after any passed block" (CONTEXT.md "Placement Test"), so there is no end-of-test result to wait for. Confidence 85%.
- [AC6] Q: blocks out of order? A: a block counts only when `level = placed + 1`: the test starts at HSK1 and moves up one level per passed block. Confidence 85%.
- [AC6] Q: which events? A: one `LessonUnlocked` for the first lesson of the next level; passed lessons are recorded in State without one event each (26 events for HSK 1 would be noise for the screen). Confidence 80%.
- [AC6] Q: "words in the Lexicon as new, not yet reviewed"? A: an entry with no cards, `saved: false` (taught). A saved word of those lessons is promoted. Confidence 85%.
- [AC7] Q: what does the cap of 20 count? A: thẻ từ cards created today, from any source (placement, saved, a lesson's Từ mới). "About 20 new cards per day, so a placed Learner is not buried" (CONTEXT.md) is about load per day, and a lesson's 10 new cards are load too. Confidence 80%.
- [AC7] Q: how does Study know a card is new today? A: `Card.first` = `now` of the creating Attempt. ts-fsrs 6 cards keep only `dueAt` and `lastReviewAt` as dates (CHY-19 advisor r1), so the creation time must be ours. Confidence 85%.
- [AC8] Q: does any rule lower Progress? A: no. `passed`, `unlocked`, `placed` only grow; a weak Gate run changes `best` only upward. Confidence 90%.

## Open — assumed the recommendation, not blocking
### Q11 [AC7] Owner: Loc — Which skills give a placed word new cards?
A learner placed into HSK 2 has about 505 HSK 1 words with no card (505 level-1 words in content/words, CHY-12 S2; the test fixture uses 250). Today only thẻ từ takes new cards (prototype/data/lexicon.js:56-57). Nghe and viết chữ cards appear only after an Attempt in that skill, which a placed learner never makes for HSK 1 words outside Practice.
| | A — thẻ từ only (prototype) | B — all three skills, one shared cap |
|---|---|---|
| new cards per day | 20 | 20 |
| days to introduce HSK 1's ~505 words | **26** | 76 (1,515 cards ÷ 20, rounded up) |
| HSK 1 words ever practised by ear / by hand | only if the learner opens those lessons | all ~505 |
| code | the lane rule in SPEC | new nghe / viet lanes + an order across skills |
rec: **A**. It matches the prototype and keeps the placed learner moving; listening and writing for skipped words is a Practice design call for CHY-42. SPEC assumes A.

## Locked (do not re-open)
- Blocks of 10, 80 %, stop at the first failed block, about 20 new cards a day, never demoted (STORY.md).
