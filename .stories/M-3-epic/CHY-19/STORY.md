# CHY-19 — Study: FSRS per skill + session builder

## Goal (business why, 1-2 sentences)
Schedule one review card per word per skill (thẻ từ, nghe, viết chữ) with FSRS and build the daily Practice session from those cards, so knowing a word on a flashcard never hides that the learner can't hear or write it.

## Context an agent can't derive from code
- `src/lib/study` does not exist yet. Study is pure TS with no I/O (docs/architecture.md:30, :40-41): `apply(state, input, now) → { state, events }`. It schedules at `now` and never reads a clock; the Ledger (CHY-24) folds with `now = attempt.at` (WAVE-PLAN C-M3-2).
- Skill ids are the prototype's: `the` (Thẻ từ, 10 s), `nghe` (Nghe, 15 s), `viet` (Viết chữ, 35 s) (prototype/data/lexicon.js:7-10). The ticket's "thẻ từ / nghe / viết chữ" and `only "viet"` map to these.
- A card is keyed by the content word id, which equals the hanzi except for split polyphones (`content/words/和-he4.yaml`, 603 files). A saved word that no lesson teaches keys on its hanzi. Bài 1 ids: 你 好 您 你们 你好 对不起 没关系 谢谢 不客气 再见 (content/lessons/hsk1/h1-01.yaml:36).
- ts-fsrs is not installed. The current release is 6.0.0 (MIT, Node ≥ 24): `await DefaultScheduler(options)` is async, cards carry `dueAt`/`lastReviewAt` as `Date`, and `review()` rejects a card whose dates came back from JSON as strings ("Expected valid Date fields", checked on the Mac). The old `fsrs()` API is deprecated.
- "Given … 'known' / 'learning'" in the ACs are prototype labels (lexicon.js:84: known = next review ≥ 7 days away). The tests read them that way: known = due ≥ 7 calendar days out, learning = reviewed and due sooner.
- "No recorded clip" (AC4) is the prototype rule "listening needs a recorded clip" (lexicon.js:47): only taught words have clips, so a saved word that no lesson teaches gets no nghe card.
- The Attempt type is shared with CHY-23's `attempts` table: WAVE-PLAN C-M3-1. Change one, change both.

## Locked decisions (BA/Loc already ruled — never re-open)
- One card per word per skill; an Attempt updates only its own skill's card (CONTEXT.md "Practice", "Lexicon").
- Study is tested only through its public functions with Attempt sequences (docs/architecture.md:30, :55; AC7).
- FSRS via ts-fsrs (NOTES.md "Extras": "SRS review (FSRS, `ts-fsrs`)").

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | One Attempt schedules only its own skill's card | high | S1 |
| AC2 | Remembering pushes the card further than forgetting | high | S1 |
| AC3 | Same word, three skills, three cards | high | S1 |
| AC4 | A saved word has no listening card | high | S2 |
| AC5 | Today's session interleaves skills, 10 cards, ≈ 3 phút | high | S2 |
| AC6 | Single-skill filter: viết chữ only, 2 cards, ≈ 1 phút | high | S2 |
| AC7 | Study is tested through Attempts only | high | S1 |

## Out of scope
- Sections, Gate Test, unlocks, placement, the 20 new cards a day cap (CHY-20); Streak and Freeze (CHY-21); Badges (CHY-22); storage and sync (CHY-23, CHY-24); the Luyện tập screens (CHY-41, CHY-42).
- Lexicon promotion from "tự thêm" to taught (CHY-20, with lesson words).
