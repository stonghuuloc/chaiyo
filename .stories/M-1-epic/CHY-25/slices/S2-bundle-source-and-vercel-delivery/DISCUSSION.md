# CHY-25 S2 — discussion
ACs: AC1  ·  rev 1  ·  2026-11-06

## Decisions made alone (80% rule)
| # | Decision | Alternatives rejected | Confidence | Cost if wrong |
|---|---|---|---|---|
| D3 [AC1] | The production build is `python3 -m pip install --quiet -r scripts/requirements-fonts.txt && bash scripts/build-content.sh && pnpm build` in `vercel.json` `buildCommand`. | a CI artifact of the fonts; committed subset fonts; no pip step | 80% | if the Vercel image has no pip, the first team-authored deploy fails (Q2); the fallback is the CI artifact |

## Review round — Loc, 2026-11-06 (resolved)
| Item | Finding | Resolution | Source |
|---|---|---|---|
| I2 | `/fonts/lessons/*` was `immutable` although font names carry no hash | revalidated header (`public, max-age=0, must-revalidate`); `immutable` stays only under `/content/<64 hex>/` | Loc |
| I3 [AC1] | CI imported only the fixture while production builds real content | `.github/workflows/ci.yml` gains `bash scripts/build-content.sh` before `pnpm build` | Loc |
| I4 | the preview proofs and Q2 cannot run on agent commits because Vercel blocks non-team authors | proof is the local build plus the first team-authored deploy; Q2 and the S2 verify say so | Loc |
| nit | `vite.config.ts:16-17` was the wrong range | `:4,25` (adapter import and `adapter()`) | Loc |
