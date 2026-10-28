# CHY-2 S2 — verify
Re-verified independently on `main` @ a903634 (PR #6), 2026-10-28. No secret values printed.

| AC | Verdict | Evidence |
|---|---|---|
| AC3 | ✅ | local + hosted Google authorize → accounts.google.com, client_id match; local magic-link mail has link + code; hosted push drift = none; hosted OTP mail confirmed by Loc |

## AC3 evidence

### Local (`supabase start` exit 0)
| Check | Observed |
|---|---|
| `GET :56321/auth/v1/authorize?provider=google` | 302 → host `accounts.google.com`; client_id vs `supabase/.env`: **match**; redirect_uri `http://127.0.0.1:56321/auth/v1/callback` |
| `POST :56321/auth/v1/otp` (fresh `verify…@example.com`) | HTTP 200 |
| Mailpit `search?query=to:<addr>` | 1 message, subject `chaiyo — đăng nhập` |
| Mailpit `message/<id>` | 1 `/auth/v1/verify?token=…&type=magiclink&redirect_to=http://127.0.0.1:5173` link + 1 standalone 6-digit code (`Hoặc nhập mã`) |
| `supabase stop` | exit clean; chaiyo containers 0 |
| `_Mantica` containers | 0 before, 0 after (never started) |

### Hosted (ref `ogczuwtlyetsugahwhui`)
| Check | Observed |
|---|---|
| `GET …supabase.co/auth/v1/authorize?provider=google` | 302 → `accounts.google.com`; client_id **match**; redirect_uri `https://ogczuwtlyetsugahwhui.supabase.co/auth/v1/callback` |
| `echo n \| pnpm supabase:push ogczuwtlyetsugahwhui` | "Remote API / DB / Auth / Storage config is up to date." Answered n; nothing pushed |
| Hosted OTP mail (link + code) | Loc, 2026-10-28 (no OTP re-sent by this run) |

### Repo
| Check | Observed |
|---|---|
| `ci` on a903634 | completed / success |
| Credential literals in tracked files (`GOCSPX-…` value, real `*.apps.googleusercontent.com` id, `re_<key>`) | 0 matches; only bare word `GOCSPX` appears in 2 PLAN/SPEC verification-command lines |
| `supabase/.env` | gitignored (`.gitignore:16`), 0 tracked |

## Not AC
- Hosted sender is Gmail SMTP from Loc's personal address (Q11-B); Resend swap is a pending follow-up.
- CodeRabbit email-scanner concern is parked.
- Preview URLs are not in the hosted redirect list (CHY-63).
- Real Google sign-in against the hosted callback (consent screen, no `redirect_uri_mismatch`) is Loc's manual check, not run here.

## Residual risk
- None for AC3.
