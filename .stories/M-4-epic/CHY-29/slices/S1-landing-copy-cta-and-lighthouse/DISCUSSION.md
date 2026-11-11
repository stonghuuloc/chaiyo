# CHY-29 S1 — discussion
ACs: AC1, AC2, AC3 · design lead CHAA (M-4 design wave) · 2026-11-11

## Decided by Loc
- ADR 0001: SvelteKit with a prerendered Landing Page.

## Answered here (≥80% rule, CREW.md)
- [AC1] Q: how to reach ≥ 90 reliably? A: `csr = false`: the page is two links and text, so it needs no JavaScript, and Sentry + Speed Insights + the app entry stay off it. Lighthouse then scores HTML, CSS and 5 images (hero, logo, 3 avatars). Costs: `/` no longer registers the service worker (`/login` does) and sends no Speed Insights data. Advisor r1 built it: 0 `<script` in the prerendered page (kit render.js:355, :542). Confidence 90%.
- [AC3] Q: which copy? A: the prototype's (p1-landing.html:33-37 copy, :42-43 links), which Loc wrote in the app's voice; today's `landing_title` predates it. Loc still reads it at PICTURE. Confidence 80%.
- [AC2] Q: two CTAs to one place? A: yes, both go to `/login`: there is no separate sign-up (Google and the email link create the account). Confidence 90%.
- [AC1] Q: measure where? A: locally on `pnpm preview` (repeatable) and on the Vercel preview when protection lets Lighthouse in; the AC names no host. Confidence 80%.

## Open — needs an answer before execute
None.

## Locked (do not re-open)
- Only public page; no lesson content on it (CONTEXT.md "Landing Page").
