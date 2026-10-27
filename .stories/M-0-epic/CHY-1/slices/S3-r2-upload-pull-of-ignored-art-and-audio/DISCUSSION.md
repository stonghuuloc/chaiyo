# CHY-1 S3 — discussion
ACs: AC6

## Current behaviour (verified, with anchors)
- [AC6] Upload set (S1 rules `assets/**/*.png` + `prototype/audio/`): 1,594 files / 322.6 MB = 139 PNG + 1,454 mp3 + 1 `.DS_Store` (`prototype/audio/.DS_Store`). Largest: `assets/words/h5-01/w06.png`, 3.2 MiB (R2 single PUT limit is 5 GiB, so no multipart needed).
- [AC6] Biggest dirs: `assets/words` 67 files / 179 MB; `prototype/audio` 1,455 files / 18.6 MB (`py/` 1,276, `h2-01`…`h5-01` 136, `pl/` 20).
- [AC6] `assets/cast-options/` = 28 files / 49.2 MB, also ignored by `.gitignore:35`; nothing in `prototype/` loads it (`rg cast-options prototype` → 0 hits).
- [AC6] 20 paths are non-ASCII (`prototype/audio/pl/互相.mp3`…). Plain `git ls-files` quotes them, so a filter on its output silently drops them. Task: every listing, upload and manifest step uses `-z`/NUL-safe paths.
- [AC6] Prototype references are relative only: `../assets/<dir>/…png` (lesson.html:122,129,147; l3-words.html:75; home.html:153; t4-me.html:146…) and `audio/${key}.mp3` (`prototype/step.js:17,50`). No base URL, `R2`, `r2.dev`, or `ASSET_BASE` anywhere in `prototype/`, `src/`, `scripts/`. Restoring the same paths needs no prototype change.
- [AC6] Not touched by AC6: `prototype/talk/*.mp3|png` (7 files, tracked), `prototype/fonts/`, `prototype/data/` (tracked); `prototype/logos/` (134 files) and `lesson-images.html` are ignored but nothing references them.
- [AC6] No R2 credentials or tools on this Mac: no `wrangler` (`npx --no-install` fails), no `rclone`, no `~/.wrangler`, no env var matching `cloudflare|r2_|aws` except `AWS_PAGER`. `aws` CLI is installed (`/opt/homebrew/bin/aws`) but `~/.aws/config` has only CoverGo profiles (`dev`, `saas-preprod`, `infra`, sso-session `covergo`).
- [AC6] `.env.example` has only `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY`; `supabase/config.toml` has nothing R2-related; `scripts/` has no uploader (`rg 'put_object|upload|wrangler r2|s3 cp|rclone'` → 0).
- [AC6] R2 facts (developers.cloudflare.com/r2/…): free tier Standard = 10 GB-month, 1M Class A, 10M Class B, egress free (`/pricing/`); this set is ~3% of storage and ~0.16% of Class A. Public buckets cannot be listed at the root (`/buckets/public-buckets/`); `r2.dev` is "non-production", rate-limited ("hundreds of requests/second" then 429) and has no caching/WAF (`/platform/limits/`). API tokens need R2 purchased first; Object Read & Write can be scoped per bucket (`/api/tokens/`). `wrangler r2 object put` handles one file per call, no bulk subcommand; rclone and S3 SDKs/aws CLI take the endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (`/examples/rclone/`, `/workers/wrangler/commands/r2/`).
- [AC6] CHY-15 (`backlog/tasks/chy-15*:22,47,56-58`, `docs/architecture.md:28,33`) plans new audio as `sha256(hanzi|voice)` keys with a public R2 URL; no bucket name or URL is recorded in CHY-15, `docs/`, or `NOTES.md`. Today's audio is keyed by readable repo paths, not sha256.
- [AC6] BLOCKER for execute (not for spec/plan): bucket + token don't exist yet — Loc creates them (Q5).

## Answered here (no human needed)
- [AC6] Q: skip `.DS_Store`? A: yes — exclude it from upload and manifest (1,593 real files).
- [AC6] Q: where do credentials live? A: root `.env` (ignored by `.gitignore:16`); key names added to `.env.example`, values never committed.
- [AC6] Q: use the CoverGo AWS profiles? A: never. The uploader takes explicit endpoint + key + secret from `.env`, no named profile.
- [AC6] Q: which upload tool? A: plan detail — `aws` CLI is already installed (`aws s3 sync --endpoint-url`), rclone would need `brew install`; `wrangler` is one-file-per-call, so it is out.
- [AC6] AC6 wording becomes: ignored PNG (except `assets/cast-options/`) + mp3 exist in private R2 bucket `chaiyo-assets` under the same relative path; on a fresh clone with R2 credentials in `.env`, the pull script restores them so every `../assets/` path in prototype/ loads. (Task: reword backlog AC6 scenario + STORY.md row in spec stage.)
- [AC6] Q: does updating a file (same path, new content) orphan anything? A: no — upload overwrites the same key; orphans only come from renames/deletes, which Q6-A mirrors.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 | Does `assets/cast-options/` go to the asset store? | A — exclude; reword AC6 to "every ignored PNG the prototype or generators use" | Loc, 2026-10-26 |
| 1 | Q2 | Which Cloudflare account and public URL? | No Cloudflare account exists | Loc, 2026-10-26 |
| 1 | Q3 | Anonymous or credentialed pull? | B — files are private (only the repo is public, for free CodeRabbit; may go private again); pull uses credentials, no public URL, no manifest needed for listing | Loc, 2026-10-26 |
| 1 | Q4 | Shared bucket with CHY-15 sha256 audio? | A — one bucket, prefixes split (conditional on Q5 keeping R2) | Loc, 2026-10-26 |
| 2 | Q5 | Storage for private files | A — R2 private bucket `chaiyo-assets`; Loc creates account/bucket/token; aws CLI against R2 endpoint, no CoverGo profile | Loc, 2026-10-26 |
| 3 | Q6 | Does upload delete R2 objects whose local file is gone? | A — mirror: upload deletes R2 objects whose path no longer exists locally | Loc, 2026-10-26 |
| 3 | Q7 | Does pull overwrite a differing local file? | A — pull fills missing files only, never overwrites | Loc, 2026-10-26 |

## Open — needs an answer before spec
None open.

## Locked (do not re-open)
- Repo is public; generated PNG + mp3 live on R2, not git (Loc, 2026-10-26).
- Repo private until the end of S2 (after S3); S3 runs before the public flip (Loc, 2026-10-26).
- Personal GitHub only: stonghuuloc, remote via ssh alias stonghuuloc, noreply author email, signed with ~/.ssh/id_ed25519 — never the CoverGo work account/key (Loc, 2026-10-26).
- Out of scope: deploy (Vercel) pipeline; new scripts beyond the four existing ones are CI scope — the S3 upload/pull scripts are AC6's deliverable.
