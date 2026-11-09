# CHY-19 S1 — discussion
ACs: AC1, AC2, AC3, AC7 · design lead CHAA-103 · 2026-11-09

## Answered here (≥80% rule, CREW.md)
- [AC2] Q: an Attempt says right or wrong; FSRS wants Again/Hard/Good/Easy. A: right = Good, wrong = Again; Hard and Easy unused. Confidence 90%: the Attempt has no confidence field (CONTEXT.md "Attempt"), and the prototype's `review(hz, remembered)` is binary too (prototype/data/lexicon.js:80).
- [AC1] Q: which ts-fsrs API? A: `DefaultScheduler({ enableFuzz: false })` from ts-fsrs 6.0.0, created once with top-level `await` in `src/lib/study/fsrs.ts`, so `apply` stays synchronous. Confidence 85%: the sync alternative (`defineScheduler` + each middleware by hand) copies the library's internal preset, and `createRuntimeDefaultSchedulerDefinition` is not exported (checked in dist/index.mjs). Parameter values follow WAVE-PLAN Q1; S1 starts on Q1 A, which is the library default.
- [AC1] Q: what is "due in 9 days"? A: calendar days in the learner's timezone between `now` and the card's due. The fixture's 你好 thẻ từ (two right answers 10 min apart, the day before) is due 2026-11-18T03:52Z = 18 Nov 10:52 in Asia/Ho_Chi_Minh, 9 days after 9 Nov. Confidence 85%: computed with ts-fsrs 6.0.0 on the Mac.
- [AC1] Q: "known" / "learning" in the Given? A: fixture labels, not a Study field: known = due ≥ 7 days out (lexicon.js:84, `ivl >= 7`), learning = reviewed, due sooner. No AC reads a label from Study, so none is exported. Confidence 85%.
- [AC1] Q: how does a word enter State? A: the first card Attempt (an Attempt with `card`) for a word adds it to the Lexicon as taught. A saved word enters through `WordSaved` (S2). Confidence 80%: Practice draws only from the Lexicon (CONTEXT.md "Practice"), so a card Attempt on an unknown word can only come from a lesson.
- [AC3] Q: "each with its own due date": different values, or one per card? A: one due per card, held in that card. The fixture makes them differ anyway (thẻ từ 2026-12-05T14:51Z, nghe 02:01Z, viết chữ 2026-12-07T04:28Z) because 你 viết chữ was last reviewed a day before 你 thẻ từ. Confidence 85%.
- [AC7] Q: how is "no test imports ts-fsrs or internals" enforced? A: an ESLint `no-restricted-imports` block for `src/lib/study/**/*.test.ts` and `src/lib/study/fixtures/**`: only `$lib/study` and the fixtures folder. `pnpm lint` is in CI (ci.yml), so a new test that imports `ts-fsrs` fails CI. Confidence 85%.
- [NFR] Q: can State be stored as JSON (Ledger, IndexedDB)? A: yes: cards keep ISO strings, and Study turns them into `Date` before `review()`, which rejects string dates (checked). Confidence 90%.
- [AC1] Q: Attempt shape? A: WAVE-PLAN C-M3-1, frozen together with CHY-23 S1: `{ id, at, questionId, contentSha, correct, ms, answer?, card?: { word, skill } }`. Confidence 85%: every column CHY-23 AC6 requires, plus what Study needs to find the card.
- [AC1] Q: an Attempt without `card` (grammar drill) or with `correct: null`? A: no event, State unchanged; CHY-20 adds section rules. Confidence 90%.

## Open — needs an answer before execute
None in this file. WAVE-PLAN Q1 (FSRS model) and Q2 (one parameter set) are values in `src/lib/study/fsrs.ts`; the ACs compare due dates with each other or with "within 1 day", and the fixture numbers in SPEC are for Q1 A. If Loc picks B, Task 1 recomputes the fixture table, and AC1's "9 days" Given needs a new history.

## Locked (do not re-open)
- One card per word per skill; tested through Attempts only (STORY.md).
