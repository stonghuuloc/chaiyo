# CHY-27 S1 — plan
ACs: AC1, AC2, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-27  ·  Lane L2 Welcome (WAVE-PLAN)

## Depends on (execution order)
- CHY-26 S1 merged (`(onboard)` group, `/welcome` stub, sign-in).

## Anchors (verified 2026-11-11 on main 18af4bb)
- `prototype/o1-welcome.html:72-77` state + initials, `:78-94` profile step, `:96-131` reminder step, `:133-145` offer, `:147-158` steps, bar and back.
- `prototype/onboard.css` — times, switches, ticks styles to translate to Tailwind tokens.
- `src/lib/ui/Button.svelte:4-13`; `messages/vi.json:15` (last key today).
- `src/routes/(onboard)/welcome/+page.svelte` — CHY-26 S1's stub (`m.welcome_title()`).

## Task 1 [AC1] [AC2] [AC4] welcome rules
Files: `src/lib/welcome/welcome.ts`, `src/lib/welcome/welcome.test.ts` (new)
- Verify: `pnpm vitest run src/lib/welcome` → pass. Negative control: `slice(0, 30)` before `trim()` → the row with 2 spaces + 32 letters gives 28 letters, not 30, and fails; revert.

## Task 2 [AC1] [AC2] [AC4] page
Files: `src/routes/(onboard)/welcome/+page.svelte`, `messages/vi.json`
- Change: 3 steps per SPEC; `state = $state(fromUser(data.session?.user))` (`fromUser(undefined)` → empty name, photo null, email '') from the `(onboard)` layout data (guard.ts:10 returns `{ session }`; a null session on a retryable error shows the email-less form with an empty name); photo preview with `URL.createObjectURL` (revoked on change and unmount).
- Verify: tester's local rows.

## Task 3 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0; paste the coverage totals.

## Mutation paths covered
- Name: Google full_name, name only, none, over 30, blank. Time: each preset, custom, preset after custom. Channels: all 8 combinations for the hint. Back from steps 1 and 2.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/welcome/welcome.ts
export const TIMES = [['07:00', 'Sáng'], ['12:30', 'Trưa'], ['21:00', 'Tối']] as const;
export const noChannel = (s: Welcome) => !s.push && !s.emailOn && !s.telegram;
export const pressed = (s: Welcome) => TIMES.filter(([t]) => t === s.time).map(([t]) => t);
export const initials = (n: string) =>
	n.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(-2).join('').toUpperCase() || '?';
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; nothing is stored in this slice.
