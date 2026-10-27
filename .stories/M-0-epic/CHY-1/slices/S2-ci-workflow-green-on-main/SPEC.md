# CHY-1 S2 — spec
ACs: AC3, AC4, AC5  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC3] A workflow in `.github/workflows/` triggers on `push` (any branch) and on `pull_request`. Verified by: opening a PR from branch `CHY-1` shows one run for the `push` event and one for the `pull_request` event, both listed in the Actions tab.
- [AC3] The workflow has exactly one job, named `ci`, whose steps run `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` in that order, after `pnpm install --frozen-lockfile` on node 24 / pnpm 10 (same majors as local: v24.19.0, 10.24.0). It runs no other package script (locked). Verified by: the run log lists those 4 script invocations in order and the install line `--frozen-lockfile`; `node -v` prints `v24.*`, `pnpm -v` prints `10.*`.
- [AC3] The job needs no secrets and no `.env`: the workflow file references 0 `secrets.*` and 0 `env:` entries for `PUBLIC_*`/`R2_*`. Verified by: `rg -c 'secrets\.|PUBLIC_|R2_' .github/workflows` finds 0 matches.
- [AC3] A step that fails turns the job red: a PR that breaks `pnpm check` (e.g. a deliberate type error, never merged) shows `ci` failed and the later steps skipped. Verified by: that throwaway PR's check list.
- [AC4] In a fresh clone of the PR head, with `.env` absent and ignored assets absent, `pnpm install --frozen-lockfile` then `env -i PATH HOME pnpm check`, `lint`, `test`, `build` each exit 0. Verified by: 4 exit codes of 0 in a `/tmp` clone (today: lint exits 1, others 0).
- [AC4] `pnpm lint` passes in a clean clone because `.prettierignore` lists `project.inlang/.meta.json` (paraglide-generated, 2-space JSON). Verified by: `prettier --check .` prints "All matched files use Prettier code style!" in the clean clone after `check` has regenerated the file.
- [AC4] `pnpm test` exits 0 with 0 test files via the existing `--passWithNoTests` (Q1-A). Verified by: `test` step green, log shows no test files; `package.json` `test` script unchanged.
- [AC4] After the S2 PR merges, the `push` run on the merge commit at `main` HEAD ends with conclusion `success`, and the commit shows a green check. Verified by: `gh api repos/stonghuuloc/chaiyo/commits/main/check-runs` → check `ci`, conclusion `success`, head_sha = `main` HEAD.
- [AC5] `.coderabbit.yaml` at repo root sets `reviews.path_filters` to exclude `content/**`, `.stories/**`, `backlog/**` and nothing else (Q4-B; 197 of 358 files excluded). Verified by: file content, and `@coderabbitai configuration` on the proof PR echoing those 3 filters.
- [AC5] Order of outward steps, each gated on the previous: (1) S2 PR merged with `ci` green on `main`; (2) Loc flips the repo public; (3) branch protection on `main` is enabled; (4) Loc installs the CodeRabbit GitHub App on `stonghuuloc/chaiyo`; (5) the proof PR is opened (Q3-A). Verified by: GitHub timestamps — repo `private: false` before the protection rule, App installation before the proof PR's creation.
- [AC5] Branch protection on `main`: PR required (0 approvals — sole author), required status check = `ci`, `enforce_admins` true, force-push and deletion disallowed. Verified by: `gh api repos/stonghuuloc/chaiyo/branches/main/protection` returns those values; a direct push to `main` as Loc is rejected ("protected branch").
- [AC5] The proof PR contains only `.coderabbit.yaml`, `ci` is green on it, it merges through the protection rule, and CodeRabbit posts ≥1 review or summary comment authored by `coderabbitai[bot]` on it. Verified by: `gh api repos/stonghuuloc/chaiyo/pulls/<n>/reviews` or `issues/<n>/comments` lists `coderabbitai[bot]`.
- [AC5] CodeRabbit is not a required check; a PR without its review can still merge. Verified by: protection contexts = `["ci"]` only.
- [CHORE] Rename `backlog/tasks/chy-1.2 - …AC3AC4….md` to AC3-AC5 in the filename (scope is AC3, AC4, AC5). Verified by: `ls backlog/tasks | rg 'chy-1.2'` shows `AC3-AC5`.
- [LOCK] CI runs exactly `pnpm check`, `lint`, `test`, `build` on push + PR (STORY.md).
- [LOCK] Only the repo is public; generated PNG + mp3 stay in private R2 (STORY.md).
- [LOCK] Personal GitHub only: stonghuuloc, ssh alias, noreply author email (STORY.md).
- [LOCK] Repo private until the end of S2 (STORY.md); the flip is step (2) above, after CI is green on `main`.
- [CHORE] Loc-only outward actions: flip public, install the CodeRabbit App. Execute stops and asks at each; agents never do them.

## Not this slice
- Real unit tests → CHY-3/4 (Q1-A). Deploy (Vercel) pipeline (STORY out of scope). New package scripts.
- AC1/AC2/AC7 → S1 (done). AC6 R2 upload/pull → S3 (done); CI never calls `assets:pull`.
- Caching tuning, matrix builds, fork-PR hardening beyond GitHub defaults.
- CodeRabbit review of the S2 PR itself (repo is private then).

## Seam
`.github/workflows/` (one file), `.coderabbit.yaml`, `.prettierignore` line, backlog filename; branch protection and public flip are GitHub settings, not repo files.

## Test contract
- [AC3] Open the S2 PR: Actions shows push + pull_request runs of one job `ci`; log shows install `--frozen-lockfile` then check, lint, test, build in order; `rg` finds 0 secrets/env refs in the workflow.
- [AC3] Throwaway PR with a type error: `ci` red, never merged, closed.
- [AC4] `/tmp` fresh clone of PR head, no `.env`: install + 4 scripts under `env -i` → 4 exit codes of 0.
- [AC4] After merge, `gh api …/commits/main/check-runs` shows `ci` success on `main` HEAD sha.
- [AC5] `.coderabbit.yaml` has the 3 `!` path_filters; `@coderabbitai configuration` on the proof PR echoes them.
- [AC5] Protection API read returns PR required, contexts `["ci"]`, `enforce_admins` true; direct-push attempt by Loc is rejected.
- [AC5] Proof PR: `ci` green, merged via PR, `coderabbitai[bot]` review/comment present; public flip and App install precede PR creation by timestamp.

## Open assumptions
- [AC5] Assumed 0 required approvals (sole author; GitHub blocks self-approval, so 1 approval would deadlock every PR). If wrong, cost = Loc cannot merge his own PRs; no number beyond that, no Q-block since the lock is solo-author.
- [AC5] Assumed `enforce_admins` true per round-1 child answer in DISCUSSION.md (Answered here). If wrong, one setting flips; red CI could then be force-merged by Loc.
- [AC3] Assumed `push` on any branch plus `pull_request` double-runs on PR branches (2 runs per PR push, ~2 min each, free while private under 2,000 min/month and unlimited public). If wrong, the fix is restricting `push` to `main`; AC3 text ("push and PR") reads both.
