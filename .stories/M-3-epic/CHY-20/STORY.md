# CHY-20 — Study: sections, Gate Test, unlocks, placement

## Goal (business why, 1-2 sentences)
Let Study decide when a lesson section is done, whether a Gate Test passes, which lesson unlocks next, and where a Placement Test puts a new learner, so the phone and the nightly server job compute the same Progress from the same Attempts.

## Context an agent can't derive from code
- Built on CHY-19, which is designed but not on main: `src/lib/study` with `initialState()`, `apply(state, input, now)`, `session(state, { now, tz, only })`, `Attempt` (WAVE-PLAN C-M3-1), `WordSaved`, Lexicon entries `{ saved, cards }`. **Depends on CHY-19 S2 merged.** Lane L1 is serial: `index.ts`, `types.ts`, `apply.ts` are shared by CHY-19..22.
- Imports are `#lib/study/index.js`: SvelteKit 3 removed `$lib` (3.1.0 installed) (node_modules/@sveltejs/kit/src/messages/build-errors.js:521; package.json `imports`).
- WAVE-PLAN D1 is decided here: Study gets a `Curriculum` through `initialState({ curriculum })` and keeps it in State; each Attempt says which section run, Gate run or Placement block it belongs to through a new optional `step` field (C-M3-1 amendment; the `step jsonb` column comes from CHY-24 S1's migration). Catalog (CHY-25) is not on main, so tests use a fixture curriculum and CHY-25 builds the real one from the lesson bundles.
- Section ids are the bundle keys (docs/content-schema.md:135-143): `words` (Từ mới), `grammar` (Ngữ pháp), `dialogue` (Hội thoại), `listenSpeak` (Nghe & nói), `writing` (Luyện viết). `warmup` is derived per learner and does not gate the Gate Test. Bài 0 (`h0-00`, kind `primer`) has `tones`, `finals`, `initials`, `spelling`, `sandhi`, and its Gate Test may be taken first (`testOut: true`, docs/content-schema.md:304).
- Gate draw is 10 for h0-00 and h1-01 (content/lessons/hsk1/h0-00.yaml:586, h1-01.yaml:107). Placement blocks have 10 questions and pass at 8 (CONTEXT.md "Placement Test"; prototype/data/placement.js:5).
- Pass rule in integers: `correct × 100 ≥ 80 × of` (WAVE-PLAN "Locked facts"). Score = `floor(correct × 100 / of)`.
- New cards in Practice are thẻ từ cards only, as in the prototype (prototype/data/lexicon.js:56-57). WAVE-PLAN Q11 asks Loc whether placed words also get nghe and viết chữ cards; S2 assumes the recommendation.
- Events named in docs/architecture.md:30: `SectionDone`, `GatePassed`, `LessonUnlocked`. CHY-21 and CHY-22 later add `DayCounted`, `FreezeEarned`, `BadgeEarned` to the same `apply` calls, so every CHY-20 test filters events to the three types it owns.

## Locked decisions (BA/Loc already ruled — never re-open)
- Gate Test passes at ≥ 80 %, retries unlimited, best score kept (CONTEXT.md "Gate Test").
- Placement: blocks of 10 from HSK1 up, 80 % per block, stop at the first failed block, every lesson below the reached level unlocks, about 20 new cards a day, never demoted (CONTEXT.md "Placement Test"). Passing the HSK1 block also passes Bài 0 (CONTEXT.md "Pinyin Primer").
- Study is pure and tested only through its exports with input sequences (docs/architecture.md:30 as CHY-19 S2 rewords it).
- Lexicon promotion from "tự thêm" to taught is a Study rule (docs/architecture.md:30) that CHY-19 handed to this story (CHY-19 STORY "Out of scope").

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Last section question emits SectionDone; Gate locked until 5 done | high | S1 |
| AC2 | Gate pass line is exactly 80 % (7, 8, 10 of 10) | high | S1 |
| AC3 | Fail, retry, pass unlocks the next lesson once | high | S1 |
| AC4 | Best Gate score is kept after a weaker retry | high | S1 |
| AC5 | Quitting a Gate run midway saves no score | high | S1 |
| AC6 | Placement into HSK 2 passes HSK 1; words enter as new | high | S2 |
| AC7 | Placed learner gets at most 20 new cards a day | high | S2 |
| AC8 | A weak result later never sends the learner back down | high | S2 |

## Out of scope
- Day counting from SectionDone (CHY-21), Badges (CHY-22), storing Attempts (CHY-23, CHY-24), the lesson runner and Gate screens (M-5), the placement screens and question bank (M-4 onboarding), building the real Curriculum from bundles (CHY-25 Catalog).
