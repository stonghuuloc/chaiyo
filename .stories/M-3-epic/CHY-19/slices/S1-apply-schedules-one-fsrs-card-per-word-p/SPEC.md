# CHY-19 S1 — spec
ACs: AC1, AC2, AC3, AC7  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 7e52b9f)

## Behaviour
- [AC1] `src/lib/study` exports `initialState()`, `apply(state, input, now)` and the types `Skill` (`'the' | 'nghe' | 'viet'`), `Attempt`, `State`, `StudyEvent`. `apply` returns `{ state, events }`, never mutates its `state` argument and reads no clock: FSRS reviews happen at `now`.
- [AC1] `Attempt` = `{ id, at, questionId, contentSha, correct: boolean | null, ms, answer?, card?: { word, skill } }` (WAVE-PLAN C-M3-1). An Attempt with `card` and a boolean `correct` reviews exactly one FSRS card, the one keyed `(card.word, card.skill)`, with grade Good when `correct` is true and Again when false, and emits exactly one event `{ type: 'CardScheduled', word, skill, due }` (`due` = ISO string of the new due). No other card in State changes.
- [AC1] The first card Attempt for a word adds it to `state.lexicon` (insertion order kept) with that one skill's card; the word's other skills have no card until an Attempt for them arrives.
- [AC1] An Attempt without `card`, or with `correct: null`, emits no event and returns State deep-equal to the input.
- [AC2] On the same due card at the same `now`, a right Attempt sets a later due than a wrong one; a wrong Attempt sets due ≤ `now` + 1 day (10 min on a review card, 1 min on a new one, ts-fsrs 6.0.0 defaults).
- [AC3] Three Attempts for one word with skills `the`, `nghe`, `viet` emit three CardScheduled events, one per skill, and leave three cards under that word, each holding the due of its own event.
- [AC7] Every test in `src/lib/study` builds State only through `initialState()` and `apply()`, and asserts on returned events and State. `pnpm lint` fails when a file matching `src/lib/study/**/*.test.ts` or `src/lib/study/fixtures/**` imports `ts-fsrs` or `ts-fsrs/*`, a relative path other than `./fixtures/*` / `../fixtures/*`, or a `#lib/study/*` path other than `#lib/study/index.js` and `#lib/study/fixtures/*`. (SvelteKit 3 removed `$lib`; the repo imports `#lib/<path>.js` through package.json `imports`.)
- [NFR] State is plain JSON: `apply(JSON.parse(JSON.stringify(s)), a, now)` returns the same events as `apply(s, a, now)`.
- [CHORE] `ts-fsrs` 6.0.0 joins `dependencies`. `pnpm check`, `pnpm lint`, `pnpm test` and `pnpm build` stay green.

## Fixture "Bài 1" (src/lib/study/fixtures/bai1.ts)
Now `T` = 2026-11-09T02:00:00Z (09:00 Asia/Ho_Chi_Minh, Monday). The fixture applies right Attempts (`correct: true`) in time order from `initialState()`:
| at | thẻ từ (`the`) | nghe | viết chữ (`viet`) |
|---|---|---|---|
| T − 6 d | | | 你, 好 |
| T − 5 d | 你, 好, 您, 对不起 | 谢谢, 再见, 没关系 | |
| T − 2 d | 你们, 谢谢, 再见, 没关系, 不客气 | 你好, 对不起, 不客气 | 你们 |
| T − 1 d, then T − 1 d + 10 min | 你好 (twice) | | |
Resulting dues (ts-fsrs 6.0.0, Q1 A, computed on the Mac):
| cards | due (UTC) | local day | label |
|---|---|---|---|
| T − 6 d viết chữ | 2026-11-07T20:39:55.164Z | 8 Nov | due today (overdue) |
| T − 5 d thẻ từ + nghe | 2026-11-08T20:39:55.164Z | 9 Nov | due today |
| T − 2 d, all skills | 2026-11-11T20:39:55.164Z | 12 Nov (3 days) | learning |
| 你好 thẻ từ | 2026-11-18T03:52:52.121Z | 18 Nov (9 days) | known |
This matches the AC Background: due today thẻ từ 你 好 您 对不起, nghe 谢谢 再见 没关系, viết chữ 你 好; 你好 known on thẻ từ (9 days) and learning on nghe (3 days). The saved words 熊猫 and 奶茶 join in S2.

## Not this slice
- AC4 (saved words, `WordSaved`), AC5 (`session`, interleave, `minutes`), AC6 (skill filter) → S2.
- Sections, Gate, unlocks (CHY-20); Streak (CHY-21); Badges (CHY-22).

## Seam
`src/lib/study/apply.ts` `apply()` → `src/lib/study/fsrs.ts` (the only file that imports ts-fsrs).

## Test contract
- [AC1] `study.test.ts` "one Attempt schedules only its own skill's card": fixture; `apply` `{ card: { word: '你好', skill: 'nghe' }, correct: false }` at T → events = exactly one CardScheduled `你好 · nghe` with `due` = 2026-11-09T02:10:00.000Z (≤ T + 1 d); no event for `你好 · the`; the `你好 · the` card in the new State is deep-equal to the fixture's, and its due is 9 calendar days after T in Asia/Ho_Chi_Minh.
- [AC1] Negative control: the same call with `skill: 'the'` emits `你好 · the` and leaves `你好 · nghe` unchanged.
- [AC1] A drill Attempt without `card` → `events` = [], State deep-equal to the input.
- [AC2] "remembering pushes further": fixture; `你 · the` right at T → due 2026-12-05T14:51:41.809Z; then `好 · the` wrong at T → due 2026-11-09T02:10:00.000Z. Assert `due(你) > due(好)` and `due(好) − T ≤ 1 d`.
- [AC3] "three skills, three cards": fixture; at T apply `你 · the` right, `你 · nghe` wrong, `你 · viet` right → 3 events with skills {the, nghe, viet}; State has 3 cards under 你, each due equal to its event's `due` (2026-12-05T14:51:41.809Z, 2026-11-09T02:01:00.000Z, 2026-12-07T04:28:23.574Z).
- [AC7] `pnpm lint` exits 0. Negative control: add `import { Rating } from 'ts-fsrs';` to `study.test.ts` → `pnpm lint` exits 1 with `no-restricted-imports`; same for `import { review } from './fsrs';`. Revert.
- [AC7] `rg -n "from '(ts-fsrs|\./(fsrs|apply|types))" src/lib/study --glob '*.test.ts' --glob 'fixtures/**'` → no output.
- [NFR] JSON round trip: the AC2 call on `JSON.parse(JSON.stringify(fixture))` emits the same events.
- [NFR] Purity: after any `apply`, `JSON.stringify` of the input State is unchanged.

## Open assumptions
- [AC1] Values assume WAVE-PLAN Q1 A (FSRS-7 defaults, fuzz off). Q1 B changes the table above and the AC1 Given (FSRS-6: two right answers 10 min apart → 2.0 days, not 10.1); the assertions that compare dues stay as they are.
