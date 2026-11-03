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
| 7 | existing file for an HSK1 word keeps hand fields image, parts, components, spoken, collocations; pipeline rewrites pinyin, hanviet, level, pos, senses, examples. Non-HSK1 files (mock words, 你好 phrases) untouched | 80 | C4 in CONTRACTS.md; CHY-10 paused |
| 8 | AC5 mechanics: script writes to `.cache/words/out/`; `--sample 20 --seed N` writes a review page; `--promote` copies to content/words only after Loc's approval; reject → fix, new seed | 85 | AC5 order: approve before import |
| 9 | Hán Việt per reading from committed `prototype/data/dict.json` (CVDICT), written as Word.hanviet; chars/ is empty so no derivation exists | 80 | content/chars is empty; the Word Page needs HV |
| 10 | "Bổ ngữ" gets Pos code `comp`, "Thành ngữ"/"Cụm từ" map to `phrase`; per-sense `pos` replaces nothing, Word.pos stays the union | 80 | schema Pos has no complement; pilot uses 好/完/到 as 补语 |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|

## Open — needs an answer before spec
### 12.Q1 [AC3] Owner: Loc — Where do a word's example sentences and their source label live: a new shared sentences file with ids, or inline on each sense?

**Setup** — 打 dǎ, sense "đánh đập" (CC-CEDICT "to beat"), Tatoeba #5670795 「她打了他。」 (pilot, entries.json). `Word.senses` is `{vi, note?}` today and `Sentence` has no source field (schemas.ts:42-79).

| | A — sentences file + ids | B — inline on the sense |
|---|---|---|
| sense in 打.yaml | `{ vi: đánh đập, pos: v, example: s-w-5670795 }` | `{ vi: đánh đập, pos: v, example: { hanzi: 她打了他。, pinyin: …, vi: …, source: tatoeba:5670795 } }` |
| where the sentence text sits | `content/sentences/hsk1.yaml`, one `Sentence` with `source` | inside the word file, no id |
| audio key, tap lookup, Error Report (principle 2, content-schema.md:8) | work unchanged: they hang off the sentence id | cannot attach, no id |
| new schema surface | `Sentence.source?` + 1 file kind + C1/C2 touch (CHAA-21, CHAA-20 asked) | no new file kind, but breaks "Sentences are the atom" |
| sentences, one per sense | 2,008 ids | 2,008 inline blobs |

**No numeric gap** — the decision is which shape we persist; 2,008 sentences either get an id (audio and Error Report can attach) or never can.

**Answer: pick A or B.**
➡️ A — it is the only shape that keeps audio, tap lookup and Error Report working, and `Word.examples` (1–3) becomes the first three sense examples.

---

### 12.Q2 [AC2] Owner: Loc — Which readings of a polyphone get their own Word file?

**Setup** — HSK 3.0 level-1 list, 505 words. CC-CEDICT kept senses (cross-refs removed): 2,008 across 573 readings; 55 words have 2+ readings (68 extra readings). 的: de (4 senses), dī 「a taxi」, dí 「really and truly」, dì 「bull's-eye」. 打: dǎ 「to beat…」 and dá 「dozen」. The docs rule is "polyphones split: words/行-xing.yaml, words/行-hang.yaml" (content-schema.md:44), but not which readings count.

| | A — every reading | B — main reading only | C — readings with ≥1 common sense |
|---|---|---|---|
| Word files for 505 words | **573** | 505 | 505 + common-secondary readings (between 505 and 573; fixed at run time) |
| 的 gets | 的-de, 的-dī, 的-dí, 的-dì | 的 | 的 (de) + 的-dì only if the LLM marks a sense common |
| 地 dì, 行 háng, 长 zhǎng (real secondary readings) | own page | lost, no page | own page |
| rare-only reading, e.g. 的 dī 「taxi」 | own page (noise) | dropped, reason "đọc khác" | dropped, reason "âm hiếm" |

**Gap: up to 68 extra Word files, and 4 Word Pages for 的 vs 1.**
**Answer: pick A, B or C.**
➡️ C — AC4 flags rare senses, so a rare-only reading is the same idea one level up; B would drop 地 dì and 行 háng, which learners do meet.

---

### 12.Q3 [AC3] Owner: Loc — Does every sense get an example sentence, or only a capped few per word?

**Setup** — 505 words, 2,008 kept CC-CEDICT senses. Pilot on 10 words (entries.json stats): 88 sentences, 24 from Tatoeba, 64 "AI viết" (73%). `Word.examples` allows 1–3 (content-schema.md:84); CHY-32 says "meanings grouped by POS, each with an example".

| | A — one per sense | B — cap 3 per word |
|---|---|---|
| sentences generated | **2,008** | 1,147 (Σ min(3, senses)) |
| expected "AI viết" at pilot's 73% | ≈ 1,470 | ≈ 840 |
| rare senses under the fold have an example | yes | no |
| matches CHY-32 AC5 wording | yes | no — rare senses show none |
| clips if all get audio (CHY-15 decides) | 2,008 | 1,147 |

**Gap: 861 sentences (≈ 630 AI-written) that nobody reviews beyond the 20-entry spot-check.**
**Answer: pick A or B.**
➡️ A — it is what CHY-32 renders and what the pilot did; audio rendering for example sentences is CHY-15's call and can skip rare ones without a data change.

## Locked (do not re-open)
- LLM edits, never authors; Tatoeba verbatim; AI examples labelled "AI viết"; 20-entry spot-check before import.
