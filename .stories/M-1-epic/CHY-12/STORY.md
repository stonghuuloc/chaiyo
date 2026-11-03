# CHY-12 — Word entries pipeline for HSK1

## Goal (business why, 1-2 sentences)
Every HSK1 Word Page gets checked senses and labelled examples from a script anyone can re-run from a fresh clone. The LLM only edits CC-CEDICT senses; the script rejects what it leaves uncovered.

## Context an agent can't derive from code
- Today: `scripts/gen-entries.py` (154 lines) runs from `/tmp/etts` venv, reads `/tmp/dict` sources, takes its LLM key from `~/.omp/agent/agent.db`, writes `prototype/data/entries.json` (10 pilot words; NOTES.md line 111).
- Its checks already exist (`check()`: uncovered sense, bad POS, example not containing the word); output shape is the prototype's POS-grouped JSON, not the `Word` Zod schema.
- `Word` (schemas.ts:42) has `senses: {vi, note?}` and `examples: Id[]`: no rare flag, no per-sense POS, no Tatoeba source label, and no home for non-lesson sentences. AC3 and AC4 need a schema change (CONTRACTS.md "Schema change requests").
- HSK1 word set: `prototype/data/dict.json` has 505 level-1 rows (HSK 3.0, drkameleon). `content/words/` holds 67 files, hand-written for Bài 1 and mock lessons.
- No `pyproject.toml` or `uv.lock` in the repo; no `content/sentences/` in the layout (docs/content-schema.md Files).
- Word Page UI and the "Xem thêm N nghĩa ít gặp" fold are CHY-32; this story only emits the data it reads.
- Cross-lane: C4 (words ownership, ours), C1 (CHY-9 lint must pass our output), schema request to the Captain.

## Locked decisions (BA/Loc already ruled — never re-open)
- LLM is the editor, not the author (NOTES.md pilot v2); senses come from CC-CEDICT; no sense is silently dropped.
- Tatoeba text is copied verbatim; an LLM-written example is labelled "AI viết".
- Spot-check is 20 random entries approved by Loc before import (AC5).

## AC index

| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Script runs from a committed uv environment, no /tmp | high | S1 |
| AC2 | Uncovered CC-CEDICT senses reject the word, nothing written | high | S1 |
| AC3 | Examples carry Tatoeba source, else "AI viết" | high | S1 |
| AC4 | All HSK1 words have entries; rare senses flagged | high | S2 |
| AC5 | Loc approves 20 random entries before import | high | S2 |

## Out of scope
- Word Page UI and fold rendering (CHY-32); importer and DB rows (CHY-8); lint implementation (CHY-9); Bài 1 hand-authored words (CHY-10); images and audio; HSK2+ words.
