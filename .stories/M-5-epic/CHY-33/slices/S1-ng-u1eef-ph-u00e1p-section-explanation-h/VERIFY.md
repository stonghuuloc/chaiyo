# CHY-33 S1 — verify
Env: `vite dev` on :5199 from the M-5 stack tip (CHY-39 branch, contains CHY-33), local Supabase, signed in with a fresh OTP learner. Bundle sha `867bbad8…cef1`. Browser: agent-browser, headless Chrome 156, 430×932 viewport. Two runs of `/lesson/h1-01/grammar`. Screenshots: `scratchpad/verify-b/`.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | All strings and behaviours match; after `cc6d9201` both play buttons draw `#i-fill-speaker-high` (20×20 svg, symbol has 3 paths), `verify-d/ac1-grammar-icons.png` |
| AC2 | ✅ | Run 1 walked 1/8 → done; run 2 proved the wrong order. Details below |

**AC1 evidence** (`ac1-explain1.png`):
- Top bar: 8 segments, `1/8`.
- Kicker `ĐIỂM NGỮ PHÁP 1/2`, title `Chào hỏi: A + 好`.
- Slots: `你 / 您 / 你们` labelled "người được chào", `+`, `好` labelled "luôn có".
- Paragraph 1 is shown. "Xem thêm" starts `aria-expanded=false`; one tap sets `true` and reveals "Người kia chỉ cần chào lại…".
- Ví dụ: `您好！ nín hǎo Chào ông/bà! (lịch sự)` and `你们好！ nǐmen hǎo Chào các bạn!`.
- Tapping play loads `/audio/examples/e8e281a1…054e.mp3` and `/audio/examples/c362d4e7…4d40.mp3`, the bundle keys of `s-h1-01-08` / `-09`. Both keys answer `200 audio/mpeg` on the R2 public URL. Locally they 404 only because `.env` has no `PUBLIC_AUDIO_BASE_URL`.
- Hay nhầm: `好你 Sai`, `你好 Đúng`. CTA `Làm bài`, enabled, hint `3 câu luyện nhanh`.

**AC2 evidence:**
- Drill 1 `Câu 1/3` "Chào thầy cô (lịch sự)", options 你好·您好·你们好. Pick 您好 → "Đúng rồi. 您好", then `Tiếp`.
- Drill 2 "Chào cả nhóm bạn". Pick 你好 → "Chưa đúng. Đáp án là 你们好" + "Câu này sẽ quay lại ở phần ôn".
- Drill 3 `Câu 3/3` "Chào các bạn!" shows tiles 们·你·好.
  - Place 们 → slot filled. Tap the slot → it empties.
  - "Kiểm tra" stays disabled at 0, 1 and 2 filled slots; hint "Chạm các chữ để xếp theo thứ tự".
  - Placing 你们好 → "Đúng rồi. 你们好" (`ac2-order-right.png`).
  - Run 2: placing 好你们 → "Chưa đúng. Đáp án là 你们好" + review hint, CTA `Tiếp` (`ac2-order-wrong.png`).
  - Re-run after `cc6d9201`: 你们好 → all 3 slots `data-mark="right"`, border `rgb(29,24,20)` (ink); fresh run 们你好 → all 3 slots `data-mark="wrong"`, border `rgb(198,48,29)` = `--color-lantern-red #c6301d` (`verify-d/ac2-order-right.png`, `verify-d/ac2-order-wrong.png`).
- Explain 2: `Điểm ngữ pháp 2/2`.
  - Pairs: `谢谢 người kia nói → 不客气 bạn đáp` and `对不起 → 没关系`.
  - Hay nhầm: `谢谢！没关系。 Sai` / `谢谢！不客气。 Đúng`.
- Drills 6–8: `谢谢！`→不客气, `对不起！`→没关系, "Bạn làm rơi bút của cô giáo"→对不起; asks Câu 1/3…3/3.
- After 8/8: "Xong phần Ngữ pháp" plus "Mẫu A + 好 và các câu đáp đã vào phần ôn tập, sẽ quay lại cùng các câu hỏi khác." (`ac2-done.png`).
- The learner's IndexedDB ledger holds 8 inputs for run 1, in order:
  - `h1-g01`(null)
  - `q-h1-01-g01`✓
  - `q-h1-01-g02`✗
  - `q-h1-01-g03`✓ with `answer:"你们好"` and `step:{section:"grammar",of:8}`
  - `h1-g02`(null)
  - `g04`✓, `g05`✓, `g06`✓

Fixed in `cc6d9201` (CHY-33): the earlier AC1 gap (play buttons used `#i-bold-volume-loud`, absent from the sprite) is closed; also `/lesson/h1-02/grammar` and `/lesson/h1-05/grammar` now render (1/10 each) instead of throwing on audio/trueFalse drills.

## Residual risk
- Order step test mode ("Câu tiếp"/"Nộp bài", no reveal) has no rendering route until CHY-36.S1 (Gate). It is proven only in jsdom `Order.svelte.test.ts`.
- The ledger inputs were still local only after the run: 0 `attempts` rows on the server for this learner. Server sync is CHY-30.S2's scope.
