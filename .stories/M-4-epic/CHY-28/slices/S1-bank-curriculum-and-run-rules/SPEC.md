# CHY-28 S1 — spec
ACs: AC1 (bank and grading rules), AC2  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb)

## Behaviour
- [AC1] `src/lib/placement/bank.ts` (new) holds the prototype bank as data, copied item for item from `prototype/data/placement.js:6-71`: `BLOCKS` (levels 1-5, `read: [hanzi, nghĩa, [3 distractors]]`, `listen: [hanzi, [3 distractors]]`), `PASS = 8`, `PLACEMENT_SHA = 'placement-1'`.
- [AC1] `items(level)` returns 10 items in the order `RRLRLRRLRL` (placement.js:75): read → `{ id: 'pl-<level>-<hanzi>', kind: 'read', hanzi, answer: nghĩa, options: [nghĩa, ...distractors] }` (no pinyin field); listen → `{ id, kind: 'listen', hanzi, answer: hanzi, options: [hanzi, ...distractors], clip: CLIPS[hanzi] }`. The screen shuffles options (S2).
- [AC1] `src/lib/placement/clips.json` (generated, committed) maps each of the 20 listen answers to `audioKey(hanzi, 'redpanda', WORD_STYLE, 'words')` (src/lib/content/import/audio.ts:21-34, the lesson word rule at :94-105). `scripts/placement-clips.ts <manifest-out>` writes clips.json and an audio manifest `{ entries }` of 20 `AudioEntry` `{ key, kind: 'word', ref: 'pl-<hanzi>', voice: 'redpanda', style: WORD_STYLE, folder: 'words', hanzi }` (render-audio.ts:71; src/lib/audio-renderer/render.ts:28 rechecks each key) for `pnpm render:audio`.
- [AC1] [AC2] `src/lib/placement/run.ts` (new): `startRun(uuid)` → level 1, item 0, miss 0, cleared 0, no Attempts, a run id from `uuid()`. `answer(run, { ok, pick?, ms, at }, uuid)` appends one Attempt `{ id: uuid(), at, questionId: item.id, contentSha: PLACEMENT_SHA, correct: ok, ms, answer: pick, step: { kind: 'placement', level, run: <this level's run id>, of: 10 } }` (`answer` omitted for "Không biết", which the screen sends as `ok: false`). A wrong answer adds a miss; the 3rd miss in a level (`10 − PASS + 1`) ends the run at once. The 10th answer of a level with < 3 misses sets `cleared = level` and moves to level + 1 with a new run id and 0 misses; after level 5 the run ends. `run.done`, `run.cleared`, `run.attempts` are read by S2/S3. Every call returns a new object.
- [AC2] The start level shown by S3 = `cleared` = the number of levels cleared before the run stopped.
- [CHORE] Q3 A (curriculum): `scripts/build-curriculum.ts` reads `content/lessons/**/*.yaml` and writes `src/lib/curriculum/curriculum.json`: lessons sorted by `level`, then `order`, each `{ id, level, n, title, titleHanzi, sections: Object.keys(sections).filter((k) => k !== 'warmup'), words: sections.words?.ids ?? [], testOut?: true }` with `n` = index (h0-00 = 0) and `testOut` for `kind: primer`. `src/lib/curriculum/index.ts` exports `LESSONS` and `CURRICULUM: Curriculum` (`#lib/study/index.js` type). `package.json` gains `"curriculum": "tsx scripts/build-curriculum.ts"` and `"placement:clips": "tsx scripts/placement-clips.ts"`.
- [CHORE] Clips: the 20 listen clips are rendered to R2 with `pnpm render:audio <manifest> --kind word` on the Mac by whoever holds the Azure key (ADR 0007: raw clips, no trim). `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- The O2 screen, audio playback, option shuffle, exit sheet → S2. Result screen, recording Attempts, Study fold → S3.

## Seam
None new: `run.ts` is pure; S2 drives it, S3 records `run.attempts`.

## Test contract
CI (vitest, node):
- [AC1] `bank.test.ts`: for each level 1-5, `items(level)` has 10 items, kinds `RRLRLRRLRL`, 6 read + 4 listen, 4 options each including the answer, no item has a `pinyin` key; across the bank the 200 option strings are distinct (checked on the prototype file 2026-11-11: 200 distinct); every listen item has a `clip` matching `/^words\/[0-9a-f]{64}$/`.
- [AC1] `clips.test.ts`: for each of the 20 listen answers, `clips.json[hanzi] === audioKey(hanzi, 'redpanda', WORD_STYLE, 'words')`; 20 keys.
- [AC1] `run.test.ts` "Không biết": `answer(startRun(u), { ok: false, ms: 900, at }, u)` → Attempt `correct: false`, no `answer` key, miss 1.
- [AC2] `run.test.ts` (uuid = counter `u0, u1, …`; `at` = 2026-11-11T02:00:00Z + i s):
  - L1 R W R W R W → done after the 6th answer, cleared 0, 6 Attempts, all `step.level` 1, `of` 10, one run id.
  - L1 R×7 W W W → done after the 10th answer, cleared 0, 10 Attempts (a 3rd miss on the last item does not clear).
  - L1 R×8 W W → level 2, miss 0, cleared 1; then W W W → done, cleared 1, 13 Attempts.
  - L1 R×10; L2 W W R×8; L3 R W R W W → done after 25 answers, cleared 2; run ids: 3 distinct, one per level.
  - 50 right answers → done, cleared 5, 50 Attempts. Negative control: `miss > 3` instead of `>= 3` → the first row is not done after 6; revert.
- [CHORE] `curriculum.test.ts`: building from `content/` in-process deep-equals the committed curriculum.json (drift guard); ids h0-00, h1-01, h2-01, h3-01, h4-01, h5-01 with `n` 0-5, word counts 0, 10, 12, 13, 15, 15 (65 in all); h0-00 `testOut: true` and sections tones, finals, initials, spelling, sandhi; h1-01 sections words, grammar, dialogue, listenSpeak, writing; h3-01 words, grammar, dialogue, reading, listenSpeak, writing; no lesson lists warmup (CHY-20: warm-up does not gate the Gate Test, progress.ts:17). Negative control: drop the filter → this row fails; revert.

## Open assumptions
- WAVE-PLAN Q3 (curriculum source) assumed A; B or C replaces the [CHORE] curriculum item and `curriculum.test.ts`.
