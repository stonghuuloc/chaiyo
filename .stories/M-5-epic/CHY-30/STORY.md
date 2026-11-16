# CHY-30 — Step engine (port step.js)

## Goal (business why, 1-2 sentences)
One engine every lesson section runs on, so a screen only renders steps and every rule (streak, unlock, review scheduling) stays in Study.

## Context an agent can't derive from code
- Successor of `prototype/step.js` (180 lines): `bar()` :26-33, `cta()` :36-41, `choice()` :58-88, `doneStep()` :91-96. Confetti/audio/Hanzi helpers there are not this story.
- Placement already runs no-feedback questions (`src/routes/(onboard)/placement/+page.svelte`, state in `src/lib/placement/run.ts`).
- Study already returns events from `apply()`; `Ledger.record` drops them (`src/lib/ledger/types.ts:11` returns `Promise<void>`).
- Epic report: `.refined-epics/M-5-lesson-player/report.md` (gitignored, main checkout). Lane `engine` owns `src/lib/lesson/**` (new), `src/lib/ledger/**`, `lesson/[id]/gate/**`, `lesson/h0-00`.
- `StepRunner.svelte` props + `LessonStep` union are the seam CHY-32/33/34/39 build against in wave 2; new kinds (Order, Speak, Tone, Pinyin, Writing) land as one file + one union line each.

## Locked decisions (BA/Loc already ruled — never re-open)
- Q1 (epic report §6): `Ledger.record(input)` resolves to the `StudyEvent[]` that `apply()` returned for that input. → S2.
- Q4 (epic report §6): CHY-30 ships a plain centred streak card with the AC6 copy; CHY-46 (M-7) restyles it. → S3.

## AC index

| # | AC | Pri | Slice |
|---|----|-----|-------|
| AC1 | Top bar ✕, N segments, "2/6"; sticky CTA disabled until allowed | high | S1 |
| AC2 | Choice with feedback: "Đúng rồi." / "Chưa đúng…" + hint; CTA "Tiếp" | high | S1 |
| AC3 | Choice without feedback: "Câu tiếp", last reads "Nộp bài" | high | S1 |
| AC4 | Every answer calls Ledger.record once; no rule in a screen | high | S2 |
| AC5 | Leave at step 4, reopen → step 4, same progress | high | S2 |
| AC6 | Done step + "Chuỗi lên N ngày!" only on DayCounted | high | S3 |

## Out of scope
- Streak popup animation (CHY-46, M-7). Section content screens (CHY-32…35). Gate route and scoring (CHY-36). Hub (CHY-31).
