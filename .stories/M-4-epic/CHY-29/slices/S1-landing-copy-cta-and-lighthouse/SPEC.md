# CHY-29 S1 — spec
ACs: AC1, AC2, AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 2 (2026-11-13: hero art replaced per Loc, see DISCUSSION; **builds on CHY-26 S1** for `/login` and `static/brand/logo-224.webp`)

## Behaviour
- [AC1] `src/routes/+page.ts`: `prerender = true`, `ssr = true` stay; add `csr = false`. The page ships no JavaScript: no Sentry, no Speed Insights, no hydration (links are plain `<a>`).
- [AC2] `src/routes/+page.svelte` per prototype/p1-landing.html:30-46: hero art in a `<picture>`: `static/onboard/landing-wide.webp` (860w) and `landing-wide-1280.webp` (1264w) below 1024px (`fetchpriority="high"`, 3:2 box, masked bottom edge as prototype/p1-landing.html:16-18), `landing-tall.webp` (640w) and `landing-tall-960.webp` (960w) from 1024px (2:3 box, 480px wide); each device downloads one image. Welcome keeps its own `welcome.webp`, logo `static/brand/logo-224.webp` (committed by CHY-26 S1; the 977 KB logo.png drops Lighthouse to 0.76, advisor r1 measured 0.96-1.00 with the WebP), h1, lede, 3 points with avatars `static/onboard/avatars/{redpanda,takin,panda}.webp` (96 px, ≤ 8 KB each), a primary link "Bắt đầu học" and a text link "Đã có tài khoản? Đăng nhập", both `href={resolve('/login')}` (C-M4-3; prerendered output reads `./login`, vitest render reads `/login`).
- [AC3] Copy (messages/vi.json `landing_*`): `<title>` "Chaiyo! Học tiếng Trung bằng tiếng Việt", meta description = the lede, h1 "Học tiếng Trung bằng tiếng Việt", lede "Mỗi ngày một chút, cùng các bạn thú.", points "Mỗi chữ có Hán Việt", "Nghe giọng thật từ các bạn thú", "Mỗi ngày một chút, có lộ trình HSK". `landing_title` and `landing_lede` change value; no other page reads them (grep on main: only src/routes/+page.svelte).
- [CHORE] `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- Signed-in redirect (no AC; parked in WAVE-PLAN). Login itself (CHY-26).

## Seam
None.

## Test contract
CI (vitest, node, `src/routes/landing.test.ts`, `render` from `svelte/server` as src/lib/components/TalkingCast.test.ts:1 does):
- [AC2] the HTML holds exactly 2 `<a` with `href="/login"`, the first with text "Bắt đầu học".
- [AC3] `body` holds the h1, lede and 3 points above; `head` holds `<title>Chaiyo! Học tiếng Trung bằng tiếng Việt</title>` and `content="Mỗi ngày một chút, cùng các bạn thú."`; the visible text (`(body + head).replace(/<[^>]+>/g, ' ')` plus every `content="…"` in `head`) matches none of `/lorem|ipsum|TODO|TBD|placeholder|Hello|Welcome/i`; every `landing_*` value in messages/vi.json is non-empty.
- [AC1] `import * as page from './+page'` → `prerender` true, `ssr` true, `csr` false.
Build proof (tester, Mac): `pnpm build` → `.svelte-kit/output/prerendered/pages/index.html` exists and has no `<script` tag; the total bytes of `index.html` + its CSS + `welcome.webp` + `logo-224.webp` + 3 avatars + fonts (Lighthouse `total-byte-weight`) are printed. Preview (tester, CREW.md deploy): `npx vercel curl / --deployment <url>` → 200, body holds "Bắt đầu học" and 0 `<script`; `npx vercel curl /onboard/welcome.webp --deployment <url>` and `/brand/logo-224.webp` → 200.
- [AC1] `pnpm preview --host 127.0.0.1` and `npx lighthouse http://127.0.0.1:4173/ --only-categories=performance --form-factor=mobile --quiet --output=json --chrome-flags="--headless=new"` (default mobile throttling) 3 runs → median `categories.performance.score` ≥ 0.90; paste the 3 scores. The same on the Vercel preview when deployment protection allows (else say so).
- [AC2] Playwright Chromium from ~/.capy/work (not committed) on `pnpm preview --host 127.0.0.1`: tap "Bắt đầu học" → URL `/login` showing "Tiếp tục với Google".
- [AC3] Loc reads the page in the PICTURE stage (voice is his call).

## Open assumptions
- None.
