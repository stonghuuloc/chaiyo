# CHY-25 S1 — discussion
ACs: AC2, AC3, AC4, AC7  ·  rev 2  ·  2026-11-13 (M-5 wave A refresh)

## Decisions made alone (80% rule)
| # | Decision | Alternatives rejected | Confidence | Cost if wrong |
|---|---|---|---|---|
| D1 [AC2] | `word`, `char` and `lookup` resolve from the lesson bundles loaded in this session; the Catalog never fetches every bundle to find an id. | fetch every bundle from `manifest.json`; a global word→lesson index in the importer | 85% | a cold Word Page needs Q1; no AC of this slice fails |
| D2 [AC3] | `lookup` maps the tap index through `sentence.seg` (tokens concatenate to `hanzi`, punctuation as its own token) and returns the `thin` entry for that token; not the prototype's longest-dictionary window over `dict.json`. | reuse the x1 longest-window match over `thin` | 85% | a tap on a token with no thin entry returns the single char or not-found; AC3's 你好！ still passes |

## Review round — Loc, 2026-11-06 (resolved)
- "S1 is fine apart from nits": no S1 edit. The four bad anchors are in S2/S3 and are fixed there; no S1 anchor was wrong.

## Rev 2 — M-5 wave A refresh (2026-11-13, main d090b0a0)
- Reconcile: every anchored file is unchanged since 23f1db9 (`git diff --stat 23f1db9 d090b0a0`), except `src/lib/content/import/fixtures/ok/lessons/hsk1/h1-01.yaml` (gate `tests` gained `grammar: ['h1-g01']`, `:65`, `:149`, `:158`). The fixture sha moved `1c472c64…` → `187fb644…`; every SPEC literal re-read by a `tsx` probe and unchanged (10 words, 20 sentences, 11 thin, `你好！` seg `['你好','！']`, `你` strokes 7).
- M-5 report Q1–Q8 defaults (locked by Loc): none touches CHY-25.S1. Q3 (stroke data from CDN) touches only S3's cache scope, by not adding stroke files.
- `CHY-7` lock re-applied to the seam: `contentSha?` optional on word/char/lookup results; `LessonContent.contentSha` required (bundle-only).

| # | Decision | Alternatives rejected | Confidence | Cost if wrong |
|---|---|---|---|---|
| D3 [AC2][AC3] | The seam is `lesson(id)`, `word(id)`, `char(hanzi)`, `lookup(sentenceId, tapIndex)` as the ticket description and AC3 name them; the epic report's `entry(hanzi)` / `lookup(text, i)` is shorthand, mapped below. | add `entry(hanzi)` (parked by the CHY-7 lock, `STORY.md` → Out of scope); free-text `lookup(text, i)` (contradicts AC3 "lookup(sentenceId, 0)") | 90% | CHY-38.S1 wants a longest-match over non-sentence text (a word card); it gets it from `LessonContent.thin`, no Catalog change |

| Report seam (`report.md` §5) | Ticket / this SPEC | Consumer that needs it |
|---|---|---|
| `catalog.lesson(id)` | `lesson(id): Promise<LessonContent>` | CHY-25.S2, CHY-32.S1, CHY-33.S1, CHY-34.S1, CHY-35.S2 |
| `entry(hanzi)` | `word(id)` (Word has `senses` with `pos`/`rare`, `schemas.ts:50-61`) + `char(hanzi)` | CHY-32.S2 Word Page, CHY-38.S1 "Xem chi tiết" |
| `lookup(text, i)` | `lookup(sentenceId, tapIndex)`; shrink to one char = `thin` entry of that char | CHY-38.S1 |

**No numeric gap** — the names differ, the data is the same; wave-2 lanes code against SPEC `## Seam`.

## story-advisor (2026-11-13)
- Round 1 needs-fix: `Bundle['lesson']` Omit-over-union loses `kind`/`goal`/`topic` → `Lesson | Primer` + cast; fixture path `../../`; `CatalogError` constructor in seam; `LookupHit.start` defined; not-found id rule unified; anchors `1-5`, `265-272`. All fixed.
- Round 2 ready-for-picture; nit (`start` on char fallback) fixed. Nothing parked.
