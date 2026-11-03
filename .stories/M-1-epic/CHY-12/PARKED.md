# CHY-12 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-11-03] S1: appending generated senses after hand senses can repeat a meaning (好 'tốt, khỏe, hay' + generated 'tốt'); no dedup rule, no AC covers it
- [2026-11-03] S2: sentences/hsk1.yaml merges by id across runs, so sentences a regenerate replaced stay as orphans and get promoted/audio-rendered; no AC covers it
- [2026-11-03] S2: --approved N proves Loc saw the sample (sha), not that he approved it; SPOTCHECK.md ordering is the gate
- [2026-11-03] S2: prune applies to staging only; a promoted secondary-reading file that later disappears from staging would stay in content/ as an orphan; no AC at risk
