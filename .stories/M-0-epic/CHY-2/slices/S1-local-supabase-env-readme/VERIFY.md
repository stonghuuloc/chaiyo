# CHY-2 S1 — verify
Run on `main` @ `e7d3163` (PR #5 merge), 2026-10-28. AC3 belongs to S2 and is not verdicted here.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | `supabase start` → `exit=0` (49 s). Output has Project URL `http://127.0.0.1:56321`, `Publishable │ sb_publishable_…`, Studio `http://127.0.0.1:56323`. Studio `curl -L` → 307 → `/project/default`, final 200, 12663 bytes. `GET /auth/v1/health` → 200 `{"name":"GoTrue",…,"version":"v2.188.1"}`. `GET /rest/v1/` → 200. 10 `_chaiyo` containers up. `supabase stop` → `exit=0`, 0 `_chaiyo` left. |
| AC2 | ✅ | 6 key names in `.env.example`: `PUBLIC_SUPABASE_URL PUBLIC_SUPABASE_PUBLISHABLE_KEY R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET`. `rg -c '^[A-Z0-9_]+=.+' .env.example` → no match (0 values). `rg 'PUBLIC_\|\$env\|import\.meta\.env\|process\.env' src vite.config.ts` → no match (0 readers). |
| AC4 | ✅ | README `## Develop` has 5 numbered steps; each command is runnable as written (see walk-through). `rg -c 'Supabase project values' README.md` → no match. `ci` on `e7d3163` → `completed success` (`gh api repos/stonghuuloc/chaiyo/commits/e7d3163/check-runs`). |

## Commands run

AC1, from repo root:
```
docker ps --format '{{.Names}}' | grep -c _Mantica     # 0 (before)
supabase start > /tmp/chy2-start.log; echo $?            # 0
grep -E 'Project URL|sb_publishable_|Studio' /tmp/chy2-start.log | sed -E 's/(sb_publishable_).*/\1…/'
  │ Studio  │ http://127.0.0.1:56323     │
  │ Project URL    │ http://127.0.0.1:56321              │
  │ Publishable │ sb_publishable_…
curl -s -L -o /dev/null -w '%{http_code} %{url_effective}' http://127.0.0.1:56323   # 200 …/project/default
supabase stop; echo $?                                   # 0
docker ps --format '{{.Names}}' | grep -c _chaiyo        # 0 (after)
docker ps --format '{{.Names}}' | grep -c _Mantica       # 0 (after)
```
Mantica stayed stopped and on hold: 0 `_Mantica` containers before and after. It was never started.
Port block in `supabase/config.toml`: api 56321, db 56322, shadow 56320, studio 56323, inbucket 56324, analytics 56327, pooler 56329. `inspector_port = 8083` is untouched.

## AC4 walk-through (fresh-clone order)
| # | README step | Result |
|---|---|---|
| 0 | `pnpm install` … `pnpm build` block | commands exist as scripts; not re-run (not an AC4 claim) |
| 1 | `brew install supabase/tap/supabase` | CLI v2.101.0 present on this machine; install line is the standard tap command |
| 2 | Start Docker | Docker was up (`docker ps` worked) |
| 3 | `supabase start` | exit 0; ports 56321/56323 match the README text |
| 4 | `cp .env.example .env` | file exists, 6 empty keys |
| 5 | paste Project URL + Publishable key into the 2 named keys | both printed by step 3; key names match `.env.example` |

No Google step appears in the README. That is S2's job (SPEC Q3).

## Deviations noted (from SUMMARY.md)
- `[analytics] enabled = false` (`config.toml:384`). `start` still exits 0. Studio, auth and REST answer with analytics off. No AC text requires analytics.
- `supabase/.gitignore` added (`.branches`, `.temp`, dotenvx files). No AC impact.

## Not AC
- `supabase/.temp/cli-latest` is tracked (`git ls-files supabase/.temp`) while `.temp` is now gitignored. `git status --short` after start and stop was clean. No AC reads it.
- The AC1 text says "anon key". The CLI 2.101 prints a Publishable key instead. SPEC Q2 already ruled that the Publishable line is AC1's key.

## Residual risk
- Studio check is HTTP-level (200, 12663 bytes). No browser render was done.
- The first `supabase start` on a clean Docker host pulls images. Timing was not measured.
