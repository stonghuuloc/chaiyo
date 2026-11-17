# CHY-32 — Sections: Khởi động + Từ mới + Word Page

<!-- ONE page. Refined in .refined-epics/M-5-lesson-player/report.md (wave plan, seams, Q rows). -->

## Goal (business why, 1-2 sentences)
As a learner, I want to warm up, meet the new words, and open any word in full, so that the words stick.

## Context an agent can't derive from code
- Due cards via `session()` (CHY-19). TalkingCast on main (`src/lib/components/TalkingCast.svelte`).
- C7 entry fields `pos`, `rare`, `source: tatoeba:<id>|ai` (`content/schemas.ts:50-88`).
- Stroke animation uses `HanziStrokes.svelte` from CHY-35.S1.
- Open in refinement: Q5 empty Bài 1 warmup → hide row (default A). Defaults are proposals, not locked — confirm at discuss.

## Locked decisions (BA/Loc already ruled — never re-open)
- Slice split + wave plan approved in the M-5 refinement (2026-11-13).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Khởi động: 6 cards, 4 rotating types, "5/6 đúng · từ sai sẽ quay lại sớm hơn". | high | S3 |
| AC2 | Word card: picture, stroke animation, audio, pinyin, Hán Việt, meaning, Từng chữ/Cấu tạo, Ví dụ. | high | S1 |
| AC3 | Mini-check with talking red panda; second tap slow. | high | S1 |
| AC4 | Done: "10 từ đã vào Từ của tôi…". | high | S1 |
| AC5 | Word Page groups senses by POS; "Xem thêm 3 nghĩa ít gặp" / "Thu gọn". | high | S2 |
| AC6 | Tatoeba label links to the sentence; AI examples get the disclaimer. | high | S2 |


## Out of scope
- nothing beyond the ACs
