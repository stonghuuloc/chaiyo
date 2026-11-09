# CHY-22 S1 — spec
ACs: AC1, AC2, AC3, AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-21 S2**)

## Behaviour
- [AC1] `src/lib/study/badges.ts` holds the list in the AC table order (ids and titles as in prototype/u1-badges.html:94-102, whose order differs): `first` "Bước đầu tiên", `streak7` "Chuỗi 7 ngày", `streak30` "Chuỗi 30 ngày", `streak100` "Chuỗi 100 ngày", `words100` "100 từ", `words300` "300 từ", `write50` "Viết chữ đẹp", `hsk1` "Đỗ HSK 1", `hsk2` "Đỗ HSK 2".
- [AC1] State gains `badges: Partial<Record<BadgeId, string>>` (the ISO `now` of earning) and `written: number` (0). `initialState(o?: { curriculum?, tz?, badges? })` copies `o.badges`.
- [AC1] After every `apply`, each rule that holds for a badge not in `badges` adds it and emits `{ type: 'BadgeEarned', badge, title }`, in list order, after all other events of that call:
  - `first`: the first curriculum lesson (Bài 0) has `passed: true`, by its Gate or by an HSK 1 placement block.
  - `streak7` / `streak30` / `streak100`: `streak.count` ≥ 7 / 30 / 100.
  - `words100` / `words300`: the Lexicon has ≥ 100 / 300 entries (WAVE-PLAN Q12, assumed A).
  - `write50`: `written` ≥ 50, where each `viet` card Attempt with `correct: true` that schedules adds the hanzi count of `card.word` (你好 = 2).
  - `hsk1` / `hsk2`: this Attempt has `step { kind: 'mock', level: 1 | 2, mode: 'exam' }` and `correct: true`.
- [AC5] `Step` gains `{ kind: 'mock'; level: number; mode: 'exam' | 'practice' }` (C-M3-1; `correct` = passed, `questionId` = the Mock Test id). A mock Attempt with `mode: 'practice'`, or with `correct` not `true`, earns nothing and changes nothing else. Exactly one mock Attempt per sitting; the sitting's per-question Attempts never carry `kind: 'mock'` (CONTEXT.md:36 counts each answer as an Attempt; tagging them would award hsk1 per right answer).
- [AC2] A badge already in `badges` is never emitted again and its date never changes.
- [AC4] `rollover` never adds or removes a badge; `StreakReset` leaves `badges` deep-equal.
- [CHORE] `index.ts` exports `BadgeId`, `BADGES`. docs/architecture.md:30 Study interface cell: `initialState({ curriculum, tz })` → `initialState({ curriculum, tz, badges })`, and `BADGES` after `minutes`; no other row. `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Worked values (scratch port ~/.capy/work/m3-scratch/w2-chy22.mjs, every row ran)
| badge | sequence from `initialState({ curriculum: CURRICULUM })` | fires on |
|---|---|---|
| first | Bài 0 Gate run, 8 of 10 right, at T | the 10th Attempt |
| streak7 / 30 / 100 | `countDays` from 2026-08-01 | 7 Aug / 30 Aug / **8 Nov** (Streak 7 / 30 / 100) |
| words100 / 300 | WordSaved `w1` … `w300` at T | the 100th / 300th save |
| write50 | 24 right `你好 · viet` (48), 1 wrong `你 · viet` (48), right `你 · viet` (49), right `你 · viet` (50) | the last one only |
| hsk1 / hsk2 | mock Attempt `level` 1 / 2, `mode: 'exam'`, `correct: true` | that Attempt |

## Not this slice
- Nothing: CHY-22 has one slice. Skill-run badges (CONTEXT.md example) are outside the AC list.

## Seam
`src/lib/study/badges.ts` (`BADGES`, `award(state, attempt, now)`), called last in `apply.ts`.

## Test contract (`badges.test.ts`; `earned(events)` keeps BadgeEarned only)
- [AC1] "reaching a milestone earns its badge": one `it` per table row. Build the State up to the call before the firing one and assert `badges[badge]` is unset. Then make the firing call through `apply` and assert `earned` = exactly `[{ type: 'BadgeEarned', badge, title }]` (title copied from the AC table) and `badges[badge]` = that call's `at`. Streak rows: `countDays(initialState({ curriculum: CURRICULUM }), '2026-08-01', <day − 1>)`, then one 1-card practice run (`你 · the`, right) at `<day>T05:00:00Z` for 7 Aug / 30 Aug / 8 Nov. hsk2 is separate from hsk1.
- [AC2] "each badge fires once": `countDays` 1-7 Nov (streak7), `rollover` 8 Nov (FreezeSpent), `rollover` 9 Nov (StreakReset), `countDays` 10-15 Nov, then the 16 Nov practice run through `apply` → `count` 7, `earned` = []; `badges.streak7` = `'2026-11-07T05:00:00.000Z'` (unchanged). Saving `w301` after words300 → [].
- [AC3] "replay does not fire again": fold the Bài 0 Gate run → `first`; fold the same 10 Attempts from `initialState({ curriculum: CURRICULUM, badges: s.badges })` → no BadgeEarned in any call; `badges` deep-equal `s.badges`. Negative control: replay from `initialState({ curriculum: CURRICULUM })` → `first` fires again.
- [AC4] "badges survive a reset": `countDays` 1-7 Nov, `rollover` 8 Nov, `countDays` 9-10 Nov → Streak 9, 0 Freezes, `streak7` held; `rollover` 11 Nov → `[StreakReset 11 Nov]`, `count` 0, `badges` deep-equal before.
- [AC5] "Practice mode earns nothing": mock `level` 1, `mode: 'practice'`, `correct: true` → `earned` = [], `badges` = {}. Controls: `mode: 'exam'` → hsk1; `mode: 'exam'`, `correct: false` → []. The practice-mode call returns State deep-equal to its input.
- [CHORE] CHY-19, CHY-20, CHY-21 tests pass unchanged.

## Open assumptions
- [AC1] WAVE-PLAN Q12 (assumed A): words100/words300 count every Lexicon entry, reviewed or not. With B they count words with at least one card, and a placed learner's 250 new words do not fire words100 on placement day.
