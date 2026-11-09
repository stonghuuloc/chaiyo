# M-3 Study core + Ledger — wave plan
Design lead CHAA-103 (wave 1: plan, CHY-19, CHY-23) and CHAA-110 (wave 2: CHY-20, 21, 22, 24) · 2026-11-09 · base main 7e52b9f / 90fbe31 · issues LOC-57..LOC-62 (parent LOC-42)

M-3 builds the one deep rules module (`src/lib/study`: FSRS per skill, sections, Gate Test, unlocks, placement, Streak, Freeze, Badges), the learner tables with RLS, and the Ledger that keeps Attempts offline and syncs them. Six stories, twelve proposed slices. **CHY-19 and CHY-23 run first and in parallel**: neither has an open dependency, every other M-3 story waits on one of them, and they share no file.

## Stories and proposed slices
| Story | Slice | ACs | Needs first | Kind |
|---|---|---|---|---|
| CHY-19 Study: FSRS + session | S1 `apply` schedules one FSRS card per word per skill | AC1-AC3, AC7 | Q1, Q2 (defaults are safe to start on) | build, pure TS |
| CHY-19 | S2 session builder, estimate, saved words | AC4-AC6 | CHY-19 S1 | build, pure TS |
| CHY-23 Postgres learner tables | S1 learner tables + RLS isolation | AC1-AC3, AC6 | none (content tables on main) | build, SQL + PGlite tests |
| CHY-23 | S2 append-only Attempts, idempotent insert, read-only content | AC4, AC5, AC7 | CHY-23 S1 | build, SQL grants |
| CHY-20 Study: sections, Gate, unlocks, placement | S1 SectionDone, Gate 80 %, retry, best score, quit | AC1-AC5 | CHY-19 S2 (D1 decided below) | build |
| CHY-20 | S2 placement, 20 new cards a day, no demotion | AC6-AC8 | CHY-20 S1; Q11 (assumed A) | build |
| CHY-21 Study: Streak + Freeze | S1 day counting in the learner's timezone | AC1-AC3, AC8 | CHY-20 S2 (lane order; SectionDone is CHY-20 S1) | build |
| CHY-21 | S2 Freeze earn/spend/cap, reset, DST | AC4-AC7, AC9 | CHY-21 S1 | build |
| CHY-22 Study: Badges | S1 badge list, once only, replay, survives reset, Exam only | AC1-AC5 | CHY-21 S2 (which sits on CHY-20 S1-S2); Q12 (assumed A) | build |
| CHY-24 Ledger | S1 `record`/`state`/`subscribe` over IndexedDB + a memory store; `lexicon_saves` + `attempts.step` migration | AC3, AC4, AC6 | CHY-19 S2, CHY-23 S2 | build, SQL + PGlite |
| CHY-24 | S2 Supabase store: sync once, merge other device, keep on 500 | AC2, AC5, AC7 | CHY-24 S1, CHY-20 S1 (`Attempt.step` type) | build, local Supabase |
| CHY-24 | S3 offline reopen proof on `/dev/ledger` | AC1 | CHY-24 S2, CHY-20 S1, CHY-21 S1 | device proof (Loc: iPhone) |

Every story is now designed (STORY + SPEC + PLAN + DISCUSSION per slice): CHY-19 and CHY-23 in wave 1 (PR #83), CHY-20, CHY-21, CHY-22 and CHY-24 in wave 2, on the split above. Q1-Q10 are decided (all A, 2026-11-09).

## What M-3 gets from M-0..M-2 (checked on main 7e52b9f, not from backlog text)
| Need | On main? | Evidence | Used by |
|---|---|---|---|
| Content tables + select-only RLS for `authenticated` | yes | supabase/migrations/20261105000000_content_tables.sql:1-116 | CHY-23 (AC7), CHY-24 |
| PGlite in tests (`create role authenticated` + one migration) | yes, devDependency 0.5.15 | src/lib/content/import/postgres-sink.test.ts:15-31 | CHY-23 test harness |
| Supabase client | yes | src/lib/supabase.ts:1-4 | CHY-24 S2 |
| Auth (Google + email magic link, hosted) | configured, **no login screen** | supabase/config.toml:150-252; login UI is CHY-26 (M-4) | CHY-24 S2 (Q7) |
| Service worker: app shell, bundles, audio offline | yes | src/service-worker/index.ts:1-16 | CHY-24 S3 |
| Catalog `lesson(id)` / `word(id)` | **no**: CHY-25 is designed only (.stories/M-1-epic/CHY-25, stage plan); `src/lib/catalog` does not exist | `ls src/lib` | CHY-20 (D1) |
| Bài 1 word ids | yes | content/lessons/hsk1/h1-01.yaml:35-36 (你 好 您 你们 你好 对不起 没关系 谢谢 不客气 再见) | CHY-19 fixtures |
| Prototype rules to port | yes | prototype/data/lexicon.js:7-72 (skills, seconds, interleave), prototype/streak.js:1-30 | CHY-19, CHY-21 |
| ts-fsrs | **no**: not in package.json; latest is 6.0.0 (MIT, Node ≥ 24, FSRS-7 default, `DefaultScheduler()` is async) | npm + github.com/open-spaced-repetition/ts-fsrs README | CHY-19 S1 adds it |
| Audio player, Talking Cast | yes (CHY-16, CHY-18) | src/lib/audio, src/lib/components | not needed in M-3 |

## Dependencies
```
 main: content tables ──────────────────────────▶ CHY-23 S1 ──▶ CHY-23 S2 ─────────────────┐
                                                                                            ▼
 ts-fsrs 6 ──▶ CHY-19 S1 ──▶ CHY-19 S2 ──┬──▶ CHY-20 S1 ──▶ CHY-20 S2                   CHY-24 S1 ──▶ CHY-24 S2 ──▶ CHY-24 S3
                                          │        │  ▲ D1 curriculum                       ▲ Q6          ▲ Q7          ▲ Q8
                                          │        ▼                                        │
                                          │   CHY-21 S1 ──▶ CHY-21 S2 ──▶ CHY-22 S1          │
                                          │     ▲ Q3 Q5      ▲ Q4          ▲ Q9              │
                                          └──────────────────────────────────────────────────┘
```
- Wave 2 adds two edges the drawing above lacks: CHY-20 S1 ──▶ CHY-24 S2 (the `Attempt.step` type) and CHY-21 S1 ──▶ CHY-24 S3 (`streak.last`). Q3-Q9 are decided, so their arrows no longer gate anything.
- **C-M3-1 Attempt shape** (frozen by CHY-19 S1 and CHY-23 S1 together; both SPECs quote it). TS `Attempt` ↔ table `attempts`:

| TS field (src/lib/study) | Column (attempts) | Rule |
|---|---|---|
| `id: string` | `id text`, PK `(learner_id, id)` | client-made, unique per learner |
| (server) | `learner_id uuid` default `auth.uid()` | never sent by Study |
| `at: string` (ISO) | `at timestamptz not null` | when the learner answered |
| `questionId: string` | `question_id text not null` | no FK: Practice review cards are built at runtime (content-schema.md:172), so their ids are not rows of `questions` |
| `contentSha: string` | `content_sha text not null` | content version answered |
| `card?: { word, skill }` | `word text`, `skill text` ∈ the/nghe/viet, both or neither | the review card this Attempt grades |
| `correct: boolean \| null` | `correct boolean` | null only for answers graded later (speaking) |
| `ms: number` | `ms int not null` ≥ 0 | time to answer |
| `answer?: unknown` | `answer jsonb` | what the learner answered |
| `step?: Step` (CHY-20 S1, CHY-21 S1, CHY-22) | `step jsonb` (added by CHY-24 S1's migration) | the run the Attempt belongs to: `{ kind: 'section', lesson, section, run, of }`, `{ kind: 'gate', lesson, run, of }`, `{ kind: 'placement', level, run, of }`, `{ kind: 'practice', run, of }`, or a Mock Test result `{ kind: 'mock', level, mode: 'exam' \| 'practice' }` with `correct` = passed (Q9 A), exactly one per sitting; the sitting's per-question Attempts never carry `kind: 'mock'` |
- Attempt write (CHY-23 S2): `insert … on conflict (learner_id, id) do nothing` (supabase-js `upsert(…, { onConflict: 'learner_id,id', ignoreDuplicates: true })`); learners cannot update or delete Attempts.
- **C-M3-2 Fold rule** (CHY-24 uses it): `state()` = `apply` folded over Attempts and WordSaved inputs sorted by `at` (ties: Attempt `id`; a WordSaved sorts before an Attempt at the same `at`), with `now = new Date(input.at)`. Study schedules at `now` and never reads a clock.
- **C-M3-3 Test platform**: CHY-23 S1 ships `src/lib/db/migrate.ts` (Supabase roles and an `auth` stub, no default grants, then every `supabase/migrations/*.sql` in name order on PGlite). CHY-24 S1 reuses it for `ledger-migration.test.ts`; CHY-24 S2's server proof runs on local Supabase (Q7 A).
- **C-M3-4 Explicit grants**: Supabase stopped granting new `public` tables to `anon`/`authenticated`/`service_role` (changelog 45329: default for new projects from 2026-05-30, applied to all existing projects on 2026-10-30; existing tables keep their grants). The Mac's CLI 2.101.0 still grants them locally. Every M-3 migration therefore grants what it needs explicitly; CHY-23 S2 also grants `select` on the 10 content tables to `authenticated`, because the content migration relied on the old default.
- **D1 (decided in CHY-20 S1 DISCUSSION):** Study gets a `Curriculum` (`{ lessons: { id, level, sections, words, testOut? }[] }`, Roadmap order) once through `initialState({ curriculum, tz, badges })` and keeps it in State; each Attempt names its run and run size in `step` (row above). `apply(state, input, now)` and C-M3-2 stay as they are. Catalog (CHY-25) builds the real curriculum from the bundles; until then tests use `src/lib/study/fixtures/curriculum.ts` and `/dev/ledger` a two-lesson literal.
- **C-M3-5 Study surface after wave 2** (L1 keeps it): `initialState({ curriculum?, tz? = 'Asia/Ho_Chi_Minh', badges? })`, `apply`, `rollover(state, day)` (`tz` lives in State, so the architecture's `rollover(state, day, tz)` loses its third argument in CHY-21 S1), `session`, `minutes`, `BADGES`. Events inside one call, in order: `CardScheduled`, `SectionDone`, `GatePassed`, `LessonUnlocked`, `FreezeSpent` / `StreakReset`, `DayCounted`, `FreezeEarned`, `BadgeEarned`. Each story's tests filter events to the types that story owns.

## Waves
| Wave | Runs together | Starts when |
|---|---|---|
| A | CHY-19 S1 (L1), CHY-23 S1 (L2) | Loc approves this plan (Q10) |
| B | CHY-19 S2 (L1), CHY-23 S2 (L2) | each lane's S1 merged |
| C | CHY-20 S1 (L1), CHY-24 S1 (L3) | CHY-19 S2 + CHY-23 S2 merged |
| D | CHY-20 S2 (L1), CHY-24 S2 (L3) | wave C merged (CHY-24 S2 needs CHY-20 S1's `Attempt.step`) |
| E | CHY-21 S1 (L1) | CHY-20 S2 merged (L1 is serial) |
| F | CHY-21 S2 (L1), CHY-24 S3 (L3) | CHY-21 S1 merged (CHY-24 S3 reads `streak.last` from it, so it moved here from wave E) |
| G | CHY-22 S1 (L1) | CHY-21 S2 merged |
Critical path: the Study lane, 7 slices (19 S1 → 19 S2 → 20 S1 → 20 S2 → 21 S1 → 21 S2 → 22 S1). The Study stories are serial because they share `src/lib/study/{index,types,apply}.ts`, not only because of AC dependencies. One slice at a time (project rule) is 12.

## Lanes and file ownership (no two lanes write one file)
| Lane | Slices | Owns (writes) |
|---|---|---|
| L1 Study | CHY-19 S1-S2, then CHY-20, 21, 22 | `src/lib/study/**` (new); `package.json` dependencies +1 (`ts-fsrs`) and `pnpm-lock.yaml`; `eslint.config.js` +1 block (study tests import only `#lib/study/index.js`); `docs/architecture.md:30` (Study row: CHY-19 S2, CHY-20 S1, CHY-21 S1, CHY-22 S1); `CONTEXT.md:65` ("Streak" sentence, CHY-21 S1, Q5 A) |
| L2 DB | CHY-23 S1-S2 | `supabase/migrations/20261110000000_learner_tables.sql`, `supabase/migrations/20261110000100_learner_grants.sql` (both new); `src/lib/db/**` (new) |
| L3 Ledger | CHY-24 S1-S3 | `src/lib/ledger/**` (new); `supabase/migrations/20261111000000_ledger.sql` (S1: `lexicon_saves`, `attempts.step`); `package.json` devDependencies +1 (`fake-indexeddb` ^6.2.8, S1); `docs/architecture.md:31` (Ledger row, S2 in wave D, when L1 leaves the file alone); `src/routes/dev/ledger/**` (S3) |
- Shared one-line additions: `package.json` (L1 dependencies, L3 devDependencies, different waves) and `pnpm-lock.yaml`; the lane that rebases second regenerates the lock with `pnpm install` (M-1 rule).
- Not touched by any M-3 lane: `supabase/migrations/20261105000000_content_tables.sql` (content lane; CHY-23 S2 revokes writes in its own new file), `src/lib/content/**`, `content/**`, `src/lib/audio*/**`, `src/service-worker/**`.
- Within L1, CHY-20/21/22 must not start while the previous Study slice is open: `index.ts`, `types.ts` and `apply.ts` are shared by every Study story.

## Locked facts (no question needed; sources)
- One card per word per skill (CHY-19 AC1-AC3; CONTEXT.md "Lexicon", "Practice").
- Gate Test passes at ≥ 80 %, best score kept, retries unlimited (CONTEXT.md "Gate Test"; CHY-20 AC2-AC4). CHY-20 compares integers: `correct × 100 ≥ 80 × total`, so 8/10 passes and 9/12 (75 %) fails.
- Freeze cap 2, auto-spent, no Freeze → Streak 0, Badges kept (CONTEXT.md "Streak Freeze", "Badge").
- Learner deletion: Pending deletion 7 days, then everything erased, nothing kept in anonymous form (CONTEXT.md "Learner"). CHY-23 implements the erase half as `on delete cascade` from `auth.users`; the 7-day pending state is account work (M-4/M-10), not M-3.
- Placement: blocks of 10, 80 % per block, about 20 new cards a day, never demoted (CONTEXT.md "Placement Test").

## Questions for Loc
Q1-Q10: **decided 2026-11-09, every one on option A** (the Captain relayed Loc's pick); kept below for the record. Q11 and Q12 are new in wave 2; each SPEC assumes the recommendation and does not block on it.
### Q1 [CHY-19] Which FSRS model and parameters does Study use?
ts-fsrs 6.0.0 is current (MIT). Its `DefaultScheduler()` uses FSRS-7 with these defaults. Measured on the Mac with fuzz off, start 2026-11-09 09:00 Asia/Ho_Chi_Minh:
| | A — FSRS-7 library defaults, fuzz off | B — FSRS-6 (`version: 'FSRS-6'`) | C — A with fuzz on |
|---|---|---|---|
| desired retention | 0.9 | 0.9 | 0.9 |
| learning / relearning steps | 1 min, 10 min / 10 min | same | same |
| new card, 1 right answer | due in 4.8 days | due in 10 min (learning step) | one run: 6.0 days |
| 2 right answers 10 min apart | due in 10.1 days | due in 2.0 days | one run: 8.0 days |
| wrong answer: review card / new card | 10 min / 1 min | 10 min / 1 min | 10 min / 1 min |
| same Attempts replayed twice | same due dates | same | not checked (depends on the fuzz seed) |
| maximum interval | 36,500 days | 36,500 | 36,500 |
Grade mapping (decided, CHY-19 S1 DISCUSSION): right = Good, wrong = Again. Hard and Easy are not used: an Attempt only records right or wrong.
rec: **A**. FSRS-7 is the library default and the newest model; fuzz only spreads load when a learner has hundreds of cards a day, and off keeps tests and replays exact.

### Q2 [CHY-19] Do the three skills share one parameter set?
Every word has three cards (thẻ từ, nghe, viết chữ). Writing costs 35 s a card, flashcards 10 s (prototype/data/lexicon.js:8-10).
| | A — one set for all skills | B — viết chữ at retention 0.85 |
|---|---|---|
| right answer on a new card, viết chữ | due in 4.8 days | later (fewer reviews, lower recall) |
| code | one scheduler | one scheduler per skill |
| tuning later | one optimizer run on all Attempts | three runs, each with a third of the data |
rec: **A**. Revisit after a month of real Attempts.

### Q3 [CHY-21, CHY-23] Which timezone ends the learner's day?
`settings.tz` (CHY-23 S1) holds an IANA name, default `Asia/Ho_Chi_Minh`. Example: a learner in HCM flies to Tokyo (UTC+9) on Friday.
| | A — `settings.tz`, set once from the device at first run, changed only in Settings (U4) | B — the device timezone at each Attempt |
|---|---|---|
| Friday in Tokyo ends at | 02:00 Tokyo (00:00 HCM) | 00:00 Tokyo |
| that day's length | 24 h | 22 h (a section at 23:30 HCM time can land on Saturday) |
| nightly rollover job (CHY-47) | one tz per learner from the table | needs the last device tz per learner |
rec: **A**. The Streak and "due today" then use one boundary on the phone and on the server.

### Q4 [CHY-21] When is a Freeze earned if a frozen day sits inside the run?
CONTEXT.md says "one for every 7 consecutive counted days". Example: Streak 13 with 1 Freeze on Monday; Tuesday missed (the Freeze is spent, Streak stays 13); Wednesday counted.
| | A — when the Streak reaches a multiple of 7 (7, 14, 21) | B — after 7 counted days with no frozen day between |
|---|---|---|
| Wednesday | Streak 14 → **FreezeEarned** | Streak 14, no Freeze (run restarted Wednesday) |
| next Freeze | at Streak 21 | 6 days after Wednesday at the earliest |
| CHY-21 AC6 (6 → 7) and AC7 (20 → 21 with 2 held, P9) | pass | pass |
rec: **A**, as the prototype does it (prototype/streak.js:16, `n % 7 === 0`).

### Q5 [CHY-21] Which practice counts a day for the Streak?
CONTEXT.md "Streak": a day counts when the learner "cleared every skill's due Practice that day". CHY-21 AC3: "finish one practice session". Example: 10 cards due (5 thẻ từ, 3 nghe, 2 viết chữ); the learner does only the 2-card viết chữ session.
| | A — any practice session finished (every card in it answered) | B — all due cards of every skill cleared |
|---|---|---|
| the 2-card viết chữ session | counts | does not count (8 still due) |
| a day with 0 cards due | a session is empty, so a section is needed | counts at once |
| doc change | CONTEXT.md "Streak" sentence rewritten in CHY-21 | none |
rec: **A**. AC beats the design doc (your rule), and B makes a zero-due day count without any study.

### Q6 [CHY-24] Where does a saved ("tự thêm") word live?
CONTEXT.md defines an Attempt as one answer to one question, and saving a Dictionary word is not an answer. CHY-23's AC names no table for it. CHY-19 S2 gives Study a `WordSaved` input either way, so only the storage is open.
| | A — new append-only table `lexicon_saves (learner_id, word, saved_at)` | B — an `attempts` row with `question_id = 'save:<word>'` | C — an array in `settings` |
|---|---|---|---|
| fits the Attempt definition | yes | no | yes |
| sync + replay | Ledger syncs two tables | one table | last write wins between 2 phones |
| work | 1 migration + 1 sync path in CHY-24 | none extra | 1 column |
| locked line "Study is tested only through `apply`/`rollover` with Attempt sequences" (architecture.md:30) | reworded to "its exports, with Attempt and WordSaved sequences" (CHY-19 S2) | reworded too (Study still takes `WordSaved` and S2 tests `session`/`minutes`) | reworded |
rec: **A**, built in CHY-24 S1 (L3 owns the migration).

### Q7 [CHY-24] How does the Ledger get a signed-in learner before M-4's login screen?
CHY-24 AC2/AC5/AC7 need the server, and RLS needs `auth.uid()`. Login (CHY-26) is M-4.
| | A — local Supabase (`supabase start`) with 2 test users made by the service role; CI uses the in-memory store | B — wait for CHY-26 |
|---|---|---|
| CHY-24 S2 starts | after wave C | after M-4 |
| proof of AC2/AC5 on a real Postgres with RLS | yes, local | yes |
rec: **A**.

### Q8 [CHY-24] How is AC1 ("airplane mode, close and reopen, Từ mới shows as done, Streak counts today") proven before the lesson screens (M-5)?
| | A — dev-only `/dev/ledger` route: buttons record the Từ mới Attempts, shows SectionDone + DayCounted from `state()` | B — move AC1 to M-5 |
|---|---|---|
| AC1 proven in M-3 | yes, on iOS Safari in airplane mode | no |
| extra code | 1 route, not in nav (like M-2's `/dev/audio`) | none |
rec: **A**.

### Q9 [CHY-22] How do the hsk1/hsk2 badges get proven before the Mock Test runner (CHY-56, M-11)?
| | A — Study takes a Mock Test result Attempt (level, mode Exam/Practice, passed) now; tests feed synthetic Attempts | B — move the hsk1/hsk2 rows and AC5 to CHY-56 |
|---|---|---|
| CHY-22 ACs proven in M-3 | 5 of 5 | 3 of 5 (AC1 partly, AC5 not) |
| risk | CHY-56 must emit that Attempt shape | none now |
rec: **A**; the shape goes into C-M3-1 when CHY-22 is designed.

### Q10 [M-3] Run wave A as two parallel lanes?
| | A — L1 (CHY-19 S1) + L2 (CHY-23 S1) together | B — one slice at a time |
|---|---|---|
| slices to the end of CHY-19 + CHY-23 | 2 waves | 4 slices in a row |
| crew threads in wave A | 2 implementers + 1 tester + 1 reviewer | 1 + 1 + 1 |
rec: **A**. The lanes share no file (map above).

### Q11 [CHY-20] Which skills give a placed word new cards?
A learner placed into HSK 2 has about 505 HSK 1 words with no card (505 level-1 words in content/words, CHY-12 S2; the test fixture uses 250). Today only thẻ từ takes new cards (prototype/data/lexicon.js:56-57); nghe and viết chữ cards appear only after an Attempt in that skill.
| | A — thẻ từ only (prototype) | B — all three skills, one shared cap of 20 |
|---|---|---|
| days to introduce HSK 1's ~505 words | **26** | 76 (1,515 cards ÷ 20) |
| HSK 1 words practised by ear / by hand | only if the learner opens those lessons | all ~505 |
| code in CHY-20 S2 | the thẻ từ lane rule | new nghe / viết chữ lanes + an order across skills |
rec: **A**. It matches the prototype and keeps the placed learner moving; listening and writing for skipped words is a Practice call for CHY-42.

### Q12 [CHY-22] Do words100 / words300 count Lexicon words that were never reviewed?
The AC says "the Lexicon reaches 100 words"; CONTEXT.md "Badge" says "words known"; the prototype says "Học và lưu 100 từ". A Badge is permanent.
| | A — every Lexicon entry (AC literal) | B — entries with at least one card |
|---|---|---|
| placed into HSK 2, placement day | words100 fires | nothing |
| same learner, 20 new cards a day | — | words100 on day **5** |
| 100 saved words, none reviewed | words100 fires | nothing |
rec: **A**. The AC is explicit, and your rule puts the AC over the design doc.

## Parked (not M-3 work; recorded so nobody rediscovers them)
| # | Finding | Evidence | Owner |
|---|---|---|---|
| P1 | content-schema.md:172 says review cards are `hanzi→vi`, `audio→hanzi`, `vi→typePinyin`, `hanzi→hanviet`; CHY-19 and CONTEXT.md say three skills (thẻ từ, nghe, viết chữ) | the two texts | Captain: docs sync when CHY-41 (Luyện tập) frames |
| P2 | Backlog CHY-19 "dependencies: CHY-1" and CHY-23 "CHY-2, CHY-6" are met; Linear LOC-57/61 show no blockers, which matches | backlog/tasks/chy-19:13-14, chy-23:14-16 | none |
| P3 | ts-fsrs 6 declares `engines.node >= 24` and .npmrc sets `engine-strict=true`, so an install on Node < 24 fails; CI runs Node 24 (.github/workflows/ci.yml); the Vercel project's Node version is not in the repo | ts-fsrs package.json, .npmrc | CHY-19 S1 Task 6 reads the Vercel build log |
| P4 | With C-M3-4, `service_role` gets no grant on the learner tables; the nightly rollover / Reminder job (CHY-47) will need one | Supabase changelog 45329 | CHY-47 design |
| P5 | If the content migration reached the hosted project after its 2026-10-30 switch, `authenticated` cannot select content rows there today; CHY-23 S2's `grant select` fixes it on the next push. Not checked against the hosted project (no DB URL in this thread) | changelog 45329; 20261105000000_content_tables.sql has no `grant` | Captain: check before CHY-25 relies on Supabase reads |
| P6 | SvelteKit 3 removed `$lib` (3.1.0 installed) (node_modules/@sveltejs/kit/src/messages/build-errors.js:521); the repo imports `#lib/<path>.js` (package.json `imports`). Wave 1's CHY-19 S1 SPEC/PLAN/DISCUSSION said `$lib/study`; wave 2 changed them to `#lib/study/index.js`, ESLint rule included | CHY-19 S1 files on this branch | fixed here; the CHY-19 S1 implementer reads the new text |
| P7 | CHY-19 S2's `session(state, { now, tz, only })` takes `tz`, while State holds `tz` from CHY-21 S1 on; callers pass `state.tz`. Dropping the argument is a clean-up for whoever next edits `session` | CHY-19 S2 SPEC.md:7; CHY-21 S1 SPEC | CHY-41 when it calls `session` |
| P8 | CHY-22 AC3 seeds a replay with earned badges (`initialState({ badges })`), but the Ledger refolds from `initialState` without a badge seed, so a rule change could drop a badge from `state()` | CHY-22 S1 DISCUSSION | CHY-52 (Public Profile shows badges) or a CHY-24 follow-up |
| P9 | CHY-21 AC7's Given "Streak 13 with 2 Freezes" cannot be reached from Attempts under Q4 A (the 2nd Freeze comes at 14; a reset needs 0 Freezes); the test uses 20 → 21 | CHY-21 S2 DISCUSSION | Loc: the AC text, if he wants it to match |
