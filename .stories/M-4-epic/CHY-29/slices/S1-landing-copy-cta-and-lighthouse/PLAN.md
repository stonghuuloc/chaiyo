# CHY-29 S1 — plan
ACs: AC1, AC2, AC3  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-29  ·  Lane L4 Landing (WAVE-PLAN)

## Depends on (execution order)
- CHY-26 S1 merged (`/login` screen, `static/onboard/welcome.webp`, `static/brand/logo-224.webp`).

## Anchors (verified 2026-11-11 on main 18af4bb)
- `src/routes/+page.ts:1-3`, `src/routes/+page.svelte:1-14`, `messages/vi.json:3-4`.
- `src/routes/+layout.ts:5,8` (Speed Insights, `ssr = false` for app pages), `src/hooks.client.ts:1-11` (Sentry init).
- `prototype/p1-landing.html:30-46` markup and copy; `src/lib/components/TalkingCast.test.ts:1` `render` from `svelte/server`.

## Task 1 [AC1] no client JS
File: `src/routes/+page.ts`
- Verify: build proof row (no `<script`). Negative control: remove `csr = false` → the prerendered HTML holds `<script`; restore.

## Task 2 [AC2] [AC3] page + copy + art
Files: `src/routes/+page.svelte`, `messages/vi.json`, `static/onboard/avatars/{redpanda,takin,panda}.webp` (new; `static/brand/logo-224.webp` comes from CHY-26 S1; `magick ~/Documents/Projects/chaiyo/assets/avatars/<a>.png -resize 96x96 -quality 80 …`), `src/routes/landing.test.ts` (new)
- Verify: `pnpm vitest run src/routes/landing` → pass.

## Task 3 [AC1] Lighthouse
- Tester runs the SPEC rows; if the median is under 0.90, report the top 3 Lighthouse opportunities to the lead before changing anything.

## Task 4 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Mutation paths covered
- Prerender on/off, CSR off, both links, copy present, placeholder absent.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/routes/+page.ts
export const prerender = true;
export const ssr = true;
export const csr = false;
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`.
