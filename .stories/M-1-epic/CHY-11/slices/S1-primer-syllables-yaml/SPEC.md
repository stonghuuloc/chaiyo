# CHY-11 S1 — spec
ACs: AC1, AC2, AC3, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `content/lessons/hsk1/h0-00.yaml` exists with `kind: primer`, `id: h0-00`, `level: 1`, `order: 0`, `title: Nhập môn`, `titleHanzi: 拼音`, the prototype scene, and parses with 0 errors as `Primer`. Verified by: `parseContent('Primer', …)`.
- [AC1] Content is converted from `prototype/data/h0-00.js`: 5 sections (tones, finals, initials, spelling, sandhi), 29 cards (6, 6, 7, 4, 6), 4 drills per section (20), gate `{ draw: 10, testOut: true, pool: 24 }`. Section title/hint and per-question title are not carried over (a7).
- [AC1] Every question is a schema `Question`: id `q-h0-00-<section>-NN` (drill) or `q-h0-00-g-<section>-NN` (pool), type `choice`, `optionKind: pinyin`, 0-based `answer` into `options`, `why` from the prototype, optional `ask` for the 14 questions that show a sentence next to the audio, `tests: { tone: true }` on tone and sandhi questions else `{}`. HTML in prototype prompts becomes plain text.
- [AC1] Audio prompts are `{ kind: syllable, text: <tone-marked syllable> }` using the tone-1/real syllable the prototype plays (an1 → ān); the two 3-3 questions (nǐ hǎo) add `spoken: ní hǎo`. Text-only questions (4) use `{ kind: vi, text }`.
- [AC1] A card chip is a plain tone-marked string when its label equals what is played and it has no hanzi, else `{ say, label?, hanzi? }` (62 labelled, 28 with hanzi, 15 plain of 105). Prototype keys map: ma1 → mā, lv3 → lǚ, ni3hao3 → 'nǐ hǎo', a1=a → { say: ā, label: a }.
- [AC1] `content/syllables.yaml` stays at 405 rows and parses as `Syllables`; it is edited only if AC2's lint finds a missing syllable.
- [AC2] Every `say` / string chip and every `pairs` entry, after dropping tone marks (ü kept) and splitting on spaces, is a `syllable` row of syllables.yaml. Verified by: `lintDir` returns 0 errors on the real files, and 1 error at `sections.finals.cards[0].syllables[0]` when that whole entry is replaced by the string 'xyz'.
- [AC2] Removing the row `ma` from a copy of syllables.yaml makes the lint report every card entry that has a `ma` piece: the Tones chips (`tones.cards[0..3].syllables[0].say` and `tones.cards[5].syllables[0..3].say`, 8 entries) and the Sandhi chip 'mā ma' (`sections.sandhi.cards[5].syllables[0].say`). Verified by: the expected path set is built as `typeof e === 'string' ? p : p + '.say'` over every entry with a `ma` piece (9 paths, 10 errors; one error per piece, so 'mā ma' gives 2).
- [AC3] Each of the 5 sections has ≥ 1 drill (4 each). With `sections.sandhi.drills: []` the lint reports one error at `sections.sandhi.drills`.
- [AC4] Gate pool has 24 questions (tones 4, finals 5, initials 5, spelling 5, sandhi 5), each with `section`, ≥ 2 × draw (20). With the pool cut to 19, or with every sandhi question removed, the lint reports an error (count; missing section 'sandhi').
- [LOCK] Schema changes land first, per C6 (Captain, 2026-11-03): Question gets optional `section` (tones|finals|initials|spelling|sandhi), `why`, `ask`; Prompt syllable gets optional `spoken`; Primer card `syllables`/`pairs` entries are `string | { say, label?, hanzi? }`. CHY-12's additions (C6, CHAA-24): Word sense `pos?` (Pos plus `comp`), `rare?: true`, `example?`; Sentence `source?: 'ai' | tatoeba:<digits>`; new type `Sentences = Sentence[]`. All stay strict; fixtures and docs/content-schema.md Types change with them.
- [LOCK] `content.test.ts` (C6, Captain 2026-11-03) drops the hard-coded file count: it walks every `.yaml` under `content/`, picks the type by path (words → Word, grammar → GrammarPoint, chars → Char, sentences → Sentences, syllables.yaml → Syllables, lessons/ → Primer when `kind: primer` else Lesson), parses each with 0 errors, and fails on a file that matches no rule except the placeholders cast.yaml, levels/, mock/. Other lanes then only add folders.

## Not this slice
- The lint module and its CLI (CHY-9 C1), importer, bundle `h0-00.json`, audio manifest (CHY-8), Bài 1 (CHY-10), words/chars (CHY-12), fonts (CHY-13), the Primer renderer.
- `cast.yaml` is `[]`, so `scene.cast: [panda]` references nothing; no check reads it today.

## Seam
`content/lessons/hsk1/h0-00.yaml` (new content) plus the C6 schema fields in `src/lib/content/schemas.ts`; verified through `lintDir` from CHY-9.

## Test contract
- [AC1] vitest: `parseContent('Primer')` on h0-00.yaml is ok; `lintDir` on a temp dir with h0-00.yaml + syllables.yaml has `errors` equal to `[]`; `content.test.ts` parses every file under `content/`, h0-00.yaml as Primer.
- [AC2] vitest: bogus chip (whole entry replaced by the string 'xyz') → 1 error at the expected path; syllables.yaml without row `ma` → errors on exactly the entries with a `ma` piece (path set computed from the YAML); a `pairs` entry replaced by the string 'xyz' → error at `sections.initials.cards[0].pairs[0][1]`.
- [AC3] vitest: each section's `drills.length` ≥ 1; sandhi drills emptied → error at `sections.sandhi.drills`.
- [AC4] vitest: pool length 24, covers the 5 `section` values, ≥ 2 × draw; one item dropped per section (24→19, 5 sections kept) → exactly the count error; the 5 sandhi items retagged `tones` (24 kept) → exactly the missing-sandhi error.
- [AC1] exits 0: copy h0-00.yaml and syllables.yaml into `$T` as `lessons/hsk1/h0-00.yaml` and `syllables.yaml`, then run `pnpm -s lint:content $T` and expect exit 0 (CHY-9 S2 is on main). Default `content/` lints with 107 errors in 9 files from other lanes (measured on main f5896d6), none in h0-00. Recorded in SUMMARY.
- [LOCK] vitest: schemas.test.ts valid/invalid fixture pair per changed type (plus `Sentences`) passes; new cases: `rare: false` rejected, sense `pos: foo` rejected, `source: tatoeba:abc` rejected, chip object accepted, unknown chip key rejected, bad `section` value rejected, `spoken` on a vi prompt rejected.

## Open assumptions
- [AC1] lintDir verified on f5896d6; the paths are as in the table, with `.say` on object chips.
- [AC1] The 3-3 chip audio assumption is parked (PARKED.md); wrong pick costs 3 chips.
