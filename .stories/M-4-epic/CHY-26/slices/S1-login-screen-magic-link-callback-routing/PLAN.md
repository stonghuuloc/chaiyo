# CHY-26 S1 — plan
ACs: AC1, AC2, AC3, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-26  ·  Lane L1 Auth (WAVE-PLAN)

## Depends on (execution order)
- main 18af4bb (M-3 merged: learner tables, grants, Ledger). Nothing else.

## Anchors (verified 2026-11-11 on main 18af4bb)
- `src/routes/login/+page.svelte:1-5` — stub to replace. `messages/vi.json:15` `login_title`.
- `src/routes/(app)/+layout.ts:1-8` + `src/lib/shell/guard.ts:6-10` — guard to copy into `(onboard)`.
- `src/lib/supabase.ts:1-4` — the client; `src/routes/+layout.ts:8` `ssr = false` (pages render in the browser).
- `src/lib/ui/Button.svelte:4-13` (variant primary/ink/outline, disabled, onclick) — buttons. `prototype/p2-login.html:44-110` — layout and copy.
- `supabase/config.toml:158` local redirects; `:99-102` Mailpit 56324; `:225` local `max_frequency` 1 s.
- `src/lib/db/migrate.ts:19-35` `migrate`, `:37-40` `asLearner` — PGlite harness; `supabase/migrations/20261110000000_learner_tables.sql:9-13, 46-51, 72-73` settings, its policies, the table grant.
- Kit 3.1 `goto(url, { replace })` (`replaceState` deprecated, @sveltejs/kit types/index.d.ts:2567-2569); `svelte/no-navigation-without-resolve` (eslint.config.js:16, src/lib/shell/TabBar.svelte:25 uses `resolve()`).
- auth-js 2.118.0 `GoTrueClient.ts:209` (implicit), `:691-708` (URL error returned, URL untouched).

## Task 1 [AC1] [AC2] [AC3] pure rules
File: `src/lib/auth/login.ts` (new), `src/lib/auth/login.test.ts` (new)
- Change: `okEmail`, `resendLabel`, `callbackOutcome`, `landing`, `CALLBACK = '/auth/callback'` per SPEC.
- Test first: the SPEC CI rows.
- Verify: `pnpm vitest run src/lib/auth` → pass. Negative control: `Math.ceil` instead of `Math.floor` in `resendLabel` → the 999 ms row gives "Gửi lại sau 59s" (60 − 1) and fails; revert.

## Task 2 [AC1] migration
Files: `supabase/migrations/20261112000000_onboarded.sql` (new), `src/lib/db/onboarded.test.ts` (new)
- Verify: `pnpm vitest run src/lib/db/onboarded` → pass; `supabase db reset` on the Mac exits 0.

## Task 3 [AC2] [AC3] login page
Files: `src/routes/login/+page.svelte`, `messages/vi.json` (+ `login_*` keys), `static/onboard/{welcome,start-b0,placed}.webp` (new, all M-4 onboarding art in one place so later lanes never write the same file: `magick ~/Documents/Projects/chaiyo/assets/onboard/<name>.png -resize 860x -quality 72 static/onboard/<name>.webp`, ≤ 80 KB each; the PNGs are 2.2-2.6 MB and git-ignored; CHY-27 S2 and CHY-28 S3 use start-b0 and placed); `static/brand/logo-224.webp` (new: `magick static/brand/logo.png -resize 224x224 -quality 80 static/brand/logo-224.webp`; CHY-29 reuses it)
- Change: three views in one page (`view = $state<'start' | 'email' | 'sent'>('start')`), copy per SPEC, `Button` for actions.
- Verify: tester's local AC2/AC3 rows.

## Task 4 [AC1] callback + onboard group
Files: `src/routes/auth/callback/+page.svelte` (new), `src/routes/(onboard)/+layout.ts` (new), `src/routes/(onboard)/welcome/+page.svelte` (new stub, `m.welcome_title()` = "Chào bạn!")
- Change: SPEC callback flow; show nothing but a quiet "Đang đăng nhập…" while it runs.
- Verify: tester's local AC1 rows.

## Task 5 [AC6] redirects + hosted
File: `supabase/config.toml:158`
- Change: add the two `/**` globs; `supabase stop && supabase start` to load them.
- Verify: local AC1 passes on both `127.0.0.1` and `localhost`. Hosted: preview per CREW.md, `npx vercel curl /auth/callback --deployment <url>` → 200; Loc's taps per SPEC.

## Task 6 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0 on the final tree; paste the coverage totals.

## Mutation paths covered
- Email: empty, bad, good, send error. Countdown: 60, 59, 1, 0, past 0, resend restart. Callback: ok, URL error, no session, settings row missing, settings row with/without `onboarded_at`, read error.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/auth/login.ts
export const CALLBACK = '/auth/callback';
export const okEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
export function resendLabel(sentAt: number, now: number) {
	const left = 60 - Math.floor((now - sentAt) / 1000);
	return left > 0 ? { text: `Gửi lại sau ${left}s`, disabled: true } : { text: 'Gửi lại link', disabled: false };
}
export function callbackOutcome(href: string): 'ok' | 'error' {
	const u = new URL(href);
	const p = new URLSearchParams(u.hash.slice(1));
	for (const [k, v] of u.searchParams) p.set(k, v);
	return p.has('error') || p.has('error_code') ? 'error' : 'ok';
}
export const landing = (row: { onboarded_at: string | null } | null) =>
	row?.onboarded_at ? ('/(app)/(tabs)/today' as const) : ('/(onboard)/welcome' as const);
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; the migration only adds a nullable column (`alter table settings drop column onboarded_at` if it must go).
