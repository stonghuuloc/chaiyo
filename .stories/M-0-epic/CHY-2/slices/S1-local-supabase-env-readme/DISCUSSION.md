# CHY-2 S1 — discussion
ACs: AC1, AC2, AC4

## Current behaviour (verified, with anchors)
- [AC1] `supabase/` holds only `config.toml` (no `migrations/`, no `seed.sql`); `[db.seed]` is enabled with `sql_paths = ["./seed.sql"]` (`config.toml:60-65`), `[db.migrations] enabled` (`:53-55`), `project_id = "chaiyo"` (`:5`), Postgres major 17 (`:36`).
- [AC1] Default ports: api 54321 (`:10`), db 54322 (`:29`), shadow 54320 (`:31`), pooler 54329 (`:41`), studio 54323 (`:91`), inbucket/mailpit 54324 (`:102`), analytics 54327 (`:385`).
- [AC1] **Port clash today:** 11 `supabase_*_Mantica` containers are running (docker ps, read-only), incl. kong `0.0.0.0:54321`, studio `:54323`, inbucket `:54324`, analytics `:54327`. `supabase start` for chaiyo cannot bind these. Docs: default ports allow one local project per machine (supabase.com/docs/guides/local-development/cli/getting-started: "`supabase start` runs one local project per machine, because every project's `config.toml` uses the same ports").
- [AC1] Tooling: `supabase` 2.101.0 at `/opt/homebrew/bin/supabase` (global brew); Docker Desktop server 28.5.2 up (`docker info`: 44 containers, 37 running). Docs say Docker (or OrbStack/colima/Podman) is required; Node 20+ only for npm install of the CLI.
- [AC1] CLI 2.101 prints "Publishable" + "Secret" keys, not "anon" (docs sample, same URL). AC1 says "anon key"; publishable is the anon key's successor. NOT run: Loc owns Docker/start, so exit 0 + printed output is unproven until Loc runs it.
- [AC1] `config.toml` has `env(OPENAI_API_KEY)` (`:95`), `env(S3_*)` (`:394-400`), Twilio/Apple secrets (`:289`, `:321`). Unset-env behaviour of `start` unverified; settle when Loc runs it.
- [AC2] `src/` reads zero env vars: `rg 'PUBLIC_|\$env|import\.meta\.env|process\.env' src vite.config.ts` → 0 hits. No `@supabase/*` in `package.json:22-45` (devDependencies only).
- [AC2] `.env.example:1-3` has `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (empty, no secrets); `:4-8` R2 keys read by `scripts/assets_*.py`, not `src/`. `.env` exists, key names = R2_* only (no Supabase keys yet). `.gitignore:16-18` ignores `.env*` except `.env.example`.
- [AC4] `README.md:14-23` Develop block = pnpm commands only; `:25` "Copy `.env.example` to `.env` and fill in the Supabase project values" is the only Supabase line; `:46` layout row for `supabase/`. No CLI-install, `supabase start`, or Google-credentials step.
- [AC4] Google provider: `config.toml` has an `[auth.external.apple]` block (`:317-330`, `secret = "env(SUPABASE_AUTH_EXTERNAL_APPLE_SECRET)"`) but no `[auth.external.google]`; email provider present (`:214-229`). Provider enabling = S2/AC3.
- [CI] No impact: `.github/workflows/ci.yml:1-26` runs install/check/lint/test/build, no env/secrets; `supabase/` is already ignored by prettier (`.prettierignore:17`) and eslint (`eslint.config.js:13`); S1 adds no deps and no src code.
- [docs] Supabase planned, not built: `NOTES.md:94` (Postgres + RLS, Google + magic link, pg_cron→Edge Function), `docs/architecture.md:31,43` (Ledger/Catalog own all Supabase calls). No table/RLS schema in docs (tables are CHY-23, out of scope).
- Web (supabase.com/pricing, billing docs): Free = 2 active projects/org, 500 MB DB/project, "Free projects are paused after 1 week of inactivity", no backups. Relevant to the hosted dev project (S2), not S1.

## Answered here (no human needed)
- [AC2] Q: do keys need adding? A: no new `src/` reads, so the diff is vacuously satisfied; keep `PUBLIC_SUPABASE_URL` + key already listed.
- [AC1] Q: CLI via brew or devDependency? A: global brew (README says so). Reason: a devDep changes `pnpm-lock.yaml` and CI install for a tool CI never runs.
- [AC1] Q: add `seed.sql`/migrations to make start pass? A: no; empty is valid, tables are CHY-23. Re-check on Loc's run.
- [AC4] Q: CI needs Supabase env? A: no (see CI fact).
- [AC1] Q: S1 changes S2's provider config? A: no; Google/magic-link enabling and `site_url` (`config.toml:154`, port 3000 vs dev 5173) belong to S2.

## Tasks (changes, no decision)
- [AC1] `config.toml` ports → chaiyo block 563xx (Q1): api 56321, db 56322, shadow 56320, studio 56323, inbucket 56324, analytics 56327, pooler 56329. Edge `inspector_port` 8083 (`:376`) is free and stays; `smtp_port`/`pop3_port` (`:104-105`) are commented out, nothing to change.
- [AC2] `.env.example:3` rename `PUBLIC_SUPABASE_ANON_KEY` → `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Q2).
- [AC4] README Develop: install CLI (brew), Docker running, `supabase start`, copy `.env.example` → `.env`, paste printed Project URL + Publishable key. Local setup only (Q3).
- [AC1] Execute runs `supabase start` itself (Docker is already up) with the new ports; it never touches Mantica containers. Loc tasks for S1: none.
- [CHORE] Loc tasks (outward, S2 only): Google OAuth client, hosted Supabase project, keys into `.env`.

## Answered here (children of the rulings)
- [AC1] Port block: the director's 553xx is NOT usable as-is — `lsof` shows a `dotnet` process (PID 77680) listening on 127.0.0.1:55323 and :55324, which are exactly studio + inbucket there. 563xx has 0 listeners and keeps the same offsets (…20/21/22/23/24/27/29). Reason: same intent (own block beside Mantica's 543xx), no clash.
- [AC1] AC wording drift: AC1 says "anon key"; CLI 2.101 prints a Publishable key (and Secret). The Publishable line satisfies AC1. Not a question.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | clash with Mantica's running stack | A — chaiyo own port block (563xx, see Answered here) | Director ≥80% rule, 2026-10-27 |
| 1 | Q2 [AC2] | env name for the key | B — `PUBLIC_SUPABASE_PUBLISHABLE_KEY` (CLI prints Publishable; no src reader) | Director ≥80% rule, 2026-10-27 |
| 1 | Q3 [AC4] | Google env placeholders + README Google step in S1? | No — S2 owns them (AC3 owns Google; no `[auth.external.google]` block until S2, so S1 would document vars nothing reads); S2 extends the README | Director ≥80% rule, 2026-10-27 |

## Open — needs an answer before spec
None. Q1–Q3 resolved above and keep their numbers; frontier empty.

## Shared understanding
| Decision | Answer | Source |
|---|---|---|
| Local ports | own block 563xx (not 553xx: 55323/55324 taken by dotnet) | Q1 + port check |
| Key env name | `PUBLIC_SUPABASE_PUBLISHABLE_KEY`; AC1 "anon" = Publishable line | Q2 |
| Google in S1 | none; README covers local setup only, S2 extends | Q3 |
| CLI | global brew, no devDep | Answered here |
| `supabase start` | agent runs it in execute, Mantica untouched | Director |
| CI | unchanged | fact |
| Loc tasks S1 | none | Director |

## Locked (do not re-open)
- Auth providers = Google + email magic link, nothing else.
- `supabase/config.toml` and `.env.example` exist — audit, don't recreate.
- Learner tables + RLS (CHY-23) and login UI (CHY-26) out of scope.
