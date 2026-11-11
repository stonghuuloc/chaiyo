# CHY-26 S2 — spec
ACs: AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb; **builds on CHY-26 S1**)

## Behaviour
- [AC4] `callbackOutcome` gains `'expired'`: `error_code === 'otp_expired'` in the query or the hash (GoTrue sends it for an expired and for an already used link, "Email link is invalid or has expired"). The callback sends `'expired'` to `/login?s=expired`; other errors still go to `/login`.
- [AC4] Every successful link send (S1 Task 3 handler) also writes the trimmed email to `localStorage['chaiyo.login.email']`.
- [AC4] `/login?s=expired` opens the email view with that stored value in the field (empty when nothing is stored) and a status note above it: clock icon + "Link đã hết hạn. Gửi link mới nhé." (`role=status`). The field is not auto-focused (prototype/p2-login.html:73-94).
- [AC5] Migration `supabase/migrations/20261112000100_pending_deletion.sql`: `alter table settings add column delete_at timestamptz;` (the instant the account is erased; null = active). The table grant (20261110000000_learner_tables.sql:72-73) covers it; `settings` is owner-only, so no other learner learns who is pending deletion.
- [AC5] The post-sign-in routine moves from the callback page into `src/lib/auth/after-sign-in.ts` `afterSignIn(session, now)`: reads `settings.onboarded_at, delete_at` for `learner_id = session.user.id`, returns `landing(row, now)`. `landing`: `delete_at` later than `now` → `'restore'`; else S1's rule. `hrefFor(l)` in after-sign-in.ts returns `resolve('/login') + '?s=restore'` for 'restore' and `resolve(l)` otherwise (every other landing value is a route id, C-M4-3); every caller does `goto(hrefFor(l), { replace: true })`. Every `goto` uses `resolve()` and `{ replace: true }` (S1). A `delete_at` at or before `now` is ignored here (the erase job owns it).
- [AC5] `/login?s=restore` with a session: a `Sheet` (src/lib/ui/Sheet.svelte) titled "Khôi phục tài khoản?" over the start view, body "<b>{email}</b> sẽ bị xoá sau <b>{days} ngày</b>. Khôi phục để giữ bài học và từ vựng." with `email = session.user.email` and `days = daysLeft(delete_at, now)` = `ceil((delete_at − now) / 86 400 000)`. Without a session the start view shows and no sheet.
- [AC5] "Khôi phục": `settings.update({ delete_at: null }).eq('learner_id', uid).select('onboarded_at, delete_at').single()` → `goto(hrefFor(landing(row, now)), { replace: true })` → `/today` for an onboarded learner. An error keeps the sheet and shows "Chưa khôi phục được. Thử lại nhé.".
- [AC5] "Để sau" (and the sheet's scrim or Escape, which call the same `onclose`): `supabase.auth.signOut()`, close the sheet, `goto(resolve('/login'), { replace: true })`, start view.
- [LOCK] Code entry (CHY-2 S2 Q2-C; WAVE-PLAN Q1 assumed A): the sent view gains a field "Mã 6 số" (`inputmode=numeric`, `autocomplete=one-time-code`, `maxlength=6`) and a button "Đăng nhập bằng mã", enabled at exactly 6 digits. It calls `supabase.auth.verifyOtp({ email, token, type: 'email' })`; a session → `goto(hrefFor(await afterSignIn(session, Date.now())), { replace: true })`; an error → "Mã chưa đúng hoặc đã hết hạn.". The AC2 texts and countdown stay as S1 built them.
- [CHORE] New copy in messages/vi.json (`login_*`). `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- AC1-AC3, AC6 → S1. Ledger proof → S3. Requesting deletion (CHY-53), the erase job, keeping a pending learner out of `(app)` (no AC).

## Seam
None new.

## Test contract
CI (vitest, node):
- [AC4] `callbackOutcome`: `…#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` → expired; `…?error=access_denied&error_code=otp_expired` → expired; `…#error=access_denied&error_code=bad_oauth_state` → error.
- [AC5] `daysLeft` with now = 2026-11-11T03:00:00Z: delete_at 2026-11-16T02:00:00Z (4 d 23 h) → 5; 2026-11-16T03:00:00Z (5 d) → 5; 2026-11-16T03:00:00.001Z → 6; 2026-11-11T03:00:00.001Z → 1.
- [AC5] `landing` with that now: `{ onboarded_at: '2026-11-01T00:00:00Z', delete_at: '2026-11-16T02:00:00Z' }` → restore; same with `delete_at: null` → `'/(app)/(tabs)/today'`; `delete_at: '2026-11-11T02:00:00Z'` (past) → `'/(app)/(tabs)/today'`; `{ onboarded_at: null, delete_at: null }` → `'/(onboard)/welcome'`; `null` → `'/(onboard)/welcome'`.
- [AC5] PGlite (`src/lib/db/pending-deletion.test.ts`): Linh's settings row with `delete_at` set; the restore update as herself → 1 row, `delete_at` null; the same update as Linh on Nam's row → 0 rows, Nam's `delete_at` unchanged; Linh's select of Nam's `delete_at` → 0 rows.
Local proof (tester, Mac, as S1):
- [AC4] send a link to tong.loc@gmail.com, open it (lands signed in), open the same link again (session left in place; `callbackOutcome` runs first) → `/login?s=expired`, field "tong.loc@gmail.com", banner text visible, the field not focused.
- [AC5] onboarded user (settings row from S1's seed); psql `update settings set delete_at = now() + interval '5 days' - interval '1 hour' where learner_id = …`; sign in by link (it stands in for Google: both end on `/auth/callback` → `afterSignIn`; Google is Loc's hosted tap) → sheet with "tong.loc@gmail.com sẽ bị xoá sau 5 ngày"; "Khôi phục" → `/today`, psql shows `delete_at` null. Set it again, sign in, "Để sau" → start view on `/login`, `localStorage` has no `sb-127-auth-token` key, psql shows `delete_at` unchanged.
- [LOCK] code: read the 6 digits from the Mailpit message, type them → lands like the link; "000000" → "Mã chưa đúng hoặc đã hết hạn.".
Hosted (Loc, optional): AC5 with Google after the Captain runs `update settings set delete_at = now() + interval '5 days' where learner_id = …` in the hosted SQL editor (his row exists from S1's hosted step).

## Open assumptions
- WAVE-PLAN Q1 (code field) assumed A; B deletes the [LOCK] item and Task 4.
