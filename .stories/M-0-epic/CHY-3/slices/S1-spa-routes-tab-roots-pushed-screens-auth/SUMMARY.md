# CHY-3 S1 — summary
ACs: AC1, AC2, AC5, AC6  ·  Commits: d20ab06 + record commit  ·  Branch: CHY-3

## Shipped
- [AC1] `src/routes/(app)/(tabs)/{today,roadmap,practice,me}` + `(tabs)/+layout.svelte` renders `TabBar`;
  `src/lib/shell/tabs.ts` `tabFor()` marks one link `aria-current="page"`. Test: `tabs.test.ts` ✓
- [AC2] 5 pushed shells under `src/routes/(app)/` outside `(tabs)`: `lesson/[id]/[section]`,
  `lesson/[id]/gate`, `practice/session`, `word/[id]`, `settings`. No `TabBar`.
- [AC5] `src/routes/(app)/+layout.ts` → `requireSession()` (`src/lib/shell/guard.ts`) over
  `supabase.auth.getSession()`; null → 307 `/login`. `/login` shell public. Test: `guard.test.ts` ✓

- [AC6] `guard.ts`: null session + `isAuthRetryableFetchError` → stay in app (auth-js keeps the stored session). Tests: `guard.test.ts` 4 ✓ (no session, rejected refresh → `/login`; network failure → stays; session → returned).

## Deviated from plan
- Kit 3.1 has no `$env/static/public`: vars declared in new `src/env.ts` (`defineEnvVars`, public+static),
  read from `$app/env/public`.
- `svelte/no-navigation-without-resolve` lint rule: `TABS` entries carry a route id; links use `resolve()`.
- Kit validates env at check/test/build → `.github/workflows/ci.yml` job-level placeholder
  `PUBLIC_SUPABASE_*` (public values, CI never calls Supabase).

## Not done / follow-up
- Guard does not re-run on client navigation after sign-out → CHY-26 sign-out must `invalidateAll()`/`goto('/login')`.

## Verification run
- `pnpm check` → 0 errors · `pnpm lint` → exit 0 · `pnpm test` → 10 passed · `pnpm build` → built
- Browser smoke, `pnpm dev` + local Supabase, 390×844:
  signed out: 9 app URLs → `/login` "Đăng nhập", 0 bars; `/` Landing, `/login` no loop.
  magic link (GoTrue `/otp` → Mailpit `:56324` → link) → `/today` "Hôm nay", 1 bar, current = Hôm nay;
  tap Lộ trình → `/roadmap`, current moves; `/practice`, `/me` ✓; hard reload `/roadmap` keeps session;
  5 pushed URLs → title, 0 bars, 0 `aria-current`. Console errors: 0.
- pre-push-review round 1 (deep, 2 lanes): 0 findings.
