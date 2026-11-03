# CHY-12 S2 — plan
ACs: AC4, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-12 (continues after S1; same PR)
Prerequisites: S1 done (script, env, tests); CHY-11's schema commit on main and rebased in (`Sentences`, sense `pos/rare/example`); `OPENCODE_API_KEY` exported by Loc for the run; `pnpm install` done. No `rg` on the Mac: use `grep`.

## Anchors (verified 2026-11-03 on 9007e33; gen-entries.py lines are the pre-S1 file, S1 Task 2 moves the run block into `main`)
- `scripts/gen-entries.py:144-154` run block (S1 → `main`); S2 adds flags next to its argument parsing, and `to_yaml`/`write_out` from S1 Task 4 write `.cache/words/out/`.
- `src/lib/content/content.test.ts:8-12` folders list (words, grammar, lessons) · `:23-25` file collection · `:28-30` `finds all 84 content files` · `:32` per-file parse test.
- `vite.config.ts:33` vitest include `src/**/*.{test,spec}.{js,ts}` · `requireAssertions: true` (`:26`).
- `prototype/data/dict.json` rows: index 0 hanzi, index 5 level; 505 rows with level 1. `content/words/` 67 files today; `content/sentences/` absent.
- `package.json:16` `"test": "vitest --run --passWithNoTests"`. C1 CLI `pnpm lint:content [dir]` arrives with CHY-9.
- Reference for the review page: pilot renderer `prototype/w1-word.html:215-235` (rare fold `s.common === false`, source label `x.tatoeba` / "AI viết").

## Task 1 [AC5] Seeded sample and review page
File: `scripts/gen-entries.py:144` (the flags in `main`) · new function `review(out_dir, seed)`
- Change: `--sample 20 --seed N` reads staged `words/*.yaml` and `sentences/hsk1.yaml`, picks `random.Random(N).sample(sorted(ids), 20)`, writes `review-N.md`: header (totals, staged-set sha256 over sorted file names + bytes), then per entry: `### <id> <hanzi> <pinyin> · <hanviet>`, senses grouped by pos with `★` on `rare: true`, each example as `hanzi / pinyin / vi — Tatoeba #<id>|AI viết`, and `CC-CEDICT: <source senses>` taken from `.cache/words/out/src/<id>.json` (S1 `write_out` also saves the numbered source senses there). Fewer than 20 staged words → use all and print a warning.
- Test first: `test_sample_same_seed_same_ids`, `test_sample_different_seed_differs`, `test_review_page_lists_rare_star_and_labels`.
- Verify: `uv run pytest scripts/tests -k "sample or review"`

## Task 2 [AC5] Guarded promote
File: `scripts/gen-entries.py:144` · new function `promote(out_dir, seed)`
- Change: `--promote` without `--approved N` → exit 2. With it: `review-N.md` must exist and its sha equal the current staged-set sha, else exit 2 with `review-N.md is stale or missing` and nothing written. Then copy staged `words/*.yaml` to `content/words/` and `sentences/hsk1.yaml` to `content/sentences/hsk1.yaml` (create the folder). Existing `content/words` files of words outside the staged set are not opened.
- Test first: `test_promote_requires_approved_flag`, `test_promote_missing_review_exit_2_content_untouched`, `test_promote_stale_sha_exit_2`, `test_promote_matching_sha_copies`.
- Verify: `uv run pytest scripts/tests -k promote`

## Task 3 [AC4] Run summary with rare count
File: `scripts/gen-entries.py:144-154` (summary print at the end of `main`)
- Change: print `words N, files M, rejected R, tatoeba T / ai A, rare senses K in W words` (K = senses with `rare: true`, W = words with ≥1). A common sense never carries a `rare` key (S1 Task 4).
- Test first: `test_summary_counts_rare` (3 fake words, 1 rare sense → K = 1, W = 1).
- Verify: `uv run pytest scripts/tests -k summary`

## Task 4 [AC4] Raise content.test.ts to the new total; add sentences folder
File: `src/lib/content/content.test.ts:8-12, 28-30`
- Change: add `['sentences', 'Sentences']` to `folders`; replace `84` (and the test title) with the file count measured after promote (`find content/{words,grammar,lessons,sentences} -name '*.yaml' | wc -l`). No assertion removed or loosened.
- Test: this file is the test; it is red until Task 6 promotes (expected).
- Verify: `pnpm vitest --run src/lib/content/content.test.ts`

## Task 5 [AC4] Every HSK1 word has an entry
File: new `src/lib/content/hsk1-words.test.ts` (style `content.test.ts:1-6`)
- Change: read `prototype/data/dict.json`, keep rows with level 1 (505); for each hanzi: `content/words/<hz>.yaml` exists, `parseContent('Word', …)` ok, ≥1 sense has `pos` (hand senses without `pos` are allowed, C4), every sense that has `pos` has an `example`, and each `example` id is in `content/sentences/hsk1.yaml` (parsed with `Sentences`) or in a `content/lessons/**` sentence list. One summary case: across the 505 words at least one sense has `rare: true`, and no sense has a `rare` key with any other value.
- Test first: the file is the test; red until Task 6.
- Verify: `pnpm vitest --run src/lib/content/hsk1-words.test.ts` → 505 words checked

## Task 6 [AC4][AC5] Run, spot-check gate, promote, commit
Files: `.stories/M-1-epic/CHY-12/slices/S2-*/SPOTCHECK.md` (new), `content/words/*.yaml` (create ~560, edit 10 hand files), `content/sentences/hsk1.yaml` (create)
1. `uv run scripts/gen-entries.py` (all 505); read the summary; re-run rejected words by name, at most 2 more times each; a word still rejected → STOP, report word + sense ids to the Captain.
2. `uv run scripts/gen-entries.py --sample 20 --seed 1`; serve `review-1.md` to Loc (annotate-doc) and wait for his verdict. Any reject → fix the cause, regenerate affected words, `--seed 2`, repeat. Record seed, 20 ids, verdict, date in `SPOTCHECK.md`.
3. `uv run scripts/gen-entries.py --promote --approved <seed>`; `git status` shows only `content/words` + `content/sentences`; the 10 hand files (the 9 Bài 1 words and 起床) keep `image`, `parts`/`components`, `spoken`, authored `hanviet`, hand `senses` and hand `examples` (git diff check; 起床 has `examples: [s-h2-01-02]`).
3b. Hand data fix: `content/words/对不起.yaml:12` `bu`→`bù`, `没关系.yaml:13` `xi`→`xì`, `不客气.yaml:14` `qi`→`qì`, `关系.yaml` `系` part `xi`→`xì` (C1 check 3, reported by CHAA-21); check with `grep -n "pinyin: \(bu\|xi\|qi\)," content/words/*.yaml` → no hit.
4. Tasks 4–5 turn green; `pnpm lint:content` exits 0 when on main; `pnpm check && pnpm lint && pnpm test`; commit `SPOTCHECK.md` first, then the content commit (signed, personal identity).
- Verify: `pnpm vitest --run src/lib/content` and `uv run pytest scripts/tests` → all pass.

## Files touched
| | Path | Why |
|---|---|---|
| edit | `scripts/gen-entries.py` | T1–T3 (CHY-12 owns) |
| create | `scripts/tests/test_gen_entries.py` cases for sample, promote, summary | T1–T3 (same file as S1) |
| create | `src/lib/content/hsk1-words.test.ts` | T5 |
| edit | `src/lib/content/content.test.ts` | T4 (CHY-7 test; count + folder only) |
| create | `content/words/*.yaml` (≈ 560), `content/sentences/hsk1.yaml` | T6, C4 owner |
| edit | `content/words/关系.yaml` (one part's pinyin; outside the list) | T6 step 3b |
| edit | 10 existing `content/words/{你,好,您,你们,对不起,没关系,谢谢,不客气,再见,起床}.yaml` | T6, hand fields preserved |
| create | `.stories/M-1-epic/CHY-12/slices/S2-*/SPOTCHECK.md` | AC5 record |
Not touched: `schemas.ts`, `docs/content-schema.md` (CHY-11), `content/lessons/**`, `content/chars/**` (CHY-10), and hand files of words outside the list.

## Mutation paths covered
- Writers: `promote` only (create new files; overwrite the 10 existing in-list files (the 9 Bài 1 words and 起床), merging hand fields as S1 Task 4 does; re-promote after a regenerate overwrites its own earlier output, because generated senses and `s-w-` examples are replaced, never duplicated). A stale or missing review blocks every write.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```python
def staged_sha(out):
    h = hashlib.sha256()
    for f in sorted(p for p in out.rglob('*') if p.is_file() and p.parent.name in ('words', 'sentences')):
        h.update(f.relative_to(out).as_posix().encode()); h.update(f.read_bytes())
    return h.hexdigest()
```

## Rollback
`git revert` the content commit; `.cache/words` is ignored; S1 code stays.
