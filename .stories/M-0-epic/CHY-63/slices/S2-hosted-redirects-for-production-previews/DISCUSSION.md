# CHY-63 S2 — discussion
ACs: AC6

## Current behaviour (verified, with anchors)
- [AC6] `supabase/config.toml:350` hosted `site_url = "https://chaiyo.vercel.app"` ✓ matches the production domain.
- [AC6] `config.toml:351` hosted `additional_redirect_urls = ["https://chaiyo.vercel.app", "http://localhost:5173", "http://127.0.0.1:5173"]`: production root + 2 localhost, no preview pattern. TASK: add the pattern.
- [AC6] Guarded dry run `echo n | pnpm supabase:push ogczuwtlyetsugahwhui` (2026-10-28, main `bfd6976`): "Remote API / DB / Auth / Storage config is up to date" → the hosted diff is empty today, so the only diff after the edit is the new entry.
- [AC6] Supabase wildcard semantics (https://supabase.com/docs/guides/auth/redirect-urls): `*` = any sequence of non-separator characters, `**` = any sequence of characters, `?` = one non-separator character; **separators are `.` and `/`**. So `*` matches hyphens and does NOT match dots or slashes. The docs name wildcards as the way to support Vercel preview URLs.
- [AC6] Preview host shapes (PR #8 bot comment): branch alias `chaiyo-git-chy-63-stonghuulocs-projects.vercel.app`, per-deploy `chaiyo-<hash>-stonghuulocs-projects.vercel.app` (`vercel ls`: `chaiyo-mvy3rgtix-…`). Both contain only `[a-z0-9-]` between `chaiyo-` and `-stonghuulocs-projects`, so `chaiyo-*-stonghuulocs-projects.vercel.app` matches both (`*` = `git-chy-63`, `*` = `mvy3rgtix`).
- [AC6] `src/` has only `/` (`src/routes/+page.svelte`); no callback route or `signIn*` call exists (CHY-26), so the callback path is unknown.

## Answered here (no human needed)
- Q4 [AC6] Keep Vercel deployment protection on for previews? A: yes. Previews 302 to Vercel SSO without a login. AC6's preview leg is proven by an `/authorize` redirect check while logged in as Loc; learner-facing preview sign-in is ⚠️ scoped. Loc, 2026-10-28.
- [AC6] Path suffix: `/**`. The callback route does not exist yet (CHY-26), so an exact path would guess; `/**` accepts any path on matching hosts. Source: `src/routes` listing above.
- [AC6] Production entry stays `https://chaiyo.vercel.app` (AC6 needs "includes the production domain"; already true, `config.toml:351`).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q4 [AC6] | previews behind deployment protection | A — protection stays on; preview leg via /authorize, learner sign-in scoped | Loc, 2026-10-28 |

## Open — needs an answer before spec

### Q5 [AC6] Owner: Loc — Do we allow every `chaiyo-*-stonghuulocs-projects.vercel.app` host, accepting that another Vercel team could match it?

**Setup** — allow-list entries tested against 4 hosts. `*` stops at `.` and `/` but not at `-`. A Vercel team slug is chosen by its owner; one named `evil-stonghuulocs-projects` (illustrative) deploys a project `chaiyo` to `chaiyo-ab12cd-evil-stonghuulocs-projects.vercel.app`.

| host | A — `https://chaiyo-*-stonghuulocs-projects.vercel.app/**` | C — no wildcard; add each PR alias by hand |
|---|---|---|
| `chaiyo-git-chy-63-stonghuulocs-projects.vercel.app` (alias) | allowed | allowed only after its entry is added |
| `chaiyo-mvy3rgtix-stonghuulocs-projects.vercel.app` (deploy) | allowed | not allowed |
| `chaiyo-ab12cd-evil-stonghuulocs-projects.vercel.app` (other team, illustrative) | **allowed** (`*` = `ab12cd-evil`) | not allowed |
| entries to maintain | 1 | 1 per open PR, each pushed with `pnpm supabase:push` |

**Gap: 1 foreign host matches under A, 0 under C; C costs 1 config push per PR and fails AC6's "preview URL pattern".** A foreign host receives a learner's session only if the learner signs in through a link carrying that host as `redirect_to`.

➡️ A — AC6 asks for a pattern, Supabase documents wildcards for Vercel previews, the hosted project is the dev project, and narrowing to `chaiyo-git-*-…` removes no foreign match (`chaiyo-git-x-evil-stonghuulocs-projects…` still matches). Add the residual to `VERIFY.md`.

**Answer: pick A or C.**

## Locked (do not re-open)
- Hosted site_url = `https://chaiyo.vercel.app` (CHY-2 S2 Q4).
- Q4-A: previews stay behind Vercel deployment protection; AC6 preview leg proven via /authorize redirect, learner sign-in scoped.
