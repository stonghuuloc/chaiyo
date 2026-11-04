# Third-party source data

| File | What | From | Licence |
|---|---|---|---|
| `hsk30-grammar.csv` | HSK 3.0 grammar syllabus, GF 0025-2021 Appendix A, 624 rows (`No, Level, Group, Category, Details, Content`; level `7-9` = advanced band) | [ivankra/hsk30](https://github.com/ivankra/hsk30) `hsk30-grammar.csv`, fetched 2026-10-26 | MIT |
| `.cache/words/complete.min.json` | HSK 3.0 word list with CC-CEDICT senses and numbered pinyin | [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary), pinned by commit in `scripts/gen-entries.py` | MIT (CC-CEDICT senses: CC BY-SA 4.0) |
| `.cache/words/*.tsv.bz2` | Tatoeba cmn/eng/vie sentences and cmn-eng, cmn-vie links (example sentences) | [downloads.tatoeba.org/exports/per_language](https://downloads.tatoeba.org/exports/per_language), sha256 recorded in `.cache/words/manifest.json` | CC BY 2.0 FR |
| `prototype/data/dict.json` (Hán Việt per reading) | CVDICT lines + Hán Việt, built by `scripts/build-dict.py` | [DucThanhNguyen/han-thong](https://github.com/DucThanhNguyen/han-thong) | CC BY-SA 4.0 |

Used by `scripts/check-lesson.py` (rule ★8 in `docs/lesson-preview-format.md`) and the `std` field in `content/grammar/*.yaml`. The `.cache/words` rows are fetched by `scripts/gen-entries.py` and never committed.
