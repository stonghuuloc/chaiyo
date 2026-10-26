# Third-party source data

| File | What | From | Licence |
|---|---|---|---|
| `hsk30-grammar.csv` | HSK 3.0 grammar syllabus, GF 0025-2021 Appendix A, 624 rows (`No, Level, Group, Category, Details, Content`; level `7-9` = advanced band) | [ivankra/hsk30](https://github.com/ivankra/hsk30) `hsk30-grammar.csv`, fetched 2026-10-26 | MIT |

Used by `scripts/check-lesson.py` (rule ★8 in `docs/lesson-preview-format.md`) and the `std` field in `content/grammar/*.yaml`.
