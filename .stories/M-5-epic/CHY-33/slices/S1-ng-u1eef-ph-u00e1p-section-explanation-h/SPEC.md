# CHY-33 S1 — spec
ACs: AC1, AC2  ·  Repo: stonghuuloc/chaiyo  ·  rev 1

## Behaviour
- [AC1] `/lesson/h1-01/grammar` renders the Ngữ pháp section through the one `[section]` route: `sections.ts` maps `grammar` → the grammar section component; an id with no entry keeps today's placeholder.
- [AC1] The section reads `data.lesson` (CHY-25.S2 layout) and runs 8 steps in one `StepRunner` (`section="grammar"`, `contentSha` from the lesson, `ledger` = the learner's Ledger): explain 1, its 3 drills, explain 2, its 3 drills. The top bar shows 8 segments and "1/8".
- [AC1] Explain step 1 shows kicker "Điểm ngữ pháp 1/2", title `Chào hỏi: A + 好`, and the pattern as slots: `你 / 您 / 你们` labelled "người được chào", `+`, `好` labelled "luôn có".
- [AC1] It shows the first paragraph of `explain`; "Xem thêm" (collapsed, `aria-expanded=false`) reveals the rest of `explain` on tap.
- [AC1] Under "Ví dụ" it lists the 2 example sentences (`您好！`, `你们好！`) with pinyin and Vietnamese; each has a play button that plays that sentence's clip `<AUDIO_BASE>/<sentence.audio>.mp3`.
- [AC1] Under "Hay nhầm" it shows `好你` marked "Sai" and `你好` marked "Đúng" (from `pitfalls[0]`).
- [AC1] The CTA reads "Làm bài", enabled, hint "3 câu luyện nhanh" (3 = drills whose `tests.grammar` names this point).
- [AC1] Every bundled sentence carries `audio` = the key of its `AudioEntry` (kind `sentence`, same `ref`) from the import — e.g. `s-h1-01-08` → `examples/<64 hex>`. One formula: `audioKey` at import; no browser hashing.
- [AC2] Drill 1/3: choice, ask "Câu 1/3", title "Chào thầy cô (lịch sự)", options 你好 · 您好 · 你们好, right = 您好. Drill 2/3: "Chào cả nhóm bạn" → 你们好. Feedback and CTA follow the existing choice step.
- [AC2] Drill 3/3: ordering, ask "Câu 3/3", title "Chào các bạn!" (the sentence's `vi`), tiles 们 · 你 · 好 in content order. Tapping a tile places it in the next slot; tapping a placed tile removes it. "Kiểm tra" is disabled until all 3 slots are filled, hint "Chạm các chữ để xếp theo thứ tự".
- [AC2] Placed order `你们好` → "Đúng rồi." and the slots marked right; any other order → "Chưa đúng. Đáp án là 你们好" and the hint "Câu này sẽ quay lại ở phần ôn". Then CTA "Tiếp". Answer = the sentence hanzi without punctuation.
- [AC2] The order step reports `{ questionId: q-h1-01-g03, pick: <placed string>, correct, ms }`. In test mode it does not reveal: CTA "Câu tiếp" / "Nộp bài" once full (Gate reuse, CHY-36.S1).
- [AC2] Explain step 2 shows "Điểm ngữ pháp 2/2", the pairs `谢谢 → 不客气` and `对不起 → 没关系` (labels "người kia nói", "bạn đáp"), and Hay nhầm `谢谢！没关系。` Sai / `谢谢！不客气。` Đúng.
- [AC2] Its 3 choice drills: 谢谢 → 不客气, 对不起 → 没关系, dropped the teacher's pen → 对不起, asks "Câu 1/3"…"Câu 3/3".
- [AC2] After step 8, the section shows "Xong phần Ngữ pháp" and the lesson's `sections.grammar.done` text ("Mẫu A + 好 và các câu đáp đã vào phần ôn tập, sẽ quay lại cùng các câu hỏi khác."). No `done` in content → title only.
- [AC2] Each step press goes through `StepRunner` → `ledger.record` (CHY-30.S2). The section and its views call no ledger rule.
- [LOCK] Section routing, `data.lesson`, and the bundle audio key are Loc's 2026-11-16 decisions (DISCUSSION "Resolved").

## Content contract
- [AC1] `GrammarPoint.labels?: string[]` — one label per slot column. h1-g01 `[người được chào, luôn có]`, h1-g02 `[người kia nói, bạn đáp]`.
- [AC2] `Lesson.sections.grammar.done?: string`. h1-01 gets the AC2 text.
- [AC1] `ImportedSentence.audio?: string`, set by `buildBundle` only; the Postgres sink keeps its own `audio_key`.

## Not this slice
- Pinyin/Nghĩa pills, level default, "never pinyin in drills" (AC5, AC7) → S3. Dialogue (AC3, AC4, AC6) → S2.
- Generic done step and streak card → CHY-30.S3. Hub row link to the section → CHY-31. Gate use of `order` → CHY-36.S1.
- Lesson load, `catalog`, offline → CHY-25.S2/S3.

## Seam
`src/lib/lesson/steps/Order.svelte` (kind `order`, consumer CHY-36.S1) + `steps/Grammar.svelte` (kind `grammar`); section builder `src/routes/(app)/lesson/[id]/[section]/grammar.ts`; registry `[section]/sections.ts`.

## Test contract
- [AC1] vitest `bundle.test.ts`: every bundled sentence's `audio` equals its manifest entry key; a sentence without a speaker starts `examples/`.
- [AC1] vitest `grammar.test.ts` (fixture `LessonContent`): `grammarSteps` returns 8 steps in order `grammar, choice, choice, order, grammar, choice, choice, choice`; step 1 slots/labels, examples with `audio`, pitfall, drill count 3.
- [AC1] vitest `grammar.test.ts` on the real Bài 1 import (pattern of `h1-01.parity.test.ts:295-304`): AC1 strings and the AC2 drill answers are in the built steps.
- [AC1] jsdom `Grammar.svelte.test.ts`: kicker, slots + labels, "Xem thêm" toggles `aria-expanded` and reveals paragraph 2, Sai/Đúng, CTA "Làm bài" + hint, play button calls the player with the clip key.
- [AC2] jsdom `Order.svelte.test.ts`: place/remove, CTA disabled until full, right and wrong verdicts, reported Answer, test mode reveals nothing.
- [AC2] jsdom `GrammarSection.svelte.test.ts`: after the last step the done title + `done` text show.
- [AC2] Browser (`agent-browser`, port 5415, signed-in): `/lesson/h1-01/grammar` walked 1/8 → done with the AC texts.

## Open assumptions
- none — Q1 answered (B).
