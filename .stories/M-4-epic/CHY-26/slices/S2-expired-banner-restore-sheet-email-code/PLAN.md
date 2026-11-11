# CHY-26 S2 — plan
ACs: AC4, AC5  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-26  ·  Lane L1 Auth

## Depends on (execution order)
- CHY-26 S1 merged (`src/lib/auth/login.ts`, login views, callback page, `onboarded_at`).

## Anchors (verified 2026-11-11 on main 18af4bb; S1 files per its SPEC)
- `src/lib/ui/Sheet.svelte:8` — props `open`, `title`, `onclose`, `children`; scrim click and Escape (`use:modal`) call `onclose`.
- `prototype/p2-login.html:73-94` (email view with the expired note), `:42-51` restore sheet markup and copy.
- `supabase/templates/magic-link.html:47-59` — "hoặc nhập mã này trong ứng dụng" + `{{ .Token }}`; `supabase/config.toml:227-229` `otp_length` 6, `otp_expiry` 3600.
- auth-js 2.118.0 `GoTrueClient.ts:3865-3874` — URL error → `AuthImplicitGrantRedirectError` with `code = error_code`.
- `src/lib/db/migrate.ts:37-40` `asLearner`; `supabase/migrations/20261110000000_learner_tables.sql:46-51` settings policies (update: own row).

## Task 1 [AC4] [AC5] rules
Files: `src/lib/auth/login.ts`, `src/lib/auth/login.test.ts`
- Change: `'expired'` outcome, `daysLeft`, `landing(row, now)` (signature grows from S1's `landing(row)`; update S1's rows to pass a `now`), `LAST_EMAIL = 'chaiyo.login.email'`.
- Verify: `pnpm vitest run src/lib/auth` → pass. Negative control: `Math.round` in `daysLeft` → the 4 d 23 h row still gives 5 but 2026-11-11T03:00:00.001Z gives 0 → fails; revert.

## Task 2 [AC5] migration + afterSignIn
Files: `supabase/migrations/20261112000100_pending_deletion.sql` (new), `src/lib/db/pending-deletion.test.ts` (new), `src/lib/auth/after-sign-in.ts` (new), `src/routes/auth/callback/+page.svelte`
- Change: callback calls `goto(hrefFor(await afterSignIn(...)), { replace: true })`; `'expired'` → `resolve('/login') + '?s=expired'`.
- Verify: `pnpm vitest run src/lib/db/pending-deletion` → pass; `supabase db reset` exit 0.

## Task 3 [AC4] [AC5] login page
Files: `src/routes/login/+page.svelte`, `messages/vi.json`
- Change: read `page.url.searchParams.get('s')`; expired → email view + note + stored value; restore → session check, settings read, `Sheet`; store the email on send.
- Verify: tester's local AC4 and AC5 rows.

## Task 4 [LOCK] code entry (drop if Q1 = B)
File: `src/routes/login/+page.svelte`
- Change: code field + button per SPEC; `verifyOtp` → `afterSignIn`.
- Verify: tester's local code rows.

## Task 5 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0 on the final tree.

## Mutation paths covered
- Callback: expired (hash, query), other error, ok. Restore: future, exactly 5 d, past, null, no settings row, update error, Để sau via button, scrim, Escape, no session. Code: 6 digits ok, wrong, under 6.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/auth/login.ts (additions)
export const LAST_EMAIL = 'chaiyo.login.email';
export const daysLeft = (deleteAt: string, now: number) => Math.ceil((Date.parse(deleteAt) - now) / 86_400_000);
type Row = { onboarded_at: string | null; delete_at: string | null } | null;
export const landing = (row: Row, now: number) =>
	row?.delete_at && Date.parse(row.delete_at) > now ? 'restore' : row?.onboarded_at ? '/(app)/(tabs)/today' : '/(onboard)/welcome';
// src/lib/auth/after-sign-in.ts
import { resolve } from '$app/paths';
export async function afterSignIn(session: Session, now: number) {
	const { data, error } = await supabase.from('settings').select('onboarded_at, delete_at').eq('learner_id', session.user.id).maybeSingle();
	return error ? ('/(app)/(tabs)/today' as const) : landing(data, now);
}
export const hrefFor = (l: ReturnType<typeof landing>) => (l === 'restore' ? resolve('/login') + '?s=restore' : resolve(l));
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; `alter table settings drop column delete_at` if the column must go.
