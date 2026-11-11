# CHY-26 S1 — spec
ACs: AC1, AC2, AC3, AC6  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb)

## Behaviour
- [AC1] `/login` start view (prototype/p2-login.html:62-71): hero art `static/onboard/welcome.webp`, logo `static/brand/logo-224.webp` (new, ≈ 8 KB, shown at 112 px; `logo.png` is 977 KB), a visually hidden h1 "Chaiyo!", tagline "Mỗi ngày một chút. 加油!", primary button "Tiếp tục với Google" (Google G mark) and a text button "Dùng email". No legal links (no Terms or Privacy page exists).
- [AC1] Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + '/auth/callback' } })`.
- [AC3] "Dùng email" opens the email view: back button, h1 "Đăng nhập bằng email", lead "Không cần mật khẩu.", field "Email" (`type=email`, `autocomplete=email`, placeholder "ban@gmail.com"), button "Gửi link" disabled while the trimmed value is empty. Tapping it with a value that fails `okEmail` shows "Email chưa đúng", focuses the field and sends nothing; typing hides the error again.
- [AC3] `okEmail(v)` = `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)` (prototype/p2-login.html:60): "tong.loc@" → false, "tong.loc@gmail" → false, "tong.loc@gmail.com" → true.
- [AC2] A valid email calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/auth/callback' } })`. Success opens the sent view: h1 "Mở email của bạn", "Đã gửi link tới <b>tong.loc@gmail.com</b>", "Không thấy? Xem mục Spam.", the resend button and "Đổi email" (back to the email view, value kept). A send error keeps the email view and shows "Chưa gửi được. Thử lại sau nhé.".
- [AC2] Resend: `resendLabel(sentAt, now)` → `{ text, disabled }` with `left = 60 − floor((now − sentAt) / 1000)`: left > 0 → `Gửi lại sau {left}s`, disabled; left ≤ 0 → "Gửi lại link", enabled. The view re-reads `now` every 1000 ms. Tapping "Gửi lại link" sends again and restarts at 60.
- [AC1] `/auth/callback` (new): reads `window.location.href` before anything awaits, computes `callbackOutcome(href)`; `'error'` → `goto(resolve('/login'), { replace: true })` (Kit 3.1 deprecates `replaceState`; the repo lints `svelte/no-navigation-without-resolve`). Otherwise `supabase.auth.getSession()`; no session → `/login`; a session → read `settings.onboarded_at` with `.eq('learner_id', session.user.id).maybeSingle()` → `goto(resolve(landing(row)), { replace: true })`; a read error → `goto(resolve('/(app)/(tabs)/today'), { replace: true })`.
- [AC1] `callbackOutcome(href)` reads both the query and the hash: any `error` or `error_code` → `'error'`, else `'ok'`. `landing(row)`: `null` or `onboarded_at === null` → `'/(onboard)/welcome'`, else `'/(app)/(tabs)/today'` (route ids for `resolve()`, WAVE-PLAN C-M4-3; test rows below write the resulting URLs `/welcome`, `/today`).
- [AC1] `(onboard)` route group (new): `+layout.ts` uses `requireSession` exactly like src/routes/(app)/+layout.ts:1-8; `welcome/+page.svelte` is a stub with h1 "Chào bạn!" until CHY-27 S1 replaces it.
- [AC1] Migration `supabase/migrations/20261112000000_onboarded.sql`: `alter table settings add column onboarded_at timestamptz;`. The table-level `grant select, insert, update, delete on profiles, settings, follows, attempts to authenticated` (20261110000000_learner_tables.sql:72-73) covers a new column; no new grant. `settings` is owner-only, so no other learner can read it.
- [AC6] Both methods send `/auth/callback` on the current origin, which the hosted allow-list matches on a preview (supabase/config.toml:351). Local `additional_redirect_urls` (:158) gains `"http://127.0.0.1:5173/**"` and `"http://localhost:5173/**"`.
- [CHORE] Copy lives in messages/vi.json under `login_*` and `welcome_title`. `pnpm check`, `pnpm lint`, `pnpm test:coverage` (thresholds hold), `pnpm build` exit 0.

## Not this slice
- AC4 expired banner, AC5 restore sheet, the 6-digit code field → S2. Signed-in Ledger proof → S3. Welcome content → CHY-27.

## Seam
None new. Pure rules in `src/lib/auth/login.ts`; the pages call the existing `supabase` client.

## Test contract
CI (vitest, node, `src/lib/auth/login.test.ts`):
- [AC3] `okEmail`: the three values above; also " tong.loc@gmail.com " is trimmed by the caller, so `okEmail` gets "tong.loc@gmail.com" → true.
- [AC2] `resendLabel(0, t)` for t = 0 → "Gửi lại sau 60s" disabled; 999 → 60s; 1000 → 59s; 59 000 → 1s disabled; 60 000 → "Gửi lại link" enabled; 61 000 → enabled.
- [AC1] `callbackOutcome`: `…/auth/callback#access_token=a&refresh_token=b&type=magiclink` → ok; `…#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired` → error; `…?error=access_denied&error_code=bad_oauth_state` → error; `…/auth/callback` → ok.
- [AC1] `landing`: null → `'/(onboard)/welcome'`; `{ onboarded_at: null }` → `'/(onboard)/welcome'`; `{ onboarded_at: '2026-11-10T02:00:00Z' }` → `'/(app)/(tabs)/today'`.
- [AC1] PGlite (`src/lib/db/onboarded.test.ts`, `migrate()` from src/lib/db/migrate.ts): Linh inserts her settings row with `onboarded_at` and reads it back; Linh's `select onboarded_at from settings where learner_id = <Nam>` → 0 rows; her `update settings set onboarded_at = now() where learner_id = <Nam>` → 0 rows (affectedRows 0), Nam's value unchanged.
Local proof (tester, Mac, `supabase start` + `pnpm dev --host 127.0.0.1`, Playwright Chromium in ~/.capy/work, not committed):
- [AC1] signed out, open `/login` → logo image, "Mỗi ngày một chút. 加油!", buttons "Tiếp tục với Google" and "Dùng email" visible. Tap Google → the first request to `/auth/v1/authorize` carries `provider=google` and `redirect_to=http://127.0.0.1:5173/auth/callback` (`page.waitForRequest`; the provider may then fail locally).
- [AC3] email view, type "tong.loc@", tap → "Email chưa đúng" visible and the field focused; no request to `/auth/v1/otp` during the tap (`page.on('request')`); the Mailpit total is unchanged.
- [AC2] `page.clock.install({ time: T0 })`, goto `/login`, `clock.pauseAt(T0 + 5000)`; send to tong.loc@gmail.com → the three texts; button "Gửi lại sau 60s" disabled; `runFor(1000)` → 59s; `runFor(58000)` → 1s; `runFor(1000)` → "Gửi lại link" enabled; wait 1200 ms of real time (Node `setTimeout`, not `page.waitForTimeout` under the fake clock, so local `max_frequency` 1 s passes); tap it → "Gửi lại sau 60s" and Mailpit holds 2 messages to that address; "Đổi email" → email view with the value.
- [AC1] a never-seen address → Mailpit link → lands on `/welcome` showing "Chào bạn!". Seed `insert into settings (learner_id, onboarded_at) select id, now() from auth.users where email = '<addr>'` (psql on 56322), sign in again → `/today`.
Hosted (Loc, preview of the head, CREW.md deploy): [AC6] Google and an email link to his inbox each end signed in on `/welcome` or `/today`, never back on `/login`; [AC1] Google rows: a first Google sign-in → `/welcome`; after the Captain runs `insert into settings (learner_id, onboarded_at) select id, now() from auth.users where email = '<Loc>'` in the hosted SQL editor → `/today`. Needs 20261112000000 on hosted first (WAVE-PLAN).

## Open assumptions
- None.
