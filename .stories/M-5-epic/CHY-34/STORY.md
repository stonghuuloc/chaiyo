# CHY-34 — Section: Nghe & nói

<!-- ONE page. Refined in .refined-epics/M-5-lesson-player/report.md (wave plan, seams, Q rows). -->

## Goal (business why, 1-2 sentences)
As a learner, I want to listen and then say the words aloud, so that I train my ears and my mouth.

## Context an agent can't derive from code
- No mic code exists; getUserMedia + analyser, nothing uploaded. Pronunciation result is a fixed labelled sample (real scoring = E11).
- Open in refinement: none. Defaults are proposals, not locked — confirm at discuss.

## Locked decisions (BA/Loc already ruled — never re-open)
- Slice split + wave plan approved in the M-5 refinement (2026-11-13).

## AC index
| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Tone, word and meaning questions with the talking clip; graded, recorded. | high | S1 |
| AC2 | Hold → mic on, live bars, timer, "Thả khi nói xong"; <0.7 s → too-short copy. | high | S2 |
| AC3 | No network request carries audio; nothing saved. | high | S2 |
| AC4 | Sample tiles 不 bú ✓ 客 kè ✓ 气 qi weak, "Kết quả mẫu (chưa chấm thật)". | high | S3 |
| AC5 | Mic blocked → skip copy, "Bỏ qua", section still completes. | high | S2 |
| AC6 | Free answer 对不起！ shows only after speaking or skipping. | high | S3 |

## Out of scope
- real pronunciation scoring (E11 Speech)
