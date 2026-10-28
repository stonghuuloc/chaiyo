# CHY-3 S1 — plan
ACs: AC1, AC2, AC5  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-3

## Anchors (verified 2026-10-29)
- `src/routes/+layout.ts:7` — `export const ssr = false;` (root; app routes inherit it)
- `src/routes/+page.ts:2-3` — Landing `prerender = true`, `ssr = true` (stays public)
- `src/routes/+layout.svelte:8` — `{@render children()}`; root layout, no shell today
- `package.json:51` — `"dependencies"`: only `@vercel/speed-insights`
- `.env.example:2-3` — `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (local `.env` has them empty)
- `supabase/config.toml:10` api port 56321 · `:102` inbucket 56324 · `:154` site_url `http://127.0.0.1:5173`
  · `:158` redirect allow-list `127.0.0.1:5173`, `localhost:5173`
- `messages/vi.json:3-4` — only `landing_*` keys; `messages/en.json` empty by design (ADR 0001)
- `node_modules/@sveltejs/kit/package.json` — 3.1.0; `src/runtime/app/state` present (`page` rune state);
  `redirect` at `node_modules/@sveltejs/kit/src/exports/index.js:129`
- `vite.config.ts:26-36` — vitest `server` project, node env, `src/**/*.{test,spec}.ts`
- `prototype/tabs.js:4` — tab order house · path · brain · user-circle (icons are S2)

## Task 1 [AC5] Supabase browser client
File: `package.json:51` (new dep) + new `src/lib/supabase.ts`
- `pnpm add @supabase/supabase-js@^2.118.0`.
- `supabase.ts`: `createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY)` from
  `$env/static/public`; defaults keep `persistSession` + `detectSessionInUrl` on.
- Local `.env`: fill the two vars from `supabase status` (not committed).
- Test: none of its own — exercised by Task 3 smoke.

## Task 2 [AC5] Session guard as a load with an injected getter
File: new `src/lib/shell/guard.ts`, new `src/routes/(app)/+layout.ts`
- `requireSession(getSession)`: awaits getter; null → `throw redirect(307, '/login')`; else `{ session }`.
- `(app)/+layout.ts`: `export const load = () => requireSession(async () => (await supabase.auth.getSession()).data.session)`.
- Test first: `src/lib/shell/guard.test.ts` — `redirects to /login when no session` (asserts
  status 307 + location `/login`), `returns the session when signed in`.
- Verify: `pnpm vitest --run src/lib/shell/guard.test.ts`

## Task 3 [AC1] Tab table + selection
File: new `src/lib/shell/tabs.ts`
- `TABS = [{ path: '/today', label: m.tab_today }, '/roadmap', '/practice', '/me']` (labels via Paraglide).
- `tabFor(pathname)`: exact match on `path` → index; anything else → `null`.
- Test first: `src/lib/shell/tabs.test.ts` — 4 roots → 0..3; `/practice/session`, `/word/x`,
  `/`, `/login` → `null`.
- Verify: `pnpm vitest --run src/lib/shell/tabs.test.ts`

## Task 4 [AC1] Tab bar + tabs group layout + 4 roots
Files: new `src/lib/shell/TabBar.svelte`, `src/routes/(app)/(tabs)/+layout.svelte`,
`src/routes/(app)/(tabs)/{today,roadmap,practice,me}/+page.svelte`
- `TabBar`: `<nav class="tabs" aria-label={m.tabs_label()}>` + 4 `<a class="tab" href>`;
  `aria-current="page"` where `i === tabFor(page.url.pathname)` (`page` from `$app/state`). No styling (S2).
- `(tabs)/+layout.svelte`: `{@render children()}` then `<TabBar />`.
- Each root: `<h1>` with its Vietnamese title message; no other content.
- Messages `messages/vi.json:4`: `tab_today` "Hôm nay", `tab_roadmap` "Lộ trình", `tab_practice`
  "Luyện tập", `tab_me` "Tôi", `tabs_label` "Thanh điều hướng".
- Verify: `pnpm check` green; Task 7 smoke.

## Task 5 [AC2] Pushed screens without the bar
Files: new under `src/routes/(app)/` (outside `(tabs)`):
`lesson/[id]/[section]/+page.svelte`, `lesson/[id]/gate/+page.svelte`,
`practice/session/+page.svelte`, `word/[id]/+page.svelte`, `settings/+page.svelte`
- Each: `<h1>` with a Vietnamese title message (`screen_lesson_section` "Phần học",
  `screen_gate` "Kiểm tra", `screen_practice_session` "Luyện tập tổng hợp", `screen_word` "Từ",
  `screen_settings` "Cài đặt"). No `TabBar`.
- `lesson/[id]/gate` is a static segment, so it outranks `[section]` (SvelteKit route sorting).
- `practice/session` outside `(tabs)` while `/practice` is inside: different groups, distinct paths.
- Verify: `pnpm build` green (route conflicts fail the build); Task 7 smoke.

## Task 6 [AC5] Public login shell
File: new `src/routes/login/+page.svelte` (outside `(app)`, so no guard)
- `<h1>{m.login_title()}</h1>` — `login_title` "Đăng nhập". Nothing else; CHY-26 builds the screen.
- Verify: Task 7 smoke (signed-out `/login` renders, no redirect loop).

## Task 7 [AC1] [AC2] [AC5] Browser smoke (throwaway, deleted after)
- `supabase start` (chaiyo local stack) + `pnpm dev` in a split Orca pane.
- Signed out: open the 4 tab roots + 5 pushed URLs → each final URL `/login`, heading "Đăng nhập".
  `/` → Landing, no redirect.
- Sign in: `signInWithOtp({ email, options: { emailRedirectTo: 'http://127.0.0.1:5173/today' } })`,
  open the link from Inbucket (`:56324`) → lands on `/today` with a session.
- Signed in: 4 roots → heading matches, 1 `nav.tabs`, `aria-current` on the matching link;
  tap Lộ trình → `/roadmap`, `aria-current` moves. 5 pushed URLs → 0 `nav.tabs`.
- Proof captured into `VERIFY.md` at verify stage.

## Task 8 [CHORE] Gates
- `pnpm check && pnpm lint && pnpm test && pnpm build` all green before commit.

## Mutation paths covered
- Session arrives two ways: persisted (reload) and URL hash after magic link — Task 7 runs both
  (open `/today` from link, then hard-reload `/roadmap`).
- Sign-out path is CHY-26/U4; not in this slice.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/shell/guard.ts
import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
export async function requireSession(get: () => Promise<Session | null>) {
	const session = await get();
	if (!session) redirect(307, '/login');
	return { session };
}
```
```svelte
<!-- src/lib/shell/TabBar.svelte -->
<script lang="ts">
	import { page } from '$app/state';
	import { TABS, tabFor } from './tabs';
	const active = $derived(tabFor(page.url.pathname));
</script>
<nav class="tabs" aria-label={m.tabs_label()}>
	{#each TABS as t, i (t.path)}
		<a class="tab" href={t.path} aria-current={i === active ? 'page' : undefined}>{t.label()}</a>
	{/each}
</nav>
```
A fixture or route that contradicts the spec → report it, don't hack around it.

## Rollback
`git revert` this slice's commits; drop `@supabase/supabase-js`. No migration, no hosted config change.
