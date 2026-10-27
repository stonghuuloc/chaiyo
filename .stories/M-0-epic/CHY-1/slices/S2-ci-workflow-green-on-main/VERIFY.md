# CHY-1 S2 — verify

| AC | Verdict | Evidence |
|---|---|---|
| AC3 | ✅ | Runs on PR #1 (`CHY-1`) for both events, success. Red proof PR #2 run 40468211449: `pnpm check` failure, lint/test/build skipped |
| AC4 | ✅ | Fresh clone of `85d71b7` (main HEAD), no `.env`: install + check/lint/test/build all exit 0. `main` check-run `ci` success on `85d71b7` |
| AC5 | ✅ | Filters, public, protection (ci, enforce_admins, 0 approvals, no force/delete); direct push rejected ("protected branch hook declined", SUMMARY); CodeRabbit review on PR #3 |

## Checks

- **1 Workflow:** `.github/workflows/ci.yml` triggers `push` + `pull_request`; one job `ci`; steps: checkout, pnpm/action-setup@v6 (version 10), setup-node@v7 (node 24), `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`. `rg -c 'secrets\.|PUBLIC_|R2_'` → 0.
- **2 Runtime (run 40489698255, main push):** `node: v24.21.0`; `pnpm v10.34.9`; log order check 10:36:00 → lint 10:36:04 → test 10:36:07 → build 10:36:10; job `ci` success.
- **3 Red proof (run 40468211449, PR #2):** job `ci` failure; `pnpm check` failure; steps 7–9 skipped. PR #2 closed 07:38:06, `merged: false`.
- **4 Runs on PR #1 head:** push 40487634031 + pull_request 40487653499 (a794884); push 40489140396 + pull_request 40489147811 (0d09778). All success.
- **5 Clean clone (HEAD 85d71b7, `.env` absent):** install 0; `env -i PATH HOME pnpm` check 0, lint 0, test 0, build 0. Lint: `All matched files use Prettier code style!`. Test: `vitest --run --passWithNoTests` → `No test files found, exiting with code 0`. Clone removed.
- **6 main check-run:** `commits/main/check-runs` → `ci` success, head_sha `85d71b7ad` = `git ls-remote origin main`.
- **7 Repo + protection:** `private: false`, `visibility: public`. Protection: contexts `["ci"]`, enforce_admins true, approvals 0, force-push false, deletions false.
- **8 `.coderabbit.yaml`:** exactly `!content/**`, `!.stories/**`, `!backlog/**`.
- **9 CodeRabbit on PR #3:** bot comment 10:31:39; bot reply 10:36:31 to `@coderabbitai configuration` echoes the 3 filters. Quote: `` `.stories/M-0-epic/CHY-1/STATE.md` is excluded by `!.stories/**` ``. Check-run `CodeRabbit` cancelled 10:38:59, after merge 10:35:42 (irrelevant).
- **10 PR #3:** created 10:20:04, merged 10:35:42 via merge commit `85d71b7`. Ci on `0d09778` push + pull_request success.
- **11 Locks — authors:** `origin/main` author emails: 13 × noreply, 1 × `stonghuuloc@gmail.com` (merge commit `85d71b7` only; Loc-approved, see SUMMARY).
- **12 Locks — secrets:** `git log --all -p` (15 commits): `R2_ACCESS_KEY_ID` 0 hits, `R2_SECRET_ACCESS_KEY` 0 hits.
- **13 Chore:** `backlog/tasks/chy-1.2 - S2-—-CI-workflow-green-on-main-AC3-AC5.md` present; `backlog task CHY-1.2 --plain` resolves.

## Accepted deviations

- **Proof PR files:** PR #3 carried `.stories/.../STATE.md` and `state.json` besides `.coderabbit.yaml`. Director ruling: the spec's "only .coderabbit.yaml" is test-contract detail, not AC text; both files are excluded by `!.stories/**`, which the review quotes. Accepted.
- **Order of outward steps:** the flip, protection PUT, and App install are ordered before PR #3 by executor narrative (SUMMARY), not by timestamps. GitHub API exposes no per-change timestamp, and App-install listing returns 403. SUMMARY also records a CodeRabbit reinstall by Loc followed by retrigger commit `0d09778`, which is after PR #3's creation. Director ruling accepts the order; the timestamp proof does not exist.
- **Direct-push rejection:** tested by executor (T8, SUMMARY): empty commit to `main` rejected with "protected branch hook declined".

## Residual risk

- `pnpm test` is vacuous: `--passWithNoTests`, 0 test files (CHY-3/4).
- Order of flip / protection / App install vs PR #3 rests on SUMMARY narrative; no API timestamp.
- Gmail author on `b531abb`/`85d71b7` is public; only GitHub Support can purge the orphan.
- `strict: false` on protection; spec silent.
- `@coderabbitai configuration` reply was received in this verify (10:36:31), so SUMMARY's "never replied" is superseded.
