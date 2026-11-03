# CHY-8 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-11-03] Lint check 4 (CHY-9) fails any 一/不 sentence whose authored spoken differs from derived; ordinal/month 一 exceptions (override via AC5) can then never import. Decide in S2/CHY-9: error or review notice? Also h2-h5 preview files disagree with the AC4 rule.
- [2026-11-03] Erhua words in deriveHanViet (有点儿-style) return missing because char and syllable counts differ; none in content/words today.
- [2026-11-03] Authored seg is not checked to join back to hanzi (CHY-9 lint). One bundle mixes spaced Dictionary pinyin with glued lesson pinyin.
- [2026-11-03] Dictionary link (dictionary.word_id, set when a Word with same hanzi+pinyin is taught, content-schema.md:326) and the dictionary table: not in the ticket description or any AC, and no story loads the 122k rows. Dictionary pinyin is syllable-spaced (nǐ men) vs glued word pinyin (nǐmen), so matching needs a rule.
