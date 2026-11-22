# CHY-33 — Sections: Ngữ pháp + Hội thoại

<!-- ONE page. Refined in .refined-epics/M-5-lesson-player/report.md (wave plan, seams, Q rows). -->

## Goal (business why, 1-2 sentences)
As a learner, I want to learn a pattern and hear it in a conversation, so that I can use it in a real situation.

## Context an agent can't derive from code
- Grammar `wrong/right/why` and dialogue `speaker` in schema (`content/schemas.ts:85,101`).
- `OrderStep` built here is reused by the Gate (CHY-36.S1).
- `settings` table has no display prefs yet (`supabase/migrations/20261110000000_learner_tables.sql:9-13`).
- Open in refinement: Q6 pills in Supabase settings (default A). Defaults are proposals, not locked — confirm at discuss.

## Locked decisions (BA/Loc already ruled — never re-open)
- Slice split + wave plan approved in the M-5 refinement (2026-11-13).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Grammar point 1/2 "A + 好", 2 examples, Hay nhầm 好你 Sai, "Làm bài · 3 câu luyện nhanh". | high | S1 |
| AC2 | Drills: 2 choice + 1 ordering; point 2/2 pairs; done copy. | high | S1 |
| AC3 | Lines play in turn, panda left / takin right, CTA "Đang phát 2/N", pause. | high | S2 |
| AC4 | Tap one line → only that line plays. | high | S2 |
| AC5 | Nghĩa off persists for the account across lessons. | high | S3 |
| AC6 | Dialogue question → 没关系。; "Xong phần Hội thoại". | high | S2 |
| AC7 | Pinyin default on for HSK1–2, off for HSK3; never in drills. | high | S3 |

## Out of scope
- nothing beyond the ACs
