# CHY-12 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-12 (from origin/main 9007e33)
Order: Task 1 → 2 → 3 → 4 → 5. Task 6 (vitest) needs CHY-11's schema commit on main (C6); rebase onto it first, run `pnpm install`. No `rg` on the Mac: use `grep`.

## Anchors (verified 2026-11-03 on 9007e33)
- `scripts/gen-entries.py:12-16` imports (`sqlite3`, `urllib.request`, jieba, opencc) · `:18-24` ROOT, OUT (`prototype/data/entries.json`), SRC (`/tmp/dict`), DICT (from `prototype/data/dict.json`), HSK, KEY (sqlite `~/.omp/agent/agent.db`).
- `:25` POS_VI (14 labels) · `:26` POS_HINT · `:29` XREF · `:31-47` `tatoeba()` (reads `SRC/*.tsv.bz2`) · `:49-55` `candidates()` · `:57-64` `ask()` (key header `:60`).
- `:66-80` `source(hz)` readings + senses ids `fi.i` · `:82-96` `check()` · `:98-141` `entry()`: prompt `:104-123`, repair `:126-128`, stats incl. `errors` `:135-138`, `e['src']` `:141`.
- `:144-154` top-level run: words from argv, `tatoeba()`, merge into OUT, 8-thread pool, `OUT.write_text`.
- `prototype/data/dict.json` row = `[hz, pinyin, key, hanviet, short, level, senses[], others[[pinyin, hanviet, senses]]]` (built by `scripts/build-dict.py`, rows 5 = level; 505 with level 1).
- drkameleon `complete.min.json`: `{s, l:['n1',…], p:[pos], f:[{i:{y}, m:[senses]}]}`; HSK 3.0 level 1 = `'n1' in l`.
- `.gitignore:38` `scripts/__pycache__/` · `:39` `.annotate/` · `.prettierignore` already ignores `/content/`, `/.stories/`, `*.md`.
- `.github/workflows/ci.yml:26-29` install, check, lint, test:coverage · `:44` build.
- `NOTES.md:111` pilot instructions (`/tmp/etts/bin/python`, `/tmp/dict`) · `data/sources/README.md:5` table of third-party sources.
- `content/words/你好.yaml` hand file: `image`, `parts`, `spoken`, `examples: [ s-h1-01-14 ]`. `src/lib/content/schemas.ts:42` Word (after CHY-11: sense `pos?/rare?/example?`, `Sentences`).
- Verified on this Mac: `uv lock` for `jieba 0.42.1`, `opencc 1.4.2`, python 3.11 resolves; `uv` at /opt/homebrew/bin/uv. Source sizes: cmn 1.2 MB, eng 24.9 MB, vie 0.4 MB, links 0.5 MB.

## Task 1 [AC1] Committed uv environment
Files: new `pyproject.toml`, new `uv.lock`, `.gitignore:39` (+ `.cache/`), `.github/workflows/ci.yml:29` (after `pnpm test:coverage`: `astral-sh/setup-uv` + `uv run pytest scripts/tests`)
- Change: `[project] name="chaiyo-content" version="0.0.0" requires-python=">=3.11" dependencies=["jieba","opencc","pyyaml"]`, `[dependency-groups] dev=["pytest"]`, `[tool.uv] package=false`; `uv lock`.
- Test first: Task 2's `test_no_tmp_paths` fails until the script is cleaned.
- Verify: `uv sync --frozen && uv run python -c "import opencc, jieba, yaml"` → exit 0; `git status` shows `uv.lock` tracked.

## Task 2 [AC1] Self-downloading sources, env key, CLI shell
File: `scripts/gen-entries.py:12-24, 31-47, 57-64, 144-154`
- Change: delete `sqlite3` import and `KEY` (`:23-24`), `SRC=/tmp/dict` (`:20`), module-level `HSK`/`DICT` loads. Add `CACHE = ROOT/'.cache/words'`, `SOURCES = {name: url}` (drkameleon pinned to a commit sha URL, five Tatoeba URLs (cmn, eng, vie sentences; cmn-eng, cmn-vie links) under `https://downloads.tatoeba.org/exports/per_language/`), `fetch(name)` (download to `CACHE` if absent, write sha256 into `CACHE/manifest.json`, log `sha changed` when a known name differs). `ask()` reads `os.environ['OPENCODE_API_KEY']`; `main(argv, ask=ask)` checks the variable first and `sys.exit(2)` with `OPENCODE_API_KEY is not set` before any download. HSK1 set = `{s for e in HSK if 'n1' in e['l']} & DICT.keys()`; no args → all; unknown arg → print `skip <w>: not in HSK1 list`. Move the run block (`:144-154`) into `main`, guarded by `if __name__ == '__main__'`. `tatoeba()` takes the cache dir.
- Tests load the script with `importlib.util.spec_from_file_location` (hyphenated name) and a tmp cache dir seeded from `scripts/tests/fixtures/cache/` (tiny `complete.min.json` for 打 好, a few Tatoeba rows); `urllib.request.urlopen` is patched to raise, so CI never touches the network.
- Test first: `scripts/tests/test_gen_entries.py` — `test_no_tmp_paths` (source has no `/tmp` or `.omp`), `test_missing_key_exits_2_before_download` (monkeypatch `fetch` to raise), `test_cache_hit_skips_download` (real `fetch`; `urllib.request.urlopen` patched to raise).
- Verify: `uv run pytest scripts/tests -k "tmp or key or cache"`

## Task 3 [AC2] Coverage check, reject, run exit code
File: `scripts/gen-entries.py:82-96, 98-141, 144-154`
- Change: `check()` (`:82`) gains `REASONS = {'trùng','cổ/văn ngôn','tên riêng'}` (`âm hiếm` is appended by the script after `check()`, never accepted from the model) — a `dropped` entry with another reason is an error `lý do lạ <r>`; the uncovered message becomes `thiếu nghĩa <id> "<CC-CEDICT text>"` (text from `readings[].senses`, `source()` `:66`). `entry()` keeps one repair round (`:126-128`); after it, if `errs`: `raise Reject(hz, errs)` instead of saving with `stats.errors` (`:135`). After the repair, a non-main reading (`DICT[hz][1]`, `:139`) with no `common` sense is removed and its ids appended to `dropped` with `âm hiếm` (main reading kept). `main` catches `Reject` per future, prints `REJECT <word>: <errors>`, writes nothing for it, continues; exit code 1 when any rejected, list repeated last.
- Test first: `test_uncovered_twice_rejected_message_names_sense`, `test_uncovered_once_then_repaired_written`, `test_bad_drop_reason_is_error`, `test_secondary_reading_without_common_sense_dropped`, `test_main_reading_without_common_sense_kept` (fake `ask` returning canned JSON).
- Verify: `uv run pytest scripts/tests -k "uncovered or reason or reading"`

## Task 4 [AC3] Word + Sentence YAML from an entry
File: `scripts/gen-entries.py` (new `to_yaml` after `entry`, `:141`; `POS_CODE` next to `POS_VI`, `:25`)
- Change: `POS_CODE` = the 14 labels → n v adj adv mw pron num prep conj part interj comp phrase phrase. `to_yaml(hz, e)` returns `(words, sentences)`: per kept reading a Word `{id (hz for main; <hz>-<numbered pinyin, spaces removed, e.g. 东西-dong1xi1> otherwise, from drkameleon `i.n` (a syllable with no digit gets 5)), hanzi, pinyin (lowercase, marks), hanviet (DICT `:21` row[3] / others[1]), level: 1, pos (ordered union of sense pos), senses: [{vi, pos, rare: true?, example}], examples (existing hand ids first, then first distinct sense examples, <= 3)}`, senses in LLM group order, common before rare inside a group. Sentence per example: Tatoeba → `{id: s-w-<id>, hanzi (verbatim, `:131-134`), pinyin (`py`), vi, source: tatoeba:<id>}`; AI → `{id: s-w-ai-<sha1(hanzi)[:8]>, …, source: ai}`. `check()` also validates each sentence `py` (no digits; marked vowel unless the whole string equals one of the neutral strings [de le ma me men ne ba zi zhe guo a ya na, chu lai, qi lai: whole strings, agreed with CHAA-21]; no U+2E80–U+2FDF), one Tatoeba id per sense of a word, AI sentence ≤ 12 hanzi and contains `hz` (existing `:94`). `write_out(words, sentences)` first deletes the staged `words/<hz>.yaml` and `words/<hz>-*.yaml` of each successfully generated word (a rejected word keeps its earlier files), then also saves the numbered CC-CEDICT source senses of each word to `CACHE/out/src/<id>.json` (S2's review page reads them) and writes `CACHE/out/words/<id>.yaml` with `yaml.safe_dump(sort_keys=False, allow_unicode=True)` and merges `CACHE/out/sentences/hsk1.yaml` by id; for an existing `content/words/<id>.yaml` it loads it first and copies its `image`, `parts`, `components`, `spoken`, `collocations` into the staged Word (generated keys replaced; `examples` = existing ids first, then generated sense examples, capped at 3; an existing `hanviet` wins; existing senses WITHOUT `pos` are hand senses: kept first and verbatim; senses with `pos` are generated and replaced on every run; generated senses are appended; `examples` ids starting `s-w-` are generated and replaced, others kept; agreed with CHAA-22). Non-HSK1 files are never opened.
- Test first: `test_tatoeba_example_sentence_source_and_verbatim_text`, `test_ai_example_source_and_id`, `test_duplicate_tatoeba_id_in_word_is_error`, `test_pos_map_all_labels`, `test_unknown_pos_error`, `test_existing_hand_fields_preserved` (好.yaml with `examples: [ s-h1-01-11 ]` and `senses[0].vi: tốt, khỏe, hay` keeps both first), `test_rerun_replaces_generated_senses_no_duplicates`, `test_rerun_prunes_stale_secondary_reading_file`, `test_rejected_word_keeps_earlier_staged_files`, `test_multisyllable_secondary_id`, `test_pinyin_rule_cases` (digit, no mark, 吧 ba ok, 出来 chu lai ok, ni rejected).
- Verify: `uv run pytest scripts/tests -k "tatoeba or ai or pos or hand or pinyin"`

## Task 5 [AC3][CHORE] Docs: stale pilot instructions, source licences
Files: `NOTES.md:111`, `data/sources/README.md:5`
- Change: NOTES.md:111 → `uv run scripts/gen-entries.py [words]` needs `OPENCODE_API_KEY`, output `.cache/words/out/` (Word YAML + sentences/hsk1.yaml), `prototype/data/entries.json` stays as the pilot; sources table gains drkameleon complete-hsk-vocabulary (MIT), CC-CEDICT via it (CC BY-SA 4.0), Tatoeba (CC BY 2.0 FR), CVDICT via dict.json (CC BY-SA 4.0), all fetched into `.cache/words`.
- Verify: `grep -c "OPENCODE_API_KEY" NOTES.md` → 1; `grep -n "/tmp/etts" NOTES.md` → no line 111 hit.

## Task 6 [AC3] Fixtures parse under the C6 schemas
Files: new `scripts/tests/fixtures/out/words/{打.yaml,打-da2.yaml}`, new `scripts/tests/fixtures/out/sentences/hsk1.yaml`, new `src/lib/content/words-pipeline.test.ts`
- Change: fixtures are the staged output of `test_gen_entries` golden run (`test_golden_fixture_matches_script_output` regenerates and compares); the vitest reads them with `parseContent('Word', …)` and `parseContent('Sentences', …)` and asserts 0 errors; plus a second case: a sense with `rare: false` → error path `senses[0].rare`.
- Test first: the vitest file is the test (style: `src/lib/content/content.test.ts:1-9`).
- Verify: `pnpm vitest --run src/lib/content/words-pipeline.test.ts && uv run pytest scripts/tests`

## Files touched
| | Path | Why |
|---|---|---|
| create | `pyproject.toml`, `uv.lock` | T1 env |
| create | `scripts/tests/test_gen_entries.py`, `scripts/tests/fixtures/cache/**`, `scripts/tests/fixtures/out/**` | T2–T4, T6 |
| create | `src/lib/content/words-pipeline.test.ts` | T6 |
| edit | `scripts/gen-entries.py` | T2–T4 (CHY-12 owns) |
| edit | `.gitignore`, `.github/workflows/ci.yml` | T1 (outside the lane list: one line each; flagged to the Captain) |
| edit | `NOTES.md`, `data/sources/README.md` | T5 docs |
Not touched: `src/lib/content/schemas.ts`, `docs/content-schema.md` (CHY-11, C6), `content/**` (S2), `prototype/**`.

## Mutation paths covered
- Writers: `write_out` only; first-time create (no staged file) and re-run over an existing staged file or hand file (Task 4 hand-field test); a rejected word writes nothing (Task 3 test asserts the out dir is empty). `content/` is never written in S1.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk. A self-contradictory fixture is reported, not hacked around)
```python
class Reject(Exception):
    def __init__(self, hz, errs): super().__init__(f'{hz}: {"; ".join(errs)}'); self.hz, self.errs = hz, errs

def sid(x): return f's-w-{x["tatoeba"]}' if x.get('tatoeba') else 's-w-ai-' + hashlib.sha1(x['hz'].encode()).hexdigest()[:8]
```

## Rollback
Revert the slice commits; delete `.cache/words/` (ignored); `prototype/data/entries.json` is untouched.
