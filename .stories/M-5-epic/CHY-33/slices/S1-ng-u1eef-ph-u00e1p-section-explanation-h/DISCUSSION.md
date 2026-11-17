# CHY-33 S1 — discussion
ACs: AC1, AC2  ·  verified on chaiyo@a65f42970e (worktree CHY-33-S1, wave-1 stack tip)

## Current behaviour (verified, with anchors)
- [AC1] The section route is a stub: `src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5` renders `m.screen_lesson_section()`. No grammar screen exists. **Code fails AC1/AC2** → task.
- [AC1] Bài 1 content already holds both points: `content/grammar/h1-g01.yaml` (title `Chào hỏi: A + 好`, pattern `你 / 您 / 你们 + 好`, examples `s-h1-01-08`, `s-h1-01-09`, pitfall `好你` → `你好`) and `h1-g02.yaml` (pattern `谢谢 → 不客气 / 对不起 → 没关系`, pitfall `谢谢！没关系。` → `谢谢！不客气。`).
- [AC1] `explain` = prototype `explain` + blank line + prototype `more` — asserted by `src/lib/content/h1-01.parity.test.ts:128`. The "Xem thêm" text is the part after the first blank line.
- [AC1] Pattern encoding is asserted at `h1-01.parity.test.ts:120-122`: point 1 = parts joined by ` + `; point 2 = pairs joined by ` → `, pairs joined by ` / `.
- [AC1] The slot labels "người được chào" and "luôn có" are in the prototype only (`prototype/l4-grammar.html` PATTERN), not in content. `GrammarPoint` has no label field (`src/lib/content/schemas.ts:92-103`). **Content gap** → task.
- [AC2] The done copy "Mẫu A + 好 và các câu đáp đã vào phần ôn tập" is prototype-only (`l4-grammar.html` doneStep). `Lesson.sections.grammar` = `{ ids, drills }` (`schemas.ts:199`). **Content gap** → task.
- [AC2] Drills: `h1-01.yaml:39-79` has 6 drills: g01 choice 您好, g02 choice 你们好, g03 order tiles `[们, 你, 好]` answer sentence `s-h1-01-09` (`你们好！`, vi `Chào các bạn!`), g04–g06 choice 不客气 / 没关系 / 对不起. Each drill names its point in `tests.grammar`. Choice `answer` is an index (`schemas.ts:131-139`).
- [AC2] The engine has one kind, `choice` (`src/lib/lesson/steps.ts:4`). Views are found by file name: `steps/<Kind>.svelte` ↔ `kind` (`steps.ts:8-15`). No order or explanation kind exists.
- [AC1] A sentence clip key = folder + sha256 of the Azure request, built only at import (`src/lib/content/import/audio.ts:21-35,81-92`). `Bundle.sentences` carry no key (`bundle.ts:6-16,50`). **Code fails "examples with audio"** → task.
- [AC1] The player plays `<AUDIO_BASE>/<key>.mp3` (`src/lib/audio/player.ts:12-22`).
- [AC2] `StepRunner` calls `onfinish()` after the last step (`src/lib/lesson/StepRunner.svelte:27-34`). There is no done step yet; CHY-30.S3 (wave 3) owns it.

## Answered here (no human needed)
- [AC1] Q: where does "Xem thêm" text come from? A: split `explain` on the first blank line (parity test :128). No schema change.
- [AC1] Q: how are pattern slots drawn? A: pattern with `→` → rows split on ` / `, slots split on ` → `; else one row split on ` + `. Matches the parity encoding for both Bài 1 points.
- [AC1] Q: slot labels? A: content field `labels: string[]` on `GrammarPoint`, one per slot column (h1-g01: người được chào, luôn có; h1-g02: người kia nói, bạn đáp). Labels are pedagogy per point, so content, not `vi.json`.
- [AC2] Q: done copy? A: optional `done: string` on `sections.grammar` in the lesson YAML; Bài 1 gets the prototype sentence. Absent → only the title "Xong phần Ngữ pháp" shows.
- [AC2] Q: explanation screen — step or not? A: a step. The prototype counts it as a segment (8 = 2 explain + 6 drills), and CHY-30.S2 records every step, `correct: null` for no-answer steps. New kind `grammar` (`steps/Grammar.svelte`), CTA "Làm bài", hint "3 câu luyện nhanh" (count = that point's drills).
- [AC2] Q: order step shape? A: new kind `order` (`steps/Order.svelte`): tiles in content order, answer = the sentence hanzi minus punctuation (`你们好！` → `你们好`), title = sentence `vi`. Feedback mode grades on "Kiểm tra"; test mode (Gate, CHY-36) does not reveal.
- [AC2] Q: drill numbering? A: `ask` = "Câu n/N" per point (prototype "Câu 1/3"), N = drills of that point.
- [AC2] Q: done screen? A: the grammar section shows its own done view after `onfinish`. CHY-30.S3's generic done step replaces it later.
- [AC1] Q: section key? A: `grammar` — the Study section id (`src/lib/curriculum/curriculum.json:17`) and the StepRunner `section` prop. URL `/lesson/h1-01/grammar`.
- [AC2] Q: which ledger? A: `learnerLedger(data.session)` (`src/lib/learner/index.ts:10`), passed as CHY-30.S2's required `ledger` prop.
- [AC1] Q: pinyin under examples? A: always shown in S1. Pills and level default are S3 (AC7). Drill prompts carry no pinyin already (content has none).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | Sentence clip key: client hash or bundle | B — the bundle carries `audio` per sentence, filled from the import's `AudioEntry` list | Loc, 2026-11-16 (coordinator msg_95a15961e477) |
| — | wave | Section routing | one `[section]` route; `sections.ts` maps section id → component; CHY-33.S1 creates it | Loc, 2026-11-16 (SHARED.md) |
| — | wave | Lesson data | read `data.lesson` from `lesson/[id]/+layout.ts` (CHY-25.S2) | Loc, 2026-11-16 (SHARED.md) |
| — | wave | Ledger seam | `StepRunner` required prop `ledger: Ledger` | CHY-30.S2 design, commit 5ee5658e |

No open questions for S1.

## Files outside the lane
- `src/lib/lesson/steps.ts:4` — two union lines (`grammar`, `order`); kinds live in `steps/Grammar.svelte`, `steps/Order.svelte`.
- `src/lib/content/import/sink.ts:21`, `bundle.ts:50` (shell lane) — `audio` on each bundled sentence (Q1 = B). Rebase onto CHY-25.S2 first.
- `src/lib/content/schemas.ts:92-103,199` + `docs/content-schema.md:113-137` — optional `labels` and `done`.
- `content/grammar/h1-g01.yaml`, `h1-g02.yaml`, `content/lessons/hsk1/h1-01.yaml` — the Bài 1 values.
- `src/routes/(app)/lesson/[id]/[section]/+page.svelte` + new `sections.ts` — owned here by the 2026-11-16 decision; CHY-34.S2 rebases on it.
- `messages/vi.json` — `grammar_*` block after `lesson_review_hint` (:135).

## Locked (do not re-open)
- Wave plan + slice split (M-5 refinement, 2026-11-13). Epic Q1–Q8 = option A.
