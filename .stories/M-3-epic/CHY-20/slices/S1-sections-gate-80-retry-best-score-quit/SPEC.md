# CHY-20 S1 — spec
ACs: AC1, AC2, AC3, AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-19 S1 + S2, not on main yet**)

## Behaviour
- [AC1] `types.ts` adds `Curriculum = { lessons: { id: string; level: number; sections: string[]; words: string[]; testOut?: boolean }[] }` (Roadmap order) and `Step = { kind: 'section'; lesson: string; section: string; run: string; of: number } | { kind: 'gate'; lesson: string; run: string; of: number }`. `Attempt` gains `step?: Step` (C-M3-1 amendment ↔ `attempts.step jsonb`, column from CHY-24 S1).
- [AC1] `initialState(o?: { curriculum?: Curriculum })`: State gains `curriculum` (default `{ lessons: [] }`), `lessons: Record<id, { unlocked: boolean; passed: boolean; done: string[]; best?: number }>` with only the first lesson unlocked, and `runs: Record<runId, { answers: Record<questionId, boolean>; closed?: true }>`. `initialState()` with no argument still returns CHY-19's empty Lexicon, so every CHY-19 test stays green.
- [AC1] Runs: an Attempt with `step` belongs to run `step.run`. The run keeps the first answer per `questionId` (`correct === true` counts right; `false` and `null` count as answered, not right). A repeat `questionId` in the run, or any Attempt for a closed run, changes no progress. The run closes when it holds `step.of` distinct questions. The card part of an Attempt (CHY-19) is applied either way.
- [AC1] Section run: ignored when `step.lesson` is not in the curriculum. On close it adds `section` to `lessons[lesson].done` (once) and emits `{ type: 'SectionDone', lesson, section }`. It emits again each time another run of that section closes (CHY-21 counts days from it).
- [AC1] Gate run: ignored entirely (no run kept) unless the lesson is in the curriculum and its Gate is open: `testOut` is true, or every id in the lesson's `sections` is in `done`. Bài 1's Gate opens only after `words`, `grammar`, `dialogue`, `listenSpeak`, `writing` are done.
- [AC2] On close a Gate run emits `{ type: 'SectionDone', lesson, section: 'gate' }`, then scores `c` right of `of`: `score = floor(c × 100 / of)`, pass when `c × 100 ≥ 80 × of`. A pass emits `{ type: 'GatePassed', lesson, score }`. 7/10 → 70, no pass; 8/10 → 80, pass; 10/10 → 100, pass; 9/12 → 75, no pass.
- [AC3] The first pass sets `passed: true`; if the next curriculum lesson is locked it becomes unlocked and `{ type: 'LessonUnlocked', lesson: <next id> }` is emitted. Every later pass emits `GatePassed` and no `LessonUnlocked`.
- [AC4] `best` = the highest `score` of any closed Gate run, pass or fail. A weaker run never lowers `best`, `passed` or `unlocked`.
- [AC5] A Gate run that never reaches `of` answers stays open: no event, `best` unchanged. A later run is scored on its own answers only.
- [AC1] Event order inside one `apply`: `CardScheduled`, `SectionDone`, `GatePassed`, `LessonUnlocked`.
- [LOCK] Promotion: when a `words` run of lesson L closes, every word of L's `words` that sits in the Lexicon with `saved: true` becomes `saved: false` and keeps its cards. No event.
- [NFR] State stays plain JSON (CHY-19 NFR); `apply` never mutates its input.
- [CHORE] `index.ts` exports `Curriculum`, `Step`. docs/architecture.md:30 Study row reads `initialState({ curriculum })` and names `Attempt.step`. `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Fixtures (src/lib/study/fixtures/curriculum.ts, runs.ts; fixtures import `#lib/study/index.js`, and each other as `#lib/study/fixtures/<file>.js`; a `./curriculum.js` import fails CHY-19's lint rule)
`CURRICULUM`: `h0-00` (level 1, sections tones/finals/initials/spelling/sandhi, words [], testOut), `h1-01` (level 1, the 5 sections, words 你 好 您 你们 你好 对不起 没关系 谢谢 不客气 再见, content/lessons/hsk1/h1-01.yaml:36), `h1-02`…`h1-25` (level 1, same 5 sections, words `h1-NN-w01`…`w10`), `h2-01`, `h2-02` (level 2, the 5 sections, words `h2-NN-w01`…`w10`). `gateRun(lesson, run, right, at, answered = 10, of = 10)` (`answered` Attempts, `step.of` = `of`) and `sectionRun(lesson, section, run, at, answered = 10)` return Attempts 1 s apart, questions `q-<lesson>-t01`… / `q-<lesson>-<section>-01`…, the first `right` ones correct. `T` = 2026-11-09T02:00:00Z (CHY-19). `bai0` = `initialState({ curriculum: CURRICULUM })` + `gateRun('h0-00', 'g0', 10, T − 1 d)` (h1-01 unlocked, h1-02 locked). `ready` = `bai0` + one closed run of each Bài 1 section.

## Not this slice
- AC6 placement, AC7 the 20-new-cards cap, AC8 no demotion → S2. Day counting (CHY-21), Badges (CHY-22).

## Seam
`src/lib/study/apply.ts` `apply()` → `src/lib/study/progress.ts` (runs, sections, Gate, unlocks, promotion).

## Test contract (`progress.test.ts`; `own(events)` keeps SectionDone, GatePassed, LessonUnlocked only)
- [AC1] "last question emits SectionDone": `bai0` + `sectionRun('h1-01','words','w1',T)` first 9 → `own` = []; a repeat of question 03 (new Attempt id) → []; the 10th → `[SectionDone h1-01 words]`; question 03 again → [].
- [AC1] "Gate stays locked": after `words`, `grammar`, `dialogue`, `listenSpeak` (4 done), `gateRun('h1-01','gEarly',10,T+5h)` → `own` = [], `best` undefined, h1-02 locked. Then the `writing` run → `[SectionDone h1-01 writing]`, `done` has the 5 ids, and a 10/10 run → GatePassed. Negative control: `bai0` itself came from a Bài 0 Gate with no Bài 0 section done (`testOut`).
- [AC2] "pass line is 80 %": from `ready`, runs of 7, 8, 10 right → `own` = `[SectionDone gate]` / `[SectionDone gate, GatePassed 80, LessonUnlocked h1-02]` / `[…, GatePassed 100, LessonUnlocked h1-02]`; `best` 70 / 80 / 100; h1-02 stays locked after the 7. Integer edge: `gateRun('h1-01','e1',9,T+7h,12,12)` → `[SectionDone gate]`, `best` 75; `gateRun('h1-01','e2',10,T+7h,12,12)` → `[SectionDone gate, GatePassed 83, LessonUnlocked h1-02]`.
- [AC3] "fail, retry, pass unlocks once": `ready` + r1 6/10 → `[SectionDone gate]`; r2 9/10 → `[SectionDone gate, GatePassed 90, LessonUnlocked h1-02]`; r3 10/10 → `[SectionDone gate, GatePassed 100]`. Over r1+r2: GatePassed ×1, LessonUnlocked ×1.
- [AC4] "best score is kept": `ready` + r1 9/10 + r2 6/10 → r2 `own` = `[SectionDone gate]`; `best` 90, `passed` true, h1-02 `unlocked` true.
- [AC5] "quitting saves no score": `ready` + `gateRun('h1-01','q1',0,T+7h,4)` → `own` = [], `best` undefined; then `gateRun('h1-01','q2',8,T+8h)` → `[SectionDone gate, GatePassed 80, LessonUnlocked h1-02]`. Negative control: key the run by `step.lesson` → q2 emits `[SectionDone gate]` only.
- [LOCK] Promotion: `bai0` + WordSaved 你们 at T − 2 h → `saved: true`; after the `words` run closes → `saved: false`; a `你们 · nghe` Attempt then schedules (CHY-19 guard lifted).
- [NFR] JSON round trip of `ready` gives the same events for the AC2 8/10 run; input State unchanged after every call.
- [CHORE] CHY-19's `study.test.ts` and `session.test.ts` pass unchanged.

## Open assumptions
- None that change the work: Q1-Q10 are decided (WAVE-PLAN); D1 is decided in DISCUSSION.
