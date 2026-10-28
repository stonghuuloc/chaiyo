# CHY-2 S2 — discussion
ACs: AC3 (AC3: Google + magic link enabled locally and on hosted project. Backlog chy-2.2:17: "enabled in supabase/config.toml and hosted dev project". No Gherkin.)

## Current behaviour (verified, with anchors)
- [AC3] `supabase/config.toml` has no `[auth.external.google]` block. The only external block is apple `:317-330`, with `enabled = false`.
- [AC3] Email signup is on (`:216`), `otp_length 6` (`:227`), `otp_expiry 3600` (`:229`). There is no `[auth.email.template.magic_link]` and no `supabase/templates/`.
- [AC3] `site_url = "http://127.0.0.1:3000"` (`:154`) and `additional_redirect_urls = ["https://127.0.0.1:3000"]` (`:158`). The dev server is `vite dev` (`package.json:7`) with no port set, so it runs on Vite's default 5173.
- [AC3] There is no hosted project for chaiyo: `supabase/.temp` has no `project-ref`. The CLI is not logged in (`supabase projects list` returns "Invalid access token"). Mantica's hosted ref `szqfojywzkmolmsmpnmk` takes ≥1 of the 2 free-plan slots.
- [AC3] There is no Google OAuth client for chaiyo. Mantica has only native mobile clients (google-services.json, GoogleService-Info.plist).
- [AC3] `src/` has no supabase or auth code and no `@supabase/*` dependency. The login UI is CHY-26.
- Prior art in Mantica: a google block with `env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID/_SECRET)` read from `supabase/.env` (`config.toml:342-349`, `skip_nonce_check = true`). Its magic-link template shows `{{ .Token }}`, so it sends a 6-digit code (`templates/magic-link.html`). Its README:77-80 says never run `supabase config push`.

## Answered here (no human needed)
- [AC3] Local `site_url` → `http://127.0.0.1:5173`, plus `http://localhost:5173` in the redirect list. AC3 needs Google to return to the running app, and that app runs on 5173, not 3000. This is a task, not a question.
- [AC3] Google env placeholders + README Google step belong to S2 (S1 DISCUSSION Q3 ruling, :42).
- [AC3] Q6-B guard: config push must not run with an empty Google secret env. The push step checks SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID/_SECRET are non-empty and aborts otherwise. This is the Mantica README:77-80 incident.
- [AC3] Hosted site_url domain comes from the Vercel project Loc creates during S2 (Q7-A). CHY-63 deploys to it later.
- [AC3] Loc task (outward): create the Vercel project to claim the domain; create the hosted Supabase project chaiyo; create the GCP project + OAuth web client.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC3] | Hosted project: new or reuse Mantica's? | A — new project `chaiyo` | Loc, 2026-10-28 |
| 1 | Q2 [AC3] | Email content: link, code, or both? | C — link + 6-digit code in one email | Loc, 2026-10-28 |
| 1 | Q3 [AC3] | Google client owner? | A — new GCP project "chaiyo", one web client, local + hosted callbacks | Loc, 2026-10-28 |
| 2 | Q5 [AC3] | Hosted email sender: default or custom SMTP (Resend)? | A — default sender now; Resend parked until a domain exists. Superseded by Q11-B. | Loc, 2026-10-28 |
| 2 | Q4 [AC3] | Hosted site_url while no deployed domain | Hosted site_url = the `<name>.vercel.app` domain Loc claims in S2 (Q7-A). Vercel setup is in m-0 (CHY-63) | Loc, 2026-10-28 |
| 2 | Q6 [AC3] | Hosted auth config: dashboard or `supabase config push`? | B — `supabase config push` from config.toml (config as code) | Loc, 2026-10-28 |
| 3 | Q7 [AC3] | Order: S2 or CHY-63 first? | A — S2 first; Loc creates an empty Vercel project in the dashboard to claim the `<name>.vercel.app` domain, which becomes the hosted site_url; CHY-63 later lands all 6 ACs | Loc, 2026-10-28 |
| 4 | Q8 [AC3] | Fallback if `[remotes.hosted]` is ignored by config push | C — if `[remotes.hosted]` is ignored, drop it and use one shared root block: `site_url = https://<name>.vercel.app`, redirect list = vercel.app + `http://localhost:5173` + `http://127.0.0.1:5173`. A was unworkable because push overwrites dashboard site_url. | Director pick 2026-10-28; 8A unworkable; Loc may override before Task 9 |
| 5 | Q9 [AC3] | Vercel domain before CHY-63 | A — one manual `vercel deploy --prod` now (no GitHub link, no env vars) to get the real `*.vercel.app` domain for hosted site_url; CHY-63 does the git integration + env | Loc, 2026-10-28 |
| 6 | Q10 [AC3] | Hosted values that drift from the local dev root block | B — pin hosted enable_confirmations=true, max_frequency=1m, TOTP MFA on; local keeps dev values | Loc, 2026-10-28 |
| 7 | Q11 [AC3] | Hosted email templates on the free tier | B — hosted uses Gmail SMTP (stonghuuloc@gmail.com, app password in supabase/.env); free tier blocks templates on the default sender; swap to Resend when chaiyo has a domain | Loc, 2026-10-28 |

## Open — needs an answer before spec
None. Q1–Q6 resolved above and keep their numbers; frontier empty.

## Locked (do not re-open)
- Auth providers = Google + email magic link. Nothing else (STORY.md).
