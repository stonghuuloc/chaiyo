# Copy voice (Vietnamese)

Rules for every user-facing string in `messages/vi.json` (Loc, 2026-11-13).

1. Natural spoken Vietnamese: short, warm, the way a friend would say it. No stiff or machine-translated phrasing.
2. Address the learner as "bạn". Put "nhé" or "cứ" where a friend would; skip it in labels and buttons.
3. Never "dạy" (it reads as talking down). The app helps you learn; it does not teach you.
4. The animals are "những người bạn" or their names: gấu trúc, gấu trúc đỏ, hươu con, takin. Never "các bạn thú" (the test bans that exact phrase, so "bạn thú vị" is fine).
5. No hard HSK level numbers in copy, except "HSK3.0" where it already appears. A level the data supplies (`{level}`) is fine.
6. Use the terms in `CONTEXT.md` (Hán Việt, pinyin, lộ trình, Luyện tập, Từ của tôi, Chuyên đề) and keep one term per idea.
7. One clear meaning per string. Errors say what happened and what to do next ("Chưa lưu được. Bạn thử lại nhé.").
8. Keep keys, ICU placeholders and message structure. Change values; add new keys only by appending.
9. `src/lib/copy-voice.test.ts` fails on the banned words above.
