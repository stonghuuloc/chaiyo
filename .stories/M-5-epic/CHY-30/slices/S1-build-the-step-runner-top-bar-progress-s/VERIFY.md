# CHY-30 S1 — verify
Env: dev server on :5401 (local Supabase, env vars only), agent-browser, route `/dev/step` and `/dev/step?mode=test` (6 choice steps). Screenshots `/tmp/claude-501/verify-CHY-30/`.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Step 0: text "1/6", 6 `[data-on]` segments, 0 on, ✕ link `aria-label="Lưu và về bài học"` href `/today`, CTA "Kiểm tra" disabled + hint "Chọn một đáp án". After Tiếp: "2/6", 1 on. Pick enables the CTA, hint gone (`ac1-step0.png`). |
| AC2 | ✅ | Pick 好 + Kiểm tra: 好 gets `#i-bold-check`, line "Đúng rồi. 好", CTA "Tiếp", no hint, all 4 options disabled. Wrong pick 好 on step 你: 你 check, 好 `#i-regular-x`, line "Chưa đúng. Đáp án là 你", CTA "Tiếp", hint "Câu này sẽ quay lại ở phần ôn". Tiếp opens the next step (`ac2-correct.png`, `ac2-wrong.png`). |
| AC3 | ✅ | Test mode `/dev/step?mode=test`: steps 1-5 "Câu tiếp" with caret, disabled until a pick, no mark or verdict line; 6/6 "Nộp bài", click shows "finished". Placement (real login, local Supabase, OTP from Mailpit): answered 49 questions, each CTA "Câu tiếp" disabled until a pick, 0 right/wrong marks after any pick; question 50 (level 5 index 9) CTA "Nộp bài" (`placement-q10-l5.png`); click → `/placement/result` "Mọi cấp HSK" (HSK 1-5 cleared). Level/index not shown on screen: position inferred from 49 answers + result. |

## Tests
`pnpm vitest --run src/lib/lesson src/lib/placement` → PASS 71, FAIL 0 (one run, this tree).

## Residual risk
- None.
