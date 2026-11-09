# CHY-20 S2 — spec
ACs: AC6, AC7, AC8  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-20 S1**)

## Behaviour
- [AC6] `Step` gains `{ kind: 'placement'; level: number; run: string; of: number }` (one run per block). State gains `placed: number` (0 at start). Placement runs use S1's run rules (first answer per question, close at `of`).
- [AC6] A closed placement block passes when `c × 100 ≥ 80 × of` and `level = placed + 1`. Then `placed = level`; every curriculum lesson with `level ≤ placed` gets `passed: true`, `unlocked: true` (Bài 0 included: it is level 1); each word of those lessons that is not in the Lexicon is appended as `{ saved: false, cards: {} }` in curriculum order, and one that is there with `saved: true` becomes `saved: false`. The first curriculum lesson of level `placed + 1`, if locked, becomes unlocked with `{ type: 'LessonUnlocked', lesson }`. No other event.
- [AC6] A failed block, or a block whose level is not `placed + 1`, changes nothing and emits nothing.
- [AC7] `Card` gains `first: string`: the ISO `now` of the Attempt that created the card; later reviews keep it.
- [AC7] `session`'s `the` lane: after the due cards, the new cards are the Lexicon words with no `the` card (saved or placed), in Lexicon order, at most `max(0, 20 − k)` of them, where `k` = the number of `the` cards whose `first` falls on `now`'s date in `tz`. This replaces CHY-19 S2's "every saved word without a `the` card". `nghe` and `viet` lanes take no new cards (WAVE-PLAN Q11, assumed A).
- [AC8] Nothing in Study sets `passed` back to false, lowers `placed`, or locks a lesson: a Gate fail on an HSK 2 lesson and a weak HSK 1 block afterwards leave every HSK 1 lesson passed.
- [CHORE] `index.ts` exports the wider `Step`. docs/architecture.md:30 Study row: "Placement blocks + 20 new cards/day" stays as written (already there). `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Fixture additions (src/lib/study/fixtures/runs.ts)
`placementBlock(level, run, right, at)` = 10 Attempts 1 s apart, questions `q-pl-<level>-01`…, `step { kind: 'placement', level, run, of: 10 }`. `placed2` = `initialState({ curriculum: CURRICULUM })` + `placementBlock(1, 'p1', 9, T)` + `placementBlock(2, 'p2', 5, T + 10 min)`.

Worked by hand and on the scratch port (~/.capy/work/m3-scratch/w2-chy20.mjs): HSK 1 holds 26 lessons (h0-00, h1-01…h1-25) and 250 words. Session at 09:20 local each day from T, answering every new card right at once:
| day (local) | new cards | which words |
|---|---|---|
| 9 Nov | **20** | 你 … 再见 (h1-01), h1-02-w01 … h1-02-w10 |
| 9 Nov, 1 h later | 0 | k = 20 |
| 10 Nov | 20 | h1-03-w01 … h1-04-w10 |
| 11 … 20 Nov | 20 each | h1-05 … h1-24 |
| 21 Nov | 10 | h1-25-w01 … h1-25-w10 |
| 22 Nov | 0 | none left |
Due cards come back from day 6 on (FSRS-7, right on a new card → about 4.8 days, WAVE-PLAN Q1); the test counts only cards whose word has no `the` card when the session is built, so the counts above do not depend on FSRS.

## Not this slice
- AC1-AC5 (runs, sections, Gate) → S1. Placement screens and question bank (M-4). New nghe / viết chữ cards for placed words (Q11 B, if Loc picks it).

## Seam
`src/lib/study/progress.ts` (placement branch); `src/lib/study/session.ts` (new-card cap); `src/lib/study/fsrs.ts` caller in `apply.ts` sets `first`.

## Test contract (`placement.test.ts`; `own` as in S1)
- [AC6] "placement into HSK 2 passes HSK 1": block p1 → `own` = `[LessonUnlocked h2-01]`; block p2 → []. Then: the 26 HSK 1 lessons all `passed` and `unlocked`; h2-01 `unlocked`, not `passed`; h2-02 locked; `placed` = 1; Lexicon has 250 entries, each `{ saved: false, cards: {} }`, first key 你, last `h1-25-w10`.
- [AC6] "placement promotes a saved word, keeps a taught one": `initialState({ curriculum: CURRICULUM })` + WordSaved 你们 at T − 1 h + a right `你 · the` Attempt at T − 1 h + `placementBlock(1, 'p1', 9, T)` → 你们 `saved: false`, 你 keeps its `the` card, Lexicon has 250 entries. Negative control: append placed words with `??=` only → 你们 stays `saved: true`; revert.
- [AC6] Negative controls: block p1 with 7 right → `placed` 0, Lexicon empty, `own` = []; from `initialState`, a passing level-2 block first → nothing (levels start at HSK 1).
- [AC7] "20 new cards a day": the table above as a loop over 14 days; each day's new list equals the expected word ids; the 9 Nov session has exactly 20 cards.
- [AC7] Lesson cards share the cap: `placed2` + right `the` Attempts at T for 你 好 您 你们 你好 → session at T + 20 min has 15 new (对不起 … h1-02-w10).
- [AC7] CHY-19's fixture still yields its 10-card session (one new card, 奶茶).
- [AC8] "never sent back down": `placed2` + one closed run of each h2-01 section + `gateRun('h2-01','h2g',3,T+7h)` → `own` = `[SectionDone h2-01 gate]`; then `placementBlock(1,'p3',2,T+8h)` → []. Every HSK 1 lesson still `passed`; `placed` = 1; h2-01 `best` 30.
- [CHORE] All S1 and CHY-19 tests pass unchanged.

## Open assumptions
- [AC7] WAVE-PLAN Q11 (assumed A): placed words get new cards in thẻ từ only. B adds a new nghe and viết chữ card per placed word inside the same cap of 20 (DISCUSSION Q11).
