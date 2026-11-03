# CHY-12 S1 — spec
ACs: AC1, AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `pyproject.toml` (python >=3.11; deps `jieba`, `opencc`, `pyyaml`; dev group `pytest`; `package = false`) and `uv.lock` are committed. In a fresh clone with no `/tmp/etts` and no `/tmp/dict`, `uv run scripts/gen-entries.py 打 好` installs from the lock and runs. Verified by: clone to a scratch dir, run the command, read the output.
- [AC1] The script downloads what it needs into gitignored `.cache/words/` when a file is missing, and reuses it when present: `complete.min.json` (drkameleon, pinned to a commit sha in the URL), and five Tatoeba exports (three sentence files, two link files) (`cmn_sentences`, `eng_sentences`, `vie_sentences`, `cmn-eng_links`, `cmn-vie_links`, ≈ 27 MB, `downloads.tatoeba.org/exports/per_language`). It records each file's sha256 in `.cache/words/manifest.json`. A changed Tatoeba sha is logged, not an error. Verified by: second run prints no download lines.
- [AC1] No path under `/tmp` and no `~/.omp` path appears in the script. The LLM key is read from env `OPENCODE_API_KEY`; when unset the script exits 2 with a message naming the variable, before any download. Verified by: `grep -n "/tmp\|\.omp" scripts/gen-entries.py` prints nothing.
- [AC1] The word list is HSK 3.0 level 1: words whose drkameleon `l` contains `n1` and that exist in committed `prototype/data/dict.json` (505). Hán Việt per reading and the main reading come from dict.json. With no word arguments the script processes all 505; with arguments, only those (a word outside the list is reported and skipped).
- [AC2] The model must cover every CC-CEDICT sense id of a word (cross-reference senses removed up front, as today) in a sense's `src` or in `dropped` with a reason from: trùng, cổ/văn ngôn, tên riêng. Any other reason is an error. One repair round with the concrete errors is allowed.
- [AC2] After the repair round, any remaining error rejects the word: no `content/words` file and no sentence is written for it, nothing existing is deleted, and the message names the word and each uncovered id with its CC-CEDICT text, e.g. `打: thiếu nghĩa 1.3 "to hit"`. The run continues with the other words and exits 1, listing rejected words last.
- [AC2] A secondary reading (not the dict.json main reading) none of whose senses the model marked `common` is not written; the script moves its senses to `dropped` with reason "âm hiếm" (12.Q2 C). The main reading always gets a file.
- [AC3] Each sense's example is either a Tatoeba sentence from the candidate list (hanzi copied verbatim from Tatoeba; `source: tatoeba:<id>`; sentence id `s-w-<id>`) or an AI-written sentence (`source: ai`; id `s-w-ai-<first 8 hex of sha1(hanzi)>`). A sentence id is used by one sense per word. The AI sentence is ≤ 12 hanzi and contains the word. Verified by: reading the staged files.
- [AC3] An AI example is allowed only when no Tatoeba candidate for that word fits the sense (the prompt says so; the pilot's 64/88 AI share is reported in the run summary as `tatoeba N / ai M`, not capped).
- [AC3] Output goes to staging `.cache/words/out/`, never directly to `content/`: `words/<id>.yaml` (a `Word`: main reading id = hanzi; a secondary reading id = `<hz>-<numbered pinyin, no spaces>`, one digit per syllable, neutral = 5: `打-da2`, `地-de5`, `东西-dong1xi1`) and `sentences/hsk1.yaml` (`Sentence[]`, merged by id across runs). Each Word has `pinyin` with tone marks, `hanviet`, `level: 1`, `pos` = union of sense pos, `senses[]` = `{vi, pos, rare?, example}` (common first within a POS group, `rare: true` for `common:false`), `examples` = the file's hand `examples` (ids not starting `s-w-`) first, then the first distinct sense examples, at most 3.
- [AC3] Word POS codes map from the Vietnamese labels: Danh từ n, Động từ v, Tính từ adj, Phó từ adv, Lượng từ mw, Đại từ pron, Số từ num, Giới từ prep, Liên từ conj, Trợ từ part, Thán từ interj, Bổ ngữ comp, Cụm từ and Thành ngữ phrase.
- [AC3] Existing `content/words/<id>.yaml` with hand-authored `image`, `parts`, `components`, `spoken`, `collocations` keeps them; an existing `hanviet` wins, existing hand senses (those without `pos`; every generated sense carries `pos`) stay first and verbatim and generated senses are appended, a re-run replaces earlier generated senses, never duplicates them (C4, agreed with CHAA-22): the staged file is the existing file with the other generated fields replaced. Files of words outside the HSK1 list are never touched.
- [AC3] Generated pinyin (words and sentences) passes the CHY-9 checks that apply (C1): no digits, tone marks present per the check-3 rule agreed with CHAA-21, no code point in U+2E80–U+2FDF. A sentence whose `py` fails the rule counts as an error of its word (rejected after the repair round).
- [AC3] When a word is generated successfully, its earlier staged files are replaced: every staged id of that word (`<hz>` and `<hz>-*`) is removed before the new ones are written. A rejected word leaves earlier staged files as they were.
- [LOCK] LLM edits, never authors senses; Tatoeba text is verbatim; 20-entry spot-check is S2.

## Not this slice
- AC4 (all 505 words run, corpus written to `content/`), AC5 (`--sample`, `--promote`, Loc's 20-entry approval) → S2.
- Schema edits (`pos`, `rare`, `example`, `Sentence.source`, `Sentences`, Pos `comp`) → CHY-11 (C6). S1 reads them.
- Word Page fold and source-label rendering → CHY-32. Importer, lint code → CHY-8, CHY-9. Audio for example sentences → CHY-15.
- `prototype/data/entries.json` stays as the pilot; the new script no longer writes it.

## Seam
`scripts/gen-entries.py`: `main` (arguments, env, download), `check` (coverage + reasons), `entry` (prompt, repair, reject), new `to_yaml` (entry → Word + Sentences).

## Test contract
- [AC1] pytest `scripts/tests/test_gen_entries.py`: source contains no `/tmp` or `.omp`; with `OPENCODE_API_KEY` unset `main` exits 2 and names the variable; with a pre-filled cache dir no download function is called.
- [AC1] Manual (verify stage): fresh clone, `uv run scripts/gen-entries.py 打 好`, exit 0 and staged files exist.
- [AC2] pytest with a fake `ask`: a word whose output leaves sense 1.3 uncovered twice → rejected, message contains `1.3` and its CC-CEDICT text, no file in the output dir; uncovered once then fixed on the repair → written.
- [AC2] pytest: a `dropped` reason outside the three allowed → error; a secondary reading with no common sense → no file, senses in dropped "âm hiếm"; the main reading with no common sense → still written.
- [AC3] pytest: Tatoeba example → sentence `s-w-5670795`, `source: tatoeba:5670795`, hanzi equals the Tatoeba text not the model's copy; no-candidate example → `source: ai`, id `s-w-ai-` + 8 hex; same Tatoeba id used by two senses of one word → error.
- [AC3] pytest: POS map covers all 14 Vietnamese labels; an unknown label → error; existing file with `image`, `parts`, `hanviet`, `examples` and `senses[0]` → staged file keeps all of them and appends the generated senses after `senses[0]`.
- [AC3] vitest `src/lib/content/words-pipeline.test.ts`: the committed fixtures `scripts/tests/fixtures/out/words/*.yaml` and `sentences/hsk1.yaml` parse with `Word` / `Sentences` (needs CHY-11's schema commit).

## Open assumptions
- [AC3] C1 check 3 (agreed with CHAA-21): flag any digit; flag a string with no tone-marked vowel unless the whole string equals one of the neutral strings de le ma me men ne ba zi zhe guo a ya (and na, chu lai, qi lai below). CHAA-21 accepted na, chu lai, qi lai (哪, 出来, 起来) as whole-string exceptions (2026-11-03), so the list is 15 strings.
- [AC1] Assumed `OPENCODE_API_KEY` is the key name for the opencode go endpoint the pilot used (12 Answered here #3); if Loc's key lives under another name only the env lookup changes.
