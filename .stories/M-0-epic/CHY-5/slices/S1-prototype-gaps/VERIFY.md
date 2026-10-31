# CHY-5 S1 — verify
Head `c3c6395` · served repo root :5180 · agent-browser 390×844, fresh profile · shots `screens/verify/`

| AC | Verdict | Evidence |
|---|---|---|
| AC4 | ✅ | P1, X1, M2, M3 each exist as a prototype file and render every SPEC behaviour line (rows below); 0 console errors on 9 pages |

| SPEC line | Verdict | Observed |
|---|---|---|
| :5 P1 | ✅ | CTA → `p2-login.html`; no audio or hanzi on the page; 5/5 images load; no horizontal scroll (390) · `p1.jpg` |
| :6 X1 content | ✅ | 32 tappable hanzi; 你好 → "Xem chi tiết" → `w1-word.html?w=你好`; 爸爸 → "Thêm vào từ của tôi"; 奶茶 → "Đã có trong Từ của tôi" |
| :7 X1 anchor | ✅ | 32/32 taps, 0 intersect (sheet below 7×, above 25×); first line: glyph 126–161, sheet 206–455 · `x1-first-line.jpg`, `x1-last-line.jpg` |
| :8 longest match | ✅ | 2nd 谢 → 谢谢, no chip row; 机 → 飞机, chips 飞机 · 飞 |
| :9 actions | ✅ | add → toast "Đã thêm 爸爸 vào Từ của tôi"; 爸爸 listed in `t3-words.html` · `x1-add-toast.jpg`, `t3-words.jpg` |
| :10–12 M2 paper | ✅ | 8 parts × 5 = 40 render; 20/20 pictures load; `check-mock.mjs` → ok 40 questions |
| :11 audio | ✅ | q01–q20.mp3 → 20/20 HTTP 200, decode 1.9–5.6 s; Loc listened after the fix: "ok now" |
| :13 entry | ✅ | t3 HSK 1 row "… · làm thử bản demo"; `p2-skill?k=thi&lv=1` Thi thật / Luyện, lock line kept, no "Chưa có đề" · `entry-skill.jpg` |
| :14 Exam | ✅ | 12:00 at start; 2 plays then "Còn 0 lượt nghe", disabled; no feedback; ✕ → "Bỏ bài thi?"; forced 0:00 → reading → M3 · `m2-exam.jpg`, `m2-exam-leave.jpg` |
| :15 Practice | ✅ | no timer; Đúng rồi / Chưa đúng after 40/40 answers, all 8 part types · `m2-part1..8.jpg` |
| :16 M3 | ✅ | 50/200 = 25 + 25, 2 section bars, 40 review rows; M2 intro then shows "Điểm thi thật cao nhất: 50/200" · `m3.jpg`, `intro-best.jpg` |
| :17 LOCK | ✅ | static HTML from repo root, no build step |

## Residual risk
- Clip wording is checked by Loc's ear only (no speech-to-text tool); clip n is rendered from item n's text.
- Review nits open: `mock-h1.js?v=1` not bumped (cached browsers may show the old 喝水 explanation until hard refresh); `x1-lookup.html` still uses the browser voice.
