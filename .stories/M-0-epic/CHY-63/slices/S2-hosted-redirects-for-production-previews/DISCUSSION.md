# CHY-63 S2 — discussion
ACs: AC6

## Current behaviour (verified, with anchors)
- [AC6] `supabase/config.toml:350` hosted `site_url = "https://chaiyo.vercel.app"` ✓ matches the production domain.
- [AC6] `config.toml:351` hosted `additional_redirect_urls = ["https://chaiyo.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"]`: production root + 2 localhost, no preview pattern. TASK: add the pattern.
- [AC6] Guarded dry run `echo n | pnpm supabase:push ogczuwtlyetsugahwhui` (2026-10-28, main `bfd6976`): "Remote API / DB / Auth / Storage config is up to date" → the hosted diff is empty today, so the only diff after the edit is the new entry.
- [AC6] Supabase wildcard semantics (https://supabase.com/docs/guides/auth/redirect-urls): `*` = any sequence of non-separator characters, `**` = any sequence of characters, `?` = one non-separator character; **separators are `.` and `/`**. So `*` matches hyphens and does NOT match dots or slashes. The docs name wildcards as the way to support Vercel preview URLs.
- [AC6] Preview host shapes (PR #8 bot comment): branch alias `chaiyo-git-chy-63-stonghuulocs-projects.vercel.app`, per-deploy `chaiyo-<hash>-stonghuulocs-projects.vercel.app` (`vercel ls`: `chaiyo-mvy3rgtix-…`). Both contain only `[a-z0-9-]` between `chaiyo-` and `-stonghuulocs-projects`, so `chaiyo-*-stonghuulocs-projects.vercel.app` matches both (`*` = `git-chy-63`, `*` = `mvy3rgtix`).
- [AC6] `src/` has only `/` (`src/routes/+page.svelte`); no callback route or `signIn*` call exists (CHY-26), so the callback path is unknown.

- [AC6] Probe on hosted, 2026-10-28, before any change. `GET /auth/v1/authorize?provider=google&redirect_to=<url>` → 302 to `accounts.google.com` for `https://chaiyo.vercel.app`, `https://evil.example.com` and the branch alias alike; the Google URL echoes `redirect_to` unvalidated and `state` is a 36-char opaque id. So `/authorize` does NOT discriminate the allow-list: the Google leg is a smoke check only.
- [AC6] `GET /auth/v1/verify?token=bogus&type=magiclink&redirect_to=<url>` (no email, no state) → 303 to: prod root → prod root; `http://localhost:5173` → itself; `https://evil.example.com` → `https://chaiyo.vercel.app` (site_url fallback); branch alias → `https://chaiyo.vercel.app` (**gap**); lookalike-team host → site_url. This probe discriminates allowed vs not.

## Answered here (no human needed)
- Q4 [AC6] Keep Vercel deployment protection on for previews? A: yes. Previews 302 to Vercel SSO without a login. AC6's preview leg is proven by an `/authorize` redirect check while logged in as Loc; learner-facing preview sign-in is ⚠️ scoped. Loc, 2026-10-28.
- [AC6] Path suffix: `/**`. The callback route does not exist yet (CHY-26), so an exact path would guess; `/**` accepts any path on matching hosts. Source: `src/routes` listing above.
- [AC6] Production entry stays `https://chaiyo.vercel.app` (AC6 needs "includes the production domain"; already true, `config.toml:351`).

- Q5 [AC6] Allow every `chaiyo-*-stonghuulocs-projects.vercel.app` host, accepting that another Vercel team could match? A: yes — one entry; the lookalike-team host (`chaiyo-ab12cd-evil-stonghuulocs-projects…`, illustrative) goes into `VERIFY.md` Residual risk. Loc, 2026-10-28.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q4 [AC6] | previews behind deployment protection | A — protection stays on; preview leg proven by redirect probe, learner sign-in scoped | Loc, 2026-10-28 |
| 2 | Q5 [AC6] | preview allow-list entry | A — one wildcard `https://chaiyo-*-stonghuulocs-projects.vercel.app/**`; lookalike-team host recorded as residual risk | Loc, 2026-10-28 |

## Open — needs an answer before spec
None. Q5 answered 2026-10-28 (below); the frontier is empty.

## Locked (do not re-open)
- Hosted site_url = `https://chaiyo.vercel.app` (CHY-2 S2 Q4).
- Q4-A: previews stay behind Vercel deployment protection; AC6 preview leg proven via /authorize redirect, learner sign-in scoped.
