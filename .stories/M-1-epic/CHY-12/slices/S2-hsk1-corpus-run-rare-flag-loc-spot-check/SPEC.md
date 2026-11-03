# CHY-12 S2 — spec
ACs: AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1  ·  needs S1 merged (the script) and CHY-11's schema on main

## Behaviour
- [AC4] `uv run scripts/gen-entries.py` with no arguments processes all 505 HSK 3.0 level-1 words into `.cache/words/out/`. The run summary prints `words N, files M, rejected R, tatoeba T / ai A, rare senses K in W words`. Verified by: reading the summary and the staged tree.
- [AC4] After the run (re-runs of rejected words included) every one of the 505 words has `words/<hz>.yaml` staged; a word rejected three times stops the work and is reported (decision 2). Verified by: `ls .cache/words/out/words` contains all 505 plain-hanzi ids.
- [AC4] A sense the model marked `common: false` is written with `rare: true`; a common sense has no `rare` key. W = words with ≥1 rare sense. Verified by: grep of staged YAML for `rare: true` equals the summary's K.
- [AC4] After promotion, `content/words/<hz>.yaml` exists for all 505, plus `content/sentences/hsk1.yaml`; `content/` files of words outside the list are unchanged (git diff shows no edit to them).
- [AC5] `--sample 20 --seed N` selects 20 staged Word ids with `random.Random(N)` over the sorted ids, and writes `.cache/words/out/review-N.md` showing each entry as Loc would judge it: hanzi, pinyin, Hán Việt, senses grouped by POS with ★ on rare ones, each example with its label and the CC-CEDICT source senses beside it. The header carries run totals and the staged-set sha. The same seed gives the same 20.
- [AC5] `--promote --approved N` fails with exit 2 and a message when `review-N.md` is missing or its sha differs from the current staged set (an entry changed after Loc saw the sample). It writes nothing to `content/` in that case. Without `--approved` the flag is refused.
- [AC5] Loc's verdict is recorded in `SPOTCHECK.md` in this slice's folder (seed, the 20 ids, verdict, date) before the promote commit. One rejected entry → regenerate the affected words, new seed, new sample; promote only after 20 of 20 pass.
- [AC4] The four hand files with unmarked `parts[].pinyin` (对不起, 没关系, 不客气, 关系) get the tone mark added (`bù`, `xì`, `qì`, `xì`) so C1 check 3 passes; no other field of them changes.
- [LOCK] The generated YAML passes the C1 checks that apply (0, 3, 6, 8): `pnpm lint:content` exits 0 when CHY-9's command is on main.

## Not this slice
- The script, env, rejection and example labelling (AC1–AC3) → S1.
- Word Page rendering of the "Xem thêm N nghĩa ít gặp" fold and the source label → CHY-32. This slice proves the `rare` data the fold reads.
- Importing to the bundle or Postgres → CHY-8. Credits page → CHY-62. Audio for the example sentences → CHY-15.

## Seam
`scripts/gen-entries.py` `main`: new `--sample`, `--seed`, `--promote`, `--approved` flags; promotion is the only code that writes `content/`.

## Test contract
- [AC4] pytest: a staged tree of 3 fake words with one rare sense → summary K = 1 and the staged sense has `rare: true`, the others have no `rare` key.
- [AC4] vitest `src/lib/content/hsk1-words.test.ts`: for each level-1 row of `prototype/data/dict.json` (505), `content/words/<hz>.yaml` exists, parses as Word, has ≥1 sense, ≥1 sense has `pos`, every sense that has `pos` has an `example` found in `content/sentences/hsk1.yaml` or a lesson.
- [AC4] vitest `content.test.ts`: the file count equals the new total and the sentences file parses as `Sentences`.
- [AC5] pytest: same seed → same 20 ids; different seed → different list; `--promote --approved N` with no review file → exit 2 and `content/` untouched; with a review file whose sha is stale → exit 2; with a matching file → files copied.
- [AC5] Manual gate (verify stage): Loc approves the 20 entries in `review-N.md`; `SPOTCHECK.md` committed before the content commit.

## Open assumptions
- [AC4] Assumed the HSK1 total is 505 (dict.json level 1). If CHY-8 or Loc counts 车上 or 500, only the test constant changes.
- [AC5] Assumed "random" means a plain seeded sample, not stratified by POS or rarity (Answered here #3).
