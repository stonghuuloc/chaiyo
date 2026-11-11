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

## Task 4b [DESKTOP] login layout
Files: `src/routes/login/+page.svelte`, `static/onboard/welcome-1280.webp` (new)
- Change: art + column wrapper, CSS-only breakpoints at 48rem and 64rem per SPEC "Desktop rows".
- Verify: tester's Playwright rows at 390 / 1024 / 1280 / 1440.

## RESPONSIVE checklist (docs/responsive.md)
```
RESPONSIVE (docs/adr/0008)
[ ] Picture/prototype at 390x844, 1024x768, 1280x800 and 1440x900 (768x1024 too if the layout differs there).
[ ] Containers come from tokens (--container-column/medium/main/aside/narrow/form/sheet). Check: the diff adds no
    430px and no max-w-[<n>px] / width:<n>px for layout.
[ ] One DOM per screen. Breakpoints in CSS only; no {#if desktop} component swap. matchMedia only for the ADR 0008 §1 exceptions.
[ ] Each new route under (app) declares shell: { template, section } in its own load, returned as `shell` (ADR 0008 §4); nav per its table: tab root = tab bar <1024 / sidebar >=1024; pushed browse screen = sidebar >=1024
    with the table's tab active; focus flow = no nav at any width (top bar + centred column + sticky action bar); public page = no nav.
[ ] Overlays use Sheet/Dialog from src/lib/ui (Sheet turns into a centred dialog >=1024). No custom sheets.
[ ] Keyboard: Tab order = visual order (exception: the tab bar below 1024 comes before main, ADR 0008 §6), focus ring visible, focus moves to the new step heading when a step changes.
    Focus flows use the keys action from src/lib/ui (event.code digits, Enter, Space, Esc). No letter shortcuts, none on tab roots.
[ ] Key hints (kbd) only under (hover: hover) and (pointer: fine).
[ ] Hover is feedback only. Check: every hand-written :hover in the diff sits inside @media (hover: hover). Clickable rows have cursor: pointer.
[ ] Targets >= 44px at every width. Body text measure <= 70ch. Full-height layouts use dvh/svh, never vh.
[ ] Copy says "Bấm" (click and tap); never "Chạm" or "Vuốt". Every swipe has a button. (Grep the screen's prototype for "Chạm" at SPEC time.)
[ ] Art wider than 430 CSS px ships a 1280w WebP and keeps 3:2 (aspect-ratio); no text in images.
[ ] Auto-playing audio catches play() rejection; the play button stays ready (proof: reload on that step, no console error).
[ ] Floating UI never covers content at any width (tab-bar bottom padding only below 1024).
[ ] Proof rows: Playwright at the four sizes above with a screenshot each; one live resize 1440 -> 390 -> 1440 mid-flow with no
    state lost and no horizontal scroll at 320. Chrome + Safari on the Mac for the desktop rows (say Tab or Option+Tab in Safari).
```
Desktop rows that apply: public template, Sheet from R2, Enter submits, no new max-w px, one DOM, art 1280w WebP at 3:2, targets >= 44px, dvh.

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
