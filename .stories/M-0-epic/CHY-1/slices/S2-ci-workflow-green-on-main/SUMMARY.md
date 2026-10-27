# CHY-1 S2 — summary
ACs: AC3, AC4, AC5 · executed PLAN rev 1 · PRs #1 and #3 merged (main HEAD 85d71b7)

## What changed
- [AC3] `.github/workflows/ci.yml` (edcfaa8): job `ci` on `push` + `pull_request`; checkout v7, pnpm/action-setup v6 (`version: 10`), setup-node v7 (node 24, `cache: pnpm`), `pnpm install --frozen-lockfile`, then check, lint, test, build. No secrets/env.
- [AC4] `.prettierignore:27` `/project.inlang/.meta.json` so `pnpm lint` passes in a clean clone.
- [AC5] `.coderabbit.yaml` (PR #3): `reviews.path_filters` excluding `content/**`, `.stories/**`, `backlog/**`.
- [AC5] Settings: repo public; `main` protected (PR required, 0 approvals, required check `ci`, `enforce_admins` true, no force-push/deletion).
- [CHORE] Backlog `chy-1.2` filename AC3AC4 → AC3-AC5; body line 18 → `AC3,AC4,AC5`.

## Verified
- [AC3] PR #1: runs 40467988599 (push) + 40467995717 (pull_request) both success; logs show node v24.21.0, pnpm 10.34.9, 4 scripts in order. Throwaway PR #2 (run 40468211449): `pnpm check` failure, lint/test/build skipped; closed, branch deleted.
- [AC4] Clean clone of `CHY-1`: install 0, check 0, lint 0, test 0, build 0. Merge: `ci success` on main HEAD (now 85d71b7, run 40489698255).
- [AC5] Protection GET `[["ci"],true,0,false,false]`; direct push of an empty commit to `main` rejected ("protected branch hook declined").
- [AC5] PR #3: `ci` green (runs 40487634031, 40487653499); `coderabbitai[bot]` comment https://github.com/stonghuuloc/chaiyo/pull/3#issuecomment-6439585719, check `CodeRabbit` pass; "No actionable comments"; `.stories/**` files listed as excluded.
- [AC5] Pre-flip scans: `.env` tracked 0; R2 key + secret hits in history 0.

## Deviations
- [AC5] Gmail: PR #1's GitHub merge commit b531abb carried `stonghuuloc@gmail.com`; main was rewritten to noreply (dc94c91, tree identical, force-with-lease). Loc then OK'd the gmail as already public, so PR #3's merge 85d71b7 keeps it; orphaned b531abb stays fetchable by SHA.
- [AC5] `gh repo edit --accept-visibility-change-consequences` is unsupported by this gh; plain `--visibility public` worked.
- [AC5] CodeRabbit needed a reinstall by Loc, then a retrigger commit (0d09778) + `@coderabbitai review`; bot appeared ~40 s later.
- [AC5] `@coderabbitai configuration` never replied in ~3 min; filter proof is the review's own "excluded by `!.stories/**`" list and walkthrough text (all 3 filters named). Merged anyway.
- [AC3] T2 job-key check `rg -c '^  [a-z]+:$'` returned 2 (also matches `push:`); only job is `ci`.

## Open
- [CHORE] `STATE.md` / `state.json` dirty on local `main` (set after PR #3); uncommitted, and `main` is protected, so they need a PR.
- [AC5] Gmail on b531abb/85d71b7 is public; only GitHub Support can purge the orphan.
