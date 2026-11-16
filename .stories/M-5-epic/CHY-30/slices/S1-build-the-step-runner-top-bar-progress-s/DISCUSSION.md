# CHY-30 S1 — discussion
ACs: AC1, AC2, AC3  ·  verified on d090b0a0 (worktree CHY-30-S1)

## Current behaviour (verified, with anchors)
- [AC1] No lesson engine exists: `src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5` renders one `<h1>`; `src/lib/lesson/` does not exist.
- [AC1] Sticky top bar and sticky action bar already exist in `FocusFrame` (`src/lib/ui/FocusFrame.svelte:60-65` top, `:89-95` actions); the CTA is `Button` (`src/lib/ui/Button.svelte:4-13`, `disabled`, `caret`).
- [AC1] Prototype progress: `bar(lit, total)` fills segments `i < lit`, label `min(lit+1,total)/total` (`prototype/step.js:26-33`). Step index 1 of 6 → 1 segment on, "2/6".
- [AC1] Prototype ✕ is a link with `aria-label="Lưu và về bài học"` (`prototype/l4-grammar.html:82`).
- [AC2] Prototype `choice()` (`prototype/step.js:58-88`): CTA "Kiểm tra" disabled, hint "Chọn một đáp án" (:84-85); a pick enables it (:67-72); grade marks the answer `right` and a wrong pick `wrong` (:76-80), says "Đúng rồi." or "Chưa đúng. Đáp án là …" (:81), CTA becomes "Tiếp" with hint "Câu này sẽ quay lại ở phần ôn" on a miss (:82); picks lock after grading (:68).
- [AC3] Prototype no-feedback: CTA "Câu tiếp", or "Nộp bài" when `q.last` (:84), caret on, press → `done(pick === ans, pick)` with no marks (:86).
- [AC3] Placement page shows no marks and a "Câu tiếp" CTA on every question (`src/routes/(onboard)/placement/+page.svelte:168-172`, `messages/vi.json:81`). Its final question is level 5 index 9 (`src/lib/placement/run.ts:46-47`). **Code fails AC3:** the last Placement question reads "Câu tiếp", not "Nộp bài". → task.
- [AC3] The Gate route is a stub (`src/routes/(app)/lesson/[id]/gate/+page.svelte:1-5`); CHY-36.S1 builds it on this runner.
- Tests run in node only (`vite.config.ts:50-58`, project `server`, no DOM env). Interactive logic must sit in pure `.ts`; components are checked by `svelte/server` render (`src/lib/ui/ui.test.ts:3,14-15`).
- `import.meta.glob` is already used in `src/routes/dev/audio/syllable-cells.server.ts:23`.
- Dev routes 404 outside dev/preview (`src/routes/dev/ledger/+page.server.ts:8-10`).

## Answered here (no human needed)
- [AC3] Q: Placement ends early after `MAX_MISS` misses (`run.ts:4,45`) — which question is "last"? A: only level 5 index 9 is known to be last before the learner answers; an early end depends on the answer still to come, so the button cannot know it. "Nộp bài" shows on level 5 index 9 only.
- [AC3] Q: must Placement move onto the StepRunner? A: no. AC3 asks for no marks + "Câu tiếp" + "Nộp bài" on the last question; Placement already does the first two. The gap is one label. Moving Placement (keys, "Không biết", listen speaker) onto the runner has no AC and risks a shipped flow.
- [AC1] Q: does the test mode (Gate) need a different top bar? A: AC1/AC3 do not say so. Both modes show ✕ + segments + counter. The Gate's own exit confirm is CHY-36 AC6.
- [AC1] Q: "CTA disabled until the step allows it" — who decides? A: the step view. The runner renders whatever CTA the current view set (prototype `cta()` model, `step.js:36-41`).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| — | Q1 (epic) | Ledger.record returns StudyEvent[] | A — locked; S2 designs it | Loc, wave plan approval 2026-11-13 |
| — | Q4 (epic) | Streak popup now or in M-7 | A — plain card in CHY-30; S3 designs it | Loc, wave plan approval 2026-11-13 |

No open questions for S1.

## Seam constraints (from the coordinator's lane brief)
- CHY-32/33/34/39 build against `StepRunner` props + `LessonStep` in wave 2, in parallel with CHY-30.S2. So the props S2 needs from callers (lesson id, section id) and the `Answer` shape a view reports are declared in S1, even though S1 does not store anything.
- A new kind = one new file in `src/lib/lesson/steps/` + one union line. No registry edit.

## Files outside the engine lane list (report §5) — unowned, no lane conflict
- `src/routes/(onboard)/placement/+page.svelte` and `src/lib/placement/run.ts` (AC3 "Nộp bài"). No M-5 lane owns them.
- `messages/vi.json`: every lane adds keys. S1 inserts its block after `screen_gate` (`messages/vi.json:11`), not at the end of the file, to keep other lanes' appends conflict-free.
- `src/routes/dev/step/**` (new): proof route for verify.

## Locked (do not re-open)
- Q1: `Ledger.record` resolves to `StudyEvent[]` (S2). Q4: plain streak card (S3).
