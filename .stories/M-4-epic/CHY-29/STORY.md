# CHY-29 — Landing page (P1)

## Goal (business why, 1-2 sentences)
Give a visitor a fast, warm, Vietnamese page that says what Chaiyo is and gets them to sign in in one tap; it is the only public page.

## Context an agent can't derive from code
- `src/routes/+page.ts:1-3` prerenders the page with SSR; `src/routes/+page.svelte:1-14` shows the logo, `landing_title` "Học tiếng Trung, từng bài một" and `landing_lede` (messages/vi.json:3-4). There is no CTA.
- The prototype is the design: `prototype/p1-landing.html:30-46` (hero art, logo, h1 "Bạn đã biết một nửa tiếng Trung rồi." and lede per SPEC AC3 (copy rewritten by Loc 2026-11-13), 4 points with cast avatars, "Bắt đầu học" and "Đã có tài khoản? Đăng nhập", both to login).
- Art lives git-ignored in `assets/` (R2): `assets/onboard/welcome.png` 2.6 MB, `assets/avatars/{redpanda,takin,panda}.png` ~29 KB each. CHY-26 S1 commits `static/onboard/welcome.webp` and `static/brand/logo-224.webp`.
- Every page loads the client app by default: `src/hooks.client.ts` starts Sentry, `src/routes/+layout.ts:5` injects Speed Insights. The landing page has no interaction beyond two links.
- CONTEXT.md "Landing Page": no lesson content, Dictionary or audio on it.

## Locked decisions (BA/Loc already ruled — never re-open)
- The Landing Page is the single public page and leads to log-in (CONTEXT.md "Landing Page"; ADR 0001 prerendered landing).

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Pre-rendered; Lighthouse mobile performance ≥ 90 | low | S1 |
| AC2 | Main call-to-action lands on the login screen | low | S1 |
| AC3 | Vietnamese, warm voice, no placeholder text | low | S1 |

## Out of scope
- Redirecting a signed-in visitor to Home (docs/screens.md:104; it needs the auth client on this page), SEO meta beyond the title and description, sample illustrations of lessons.
