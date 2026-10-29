# CHY-3 S1 — verify
Commit `6329eb9` (PR #10 head) · `pnpm dev` + local Supabase (API `:56321`, Mailpit `:56324`) · headless Chromium 390×844 · 2026-10-29

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Signed in via magic link → `/today` "Hôm nay". Tapped each tab in turn: Lộ trình → `/roadmap`, Luyện tập → `/practice`, Tôi → `/me`, Hôm nay → `/today`. Every step: h1 = tab name, 1 `nav.tabs`, exactly 1 `aria-current="page"` and it is the tapped tab. |
| AC2 | ✅ | Signed in, 5 of 5 example rows: `/lesson/h1-01/words` "Phần học", `/lesson/h1-01/gate` "Kiểm tra", `/practice/session` "Luyện tập tổng hợp", `/word/ni3` "Từ", `/settings` "Cài đặt" (any other pushed screen) — each 0 `nav.tabs`. |
| AC5 | ✅ | localStorage `sb-*` keys 1 → 0 after clear. Then 9 of 9 app URLs (4 roots + 5 pushed) end on `/login` "Đăng nhập", 0 tab bars. `/` stays Landing, `/login` renders with no loop. |
| AC6 | ✅ | Signed in, stored token `expires_at` set 60 s in the past, every request to Supabase `:56321` aborted (`internetdisconnected`), reload `/today` → stays on `/today`, "Hôm nay", 1 tab bar, after 26.5 s (auth-js retries refresh for up to 30 s). Back online → refresh succeeds, token no longer expired. |

Unit: `pnpm test` → 12 passed (`tabs.test.ts` 8, `guard.test.ts` 4). CI on PR #10: `ci` pass, Vercel pass. Console errors in every run: 0.

## Residual risk
- AC6 offline first paint waits up to 30 s on auth-js refresh retries (blank screen meanwhile); no AC sets a time bound.
- Vercel preview sits behind Vercel deployment protection (redirects to vercel.com/login), so the deployed build was not driven; local dev ran the same commit.
- Guard does not re-run on client navigation after sign-out → CHY-26 sign-out must `invalidateAll()`.
