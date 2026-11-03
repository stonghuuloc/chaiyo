# CHY-12 S1 — discussion
ACs: AC1, AC2, AC3 (decisions are story-wide; S2 reuses them for its own ACs)

## Current behaviour (verified, with anchors)
- [AC1] scripts/gen-entries.py runs under `/tmp/etts/bin/python` (line 10), reads `/tmp/dict` (line 20), takes its key from `~/.omp/agent/agent.db` (22-23). No pyproject.toml / uv.lock in the repo.
- [AC2] `check()` (gen-entries.py:84) finds uncovered senses, but `entry()` (128-135) saves the word with `stats.errors` filled. Task: reject instead.
- [AC3] Tatoeba id kept per example (`tatoeba`, `ai`); output is prototype/data/entries.json, not `Word` YAML. `Word`/`Sentence` (schemas.ts:42,70) have no source, rare or per-sense pos field. Task: schema change + emit YAML.
- [AC2] 505 HSK 3.0 L1 words in dict.json; 2,008 kept CC-CEDICT senses, 573 readings, 55 words with 2+ readings (computed from drkameleon complete.min.json).
- [AC3] content/words has 67 hand-written files (11 level 1: 你好, 好, 你…); content/chars and content/sentences do not exist.
- [AC3] Pilot: 10 words, 88 sentences, 24 Tatoeba / 64 AI (NOTES.md:111, entries.json stats).

## Answered here (no human needed — taken at ≥80% under Loc's 2026-11-03 rule, veto at PICTURE review)
| # | Decision | Conf. % | Reason |
|---|---|---|---|
| 1 | split: S1 script (AC1–3), S2 corpus + spot-check (AC4–5) | 85 | env and source download have one consumer, the script; AC4–5 need the finished script |
| 2 | HSK1 = HSK 3.0 level 1 ∩ prototype dict.json = 505 words (drkameleon `n1`; 车上 is in n1 but not in dict.json, skipped) | 95 | schema Level, grammar GF 0025-2021 and build-dict.py all use HSK 3.0; `o1` has 150 |
| 3 | LLM key from env var `OPENCODE_API_KEY`, same endpoint and model as the pilot (gpt-6-luna) | 85 | `~/.omp/agent/agent.db` cannot ship; changing model changes the 24/64 Tatoeba/AI split Loc saw |
| 4 | `pyproject.toml` + `uv.lock` (python>=3.11; jieba, opencc), run as `uv run scripts/gen-entries.py` | 90 | AC1 says "through uv using the committed pyproject"; uv at /opt/homebrew/bin/uv |
| 5 | sources download into gitignored `.cache/words/`; drkameleon pinned by commit, Tatoeba exports (rolling weekly, no archive) by recorded sha256 in the run manifest, not a hard fail | 80 | Tatoeba keeps no old exports; the generated YAML is the reproducible artifact |
| 6 | reject = after the existing 1 repair round, a word with any error is written nowhere, the run continues, exit code 1 lists each rejected word and sense id | 95 | AC2; pilot wrote errors into stats and saved anyway (gen-entries.py:128-135) |
| 7 | existing file for an HSK1 word keeps hand fields image, parts, components, spoken, collocations; pipeline rewrites pinyin, level, pos, and appends generated senses after existing ones (existing hanviet and examples win, agreed with CHAA-22). Non-HSK1 files (mock words, 你好 phrases) untouched | 80 | C4 in CONTRACTS.md; CHY-10 paused |
| 8 | AC5 mechanics: script writes to `.cache/words/out/`; `--sample 20 --seed N` writes a review page; `--promote` copies to content/words only after Loc's approval; reject → fix, new seed | 85 | AC5 order: approve before import |
| 9 | Hán Việt per reading from committed `prototype/data/dict.json` (CVDICT), written as Word.hanviet; chars/ is empty so no derivation exists | 80 | content/chars is empty; the Word Page needs HV |
| 10 | "Bổ ngữ" gets Pos code `comp`, "Thành ngữ"/"Cụm từ" map to `phrase`; per-sense `pos` replaces nothing, Word.pos stays the union | 80 | schema Pos has no complement; pilot uses 好/完/到 as 补语 |
| 11 | Word ids: main reading keeps plain id (`打`); a secondary reading with ≥1 common sense is `<hz>-<pinyin><tone digit>` (`打-da2`); files sit at content/words/<id>.yaml | 85 | lessons already reference plain ids (你, 好); doc example `行-hang` collides when tones differ (dá/dǎ) |
| 12 | `Sentence.source` is a string `'ai' \| 'tatoeba:<digits>'` (sent to CHAA-23, C6); sense fields `pos?`, `rare?: true`, `example?` | 90 | C6 text names `tatoeba:5670795` |
| 13 | Tests: pytest (dev group) for the script with an injected fake LLM; vitest parses generated fixtures under the C6 schemas | 85 | script has no tests today; schema is TS |
| 14 | Rare-only secondary readings are dropped by the script (reason "âm hiếm"), not by the LLM | 85 | keeps AC2's reasons fixed and the rule deterministic |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | 12.Q1 [AC3] | sentences home | A — content/sentences/hsk1.yaml with ids, `Sentence.source` | Captain under Loc's 80% rule, 2026-11-03 |
| 1 | 12.Q2 [AC2] | readings with own Word file | C — only readings with ≥1 common sense; main reading always | Captain under Loc's 80% rule, 2026-11-03 |
| 1 | 12.Q3 [AC3] | examples per sense | A — one per sense | Captain under Loc's 80% rule, 2026-11-03 |

## Open — needs an answer before spec
(none — Q1–Q3 answered; frontier empty)

## Locked (do not re-open)
- LLM edits, never authors; Tatoeba verbatim; AI examples labelled "AI viết"; 20-entry spot-check before import.
