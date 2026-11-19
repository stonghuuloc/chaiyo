# CHY-32 S2 — verify
Env: 2026-11-17, dev server :5199 on the M-5 ticket stack tip (CHY-39, includes CHY-25.S2 + CHY-32.S2), local Supabase,
real login (OTP from Mailpit, `verify-c-1@example.test`), agent-browser session `verify-c`, content bundle `867bbad8c308…`
(`pnpm import:content content --sink bundle --only lessons/hsk1`). Screenshots: scratchpad `verify-c/c32-*.png`.

| AC | Verdict | Evidence |
|---|---|---|
| AC5 | ✅ | `/word/好?lesson=h1-01` (fresh load): header 好 · hǎo · hảo; 5 groups in order Tính từ (2), Phó từ (4), Bổ ngữ (1), Thán từ (1), Cụm từ (1); each sense shows `vi` + example hanzi + pinyin/vi; button "Xem thêm 1 nghĩa ít gặp" → click → Tính từ shows 3, button "Thu gọn". `/word/家?lesson=h1-04`: "Xem thêm 2 nghĩa ít gặp" → Danh từ 3 → 5 senses, "Thu gọn" → back to 3. `你` → 1 group "Đại từ", 1 sense. `你好` → "Cụm từ · xin chào · 你们好！". `/word/家` with no lesson on a fresh load and `?lesson=h9-99` → "Không tìm thấy từ này." |
| AC6 | ✅ | 好: 3 links "Tatoeba" → `https://tatoeba.org/vi/sentences/show/785298`, `/6057700`, `/338827`, all `target=_blank rel=noopener`; one line "Ví dụ: Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt" (好, 家). `你` and `你好` (no AI example shown) → no such line. |

**The ⚠️ is scoped:** none raised. The AC5 example says 3 rare senses; the hsk1 content holds at most 2 (家). Count
proven live for N = 1 (好) and N = 2 (家); N = 3 is proven by the jsdom test only.

## Tests
`vitest --run --coverage` on the stack tip → 130 files, 3164 passed, 0 failed (one run, this tree).

## Residual risk
- None.
