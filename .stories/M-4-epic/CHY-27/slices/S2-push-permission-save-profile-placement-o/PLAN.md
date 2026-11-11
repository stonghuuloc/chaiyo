# CHY-27 S2 — plan
ACs: AC3, AC5, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-27  ·  Lane L2 Welcome

## Depends on (execution order)
- CHY-27 S1 merged; CHY-28 S1 (`CURRICULUM`) and S2 (`/placement`) merged; CHY-26 S2's migration `20261112000100` already in (name order).
- Before merge: the Captain runs `supabase db push --linked` for 20261113000000 and checks `supabase migration list --linked` (C-M4-7).

## Anchors (verified 2026-11-11 on main 18af4bb)
- `prototype/o1-welcome.html:98-101` push note copy, `:122-128` permission flow, `:133-145` offer.
- `supabase/migrations/20261110000000_learner_tables.sql:1-13` profiles, settings; `:46-51` settings policies; `:65-70` profiles policies.
- `src/lib/db/migrate.ts:20-38` PGlite harness; `src/lib/ui/Toast.svelte:5-13` props.
- `src/lib/study/apply.ts:17-19` lessons start locked except index 0. `CONTEXT.md:79` Reminder default.

## Task 1 [AC5] migration
Files: `supabase/migrations/20261113000000_reminders.sql`, `src/lib/db/reminders.test.ts` (new)
- Verify: `pnpm vitest run src/lib/db/reminders` → pass; `supabase db reset` exit 0.

## Task 2 [AC5] save
Files: `src/lib/welcome/save.ts`, `src/lib/welcome/save.test.ts`, `src/lib/welcome/photo.ts` (new; canvas crop, browser only)
- Verify: `pnpm vitest run src/lib/welcome` → pass. Negative control: upsert settings before profiles → the "profiles error → no settings call" row fails; revert.

## Task 3 [AC3] [AC6] page wiring
Files: `src/routes/(onboard)/welcome/+page.svelte`, `messages/vi.json`, `static/onboard/start-b0.webp` (offer art, read only; CHY-26 S1 commits it), `CONTEXT.md:79`
- Verify: tester's local rows; `[AC6]` CI row in `src/lib/welcome/welcome.test.ts`.

## Task 4 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0; paste the coverage totals.

## Mutation paths covered
- Permission: granted, denied, default, no API, already denied, off again. Save: new rows, existing rows (re-run), profile error, settings error, oversize photo, Google photo kept.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/welcome/photo.ts
export async function avatarDataUrl(file: File, size = 256): Promise<string> {
	const bmp = await createImageBitmap(file);
	const s = Math.min(bmp.width, bmp.height);
	const c = Object.assign(document.createElement('canvas'), { width: size, height: size });
	c.getContext('2d')!.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
	return c.toDataURL('image/jpeg', 0.8);
}
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; the migration adds defaulted columns and one check (drop them if needed).
