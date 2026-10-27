# CHY-1 S1 — verify

Fresh clone of stonghuuloc/chaiyo at 3265d02 (1 commit).

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | `git rev-list --count HEAD` → `1`; `git status --short` (clone) → empty; `git ls-files \| grep -E '(^\|/)(node_modules\|\.svelte-kit)/\|^\.env$\|^src/lib/paraglide/'` → empty (exit 1). 349 files / 27,092,046 bytes. |
| AC2 | ✅ | `git check-ignore -v node_modules/x/index.js` → `.gitignore:1:node_modules`; `.env` → `.gitignore:16:.env`; `src/lib/paraglide/m.js` → `.gitignore:25:src/lib/paraglide`; `.svelte-kit/output` → `.gitignore:8:/.svelte-kit`. Probe files created and deleted; root `.env` did not exist before. `git status --short` showed only the story-tool files (below). |
| AC7 | ✅ | `git ls-files -z \| grep -zv -e '^backlog/' -e '^\.stories/' \| xargs -0 rg -i -c '<retired names>'` → no output (0 matches). |

## Identity (LOCK)
- Author/committer: `stonghuuloc <43029756+stonghuuloc@users.noreply.github.com>`
- GitHub `verification`: `verified=true`, `reason=valid`
- Repo visibility: `PRIVATE`

## Residual risk
- (a) `git verify-commit HEAD` passes locally (`Good "git" signature for stonghuuloc@gmail.com`, ED25519). The signing principal is the gmail address, not the noreply author address; `~/.ssh/allowed_signers` has no noreply entry. Not a failure, but the author/signer identities differ.
- (b) Fresh-clone prototype image references: not checked in this run. Expected missing until S3 (R2), not verified.
- (c) Story-tool files `STATE.md`, `state.json`, `SUMMARY.md`, `VERIFY.md` are uncommitted and will ride the next commit.
