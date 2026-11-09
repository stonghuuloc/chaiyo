# CHY-20 S1 — discussion
ACs: AC1, AC2, AC3, AC4, AC5 · design lead CHAA-110 · 2026-11-09

## Decided by Loc (WAVE-PLAN Q1-Q10, all on the recommended option)
- Q1 A FSRS-7 defaults, fuzz off · Q2 A one parameter set · Q3 A `settings.tz` ends the day · Q4 A Freeze at each multiple of 7 · Q5 A any finished practice session counts · Q6 A `lexicon_saves` table (CHY-24 S1) · Q7 A local Supabase + 2 test users, CI in-memory · Q8 A `/dev/ledger` proves CHY-24 AC1 · Q9 A Mock Test result Attempt (level, mode, passed) · Q10 A parallel lanes. None changes this slice's values.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q (WAVE-PLAN D1): how do section sizes and lesson order reach a pure `apply`? A: two inputs. (1) `Curriculum` (lessons in Roadmap order with level, section ids, word ids, `testOut`) passed once to `initialState({ curriculum })` and kept in State, so the Ledger fold (C-M3-2) and the Edge Function keep `apply(state, input, now)`. (2) `Attempt.step` names the run and its size `of` (C-M3-1 amendment; `attempts.step jsonb`). Confidence 80%: Từ mới has no authored questions (docs/content-schema.md:137 `words: { ids }`), so a section size can only come from the runner; a run id is the only way to tell a quit Gate run from its retry (AC5); State already must be rebuilt by folding, so carrying the curriculum costs one copy per fold. Rejected: a fourth `apply` argument (every caller and C-M3-2 change), and question ids from the curriculum (Từ mới and the Gate draw are runtime).
- [AC1] Q: is the `step` column a CHY-23 change? A: no. CHY-23 S1/S2 are READY and may already be executing; CHY-24 S1 adds `alter table attempts add column step jsonb` in its own migration (lane L3 owns that file). The TS field lands here first; nothing reads the column until CHY-24 S2. Confidence 85%.
- [AC1] Q: does a section count again when redone? A: yes, every closed run emits SectionDone; `done` records it once. CONTEXT.md "Streak" counts a day for finishing a section, which a review of an old section is. Confidence 85%.
- [AC1] Q: which sections gate the Gate Test? A: the curriculum's `sections` list. CHY-25 builds it from the bundle keys minus `warmup` (derived per learner, no fixed size). Bài 1 → the AC's 5. A warm-up run still emits SectionDone (`step.of` = its size) and so counts a day in CHY-21. Confidence 80%.
- [AC2] Q: what is "the score"? A: `floor(c × 100 / of)`, pass by `c × 100 ≥ 80 × of` (integers, WAVE-PLAN locked fact). 8/10 → 80 passes; 9/12 → 75 fails. Confidence 90%.
- [AC2] Q: does a failed run emit anything? A: `SectionDone { section: 'gate' }` only: CONTEXT.md "Streak" lists the gate test among sections that count a day, pass or fail. Confidence 80%.
- [AC3] Q: GatePassed again on a later pass? A: yes, on every passing run (the "Chaiyo!" screen reacts to it, docs/architecture.md:36); `LessonUnlocked` only on the first. The AC asks for "GatePassed once" over the fail + pass pair and "no second LessonUnlocked" on the third run, which this meets. Confidence 80%.
- [AC4] Q: is `best` from passing runs only? A: from every closed run (CONTEXT.md "Gate Test": "the best score is kept"). After 7/10 alone, `best` = 70. Confidence 85%.
- [AC5] Q: what if a quit run's answers arrive later (resume)? A: the run stays open and closes when it reaches `of`; the lesson runner decides whether "resume" reuses the run id (M-5). Confidence 80%.
- [AC1] Q: `correct: null` (speaking graded later) in a run? A: it counts as answered and not right. CHY-19's "null changes nothing" is about the card only. Confidence 80%.
- [LOCK] Q: who promotes a "tự thêm" word to taught? A: this slice, when the `words` run of the lesson that teaches it closes (docs/architecture.md:30 lists the rule under Study; CHY-19 STORY handed it here). The entry keeps its cards (CONTEXT.md "Lexicon": "keeps its review history"). Confidence 85%.
- [AC1] Q: tests and later stories add events to the same call? A: each CHY-20 test filters to SectionDone / GatePassed / LessonUnlocked, so CHY-21's DayCounted and CHY-22's BadgeEarned do not break it. Confidence 90%.

## Open — needs an answer before execute
None. Every value above is a design choice at ≥ 80 %; WAVE-PLAN Q11 and Q12 belong to S2 and CHY-22.

## Locked (do not re-open)
- 80 % pass line, unlimited retries, best score kept (STORY.md).
