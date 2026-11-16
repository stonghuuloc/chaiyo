# CHY-40 S1 — verify
Env: dev server :5404 (worktree HEAD a65f4297), real Chrome 157 (CDP), 390×844 and 1440×900. Audio base = R2 public URL. Local Supabase was down at run time, so a fake unexpired session was seeded in localStorage (`sb-127-auth-token`) to pass the `requireSession` guard; no network auth.
Tests: `pnpm vitest run "src/routes/(app)/pinyin" src/routes/layout.test.ts` → 20 passed, 0 failed (one run).

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | `/pinyin`: 402 `tbody button[data-s]`, 390 `td.none` (402+390=22×36), 22 rows, 36 column heads, first row head "∅", `yi` and `lü` buttons present, `bia`/`fiao`/`tei` absent, 0 focusable elements in hatched cells, no `%`/"điểm" in page text, head row and first column `position:sticky`, buttons min height 44px, no page horizontal scroll. `/tmp/claude-501/verify-CHY-40/ac1-390.png` |
| AC2 | ✅ | Real tap on "ba": dialog title "ba", hint "Chạm một thanh để nghe. Chạm lần nữa để nghe chậm.", tone buttons bā 八 / bá 拔 / bǎ 把 / bà 爸, 4 contour SVGs (`ac2-390.png`, `desk.png`). Taps: bā → `play()` rate 1; bā again → rate 0.5 same src; bá → rate 1 new src (`pinyin-chart/<hash>.mp3` on r2.dev). Browser media requests 206; `curl` of the bā clip → 200 audio/mpeg 4845 B. "–" disabled tone: **not proven in browser** (real data has none; fixture unit test only). |
| AC3 | ✅ | `?open=ba` → dialog "ba" open after load; `?open=xyz`, `bia`, `BA`, empty → 402-cell table, no dialog. Esc after deep link → focus on cell `ba`. |
| AC4 | ✅ | Đóng, Esc, scrim tap (390×844) each → dialog gone, `document.activeElement` = cell `ba`; Esc at 1440×900 → focus `ba`. ✕ after client-side /roadmap → /pinyin → `/roadmap`. ✕ on fresh tab → navigates to `/lesson/h0-00`, which is a 404 today. Accepted by Loc 2026-11-16 until the Nhập môn hub (CHY-31/CHY-37) lands; see Decision. |

## Decision (Loc, 2026-11-16)
- AC4: ✕ on a directly opened table goes to `/lesson/h0-00` (404 today). Accepted; re-check when the hub page lands, and swap `location.assign` for `goto(resolve(...))` then.

## Residual risk
- ✕ on a fresh tab lands on a 404 until CHY-31/CHY-37 adds `/lesson/h0-00`.
- Tone with no clip ("–", disabled) proven only by fixture unit test; real data has 0 such tones.
- Sheet is not in server-rendered HTML (`curl ?open=ba` → 0 hits for hint text); it opens on client load, ~2 s after navigation in dev.
- Sessions were faked in localStorage; real Supabase sign-in not exercised.
