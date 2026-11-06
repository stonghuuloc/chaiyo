# CHY-25 S1 — discussion
ACs: AC2, AC3, AC4, AC7  ·  rev 1  ·  2026-11-06

## Decisions made alone (80% rule)
| # | Decision | Alternatives rejected | Confidence | Cost if wrong |
|---|---|---|---|---|
| D1 [AC2] | `word`, `char` and `lookup` resolve from the lesson bundles loaded in this session; the Catalog never fetches every bundle to find an id. | fetch every bundle from `manifest.json`; a global word→lesson index in the importer | 85% | a cold Word Page needs Q1; no AC of this slice fails |
| D2 [AC3] | `lookup` maps the tap index through `sentence.seg` (tokens concatenate to `hanzi`, punctuation as its own token) and returns the `thin` entry for that token; not the prototype's longest-dictionary window over `dict.json`. | reuse the x1 longest-window match over `thin` | 85% | a tap on a token with no thin entry returns the single char or not-found; AC3's 你好！ still passes |

## Review round — Loc, 2026-11-06 (resolved)
- "S1 is fine apart from nits": no S1 edit. The four bad anchors are in S2/S3 and are fixed there; no S1 anchor was wrong.
