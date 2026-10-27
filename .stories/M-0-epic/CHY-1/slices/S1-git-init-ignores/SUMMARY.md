# CHY-1 S1 — summary
ACs: AC1, AC2, AC7  ·  Spec rev 2  ·  Plan rev 2  ·  executed 2026-10-26

## Result
- Commit: `3265d022a3c6b330c1d6c35c98f6cff6823df1d4` (`3265d02`) on `main`, the only commit (`git rev-list --count HEAD` → 1).
- Repo: https://github.com/stonghuuloc/chaiyo — visibility `PRIVATE`; `git ls-remote origin main` equals local HEAD.
- Author and committer: `43029756+stonghuuloc@users.noreply.github.com`; 1 `BEGIN SSH SIGNATURE`; GitHub `verification.verified` = `true` (reason `valid`).
- Committed: 349 files, 27,092,046 bytes (limit 30,000,000).

## Tasks
- [AC1] T0 snapshot of 14 files to `/tmp/chy1-s1-backup/touched.tar` — 14 entries.
- [AC1] T1 `git init -b main`, repo-local identity, signing probe on a throwaway repo — probe passed, 0 commits at that point.
- [AC1] T1b `gh repo create stonghuuloc/chaiyo --private`, `origin` = `git@stonghuuloc:stonghuuloc/chaiyo.git` — PRIVATE, `Hi stonghuuloc!`.
- [AC1] T2 9 ignore rules appended after `.gitignore:26` — 9 `check-ignore` lines; `assets/ukai.ttc` and `.env.example` not ignored.
- [AC7] T3 docs scrub (`NOTES.md`, `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`, `docs/screens.md`, `docs/content-schema.md`) — done by the scrub worker; zero-match search clean.
- [AC7] T4 `design.tokens.json:504`, `.impeccable/design.json` — both pass `python3 -m json.tool`.
- [AC7] T5 4 prototype HTML files — MISSING-src loop printed nothing; no `prototype/*.js` hits.
- [AC7] T6 `prototype/talk/seedance.sh` points at `redpanda-*` — `sh -n` rc 0 (script not run).
- [AC7] T7 zero-match search over `git ls-files` minus `backlog/` and `.stories/` — 0 files; exclusion grep empty; 27,092,046 bytes.
- [AC1] T8 signed commit and `git push -u origin main` — all checks above pass.
- [AC2] T9 4 probe paths — status 0 lines with probes present; `check-ignore -v` 4 lines (`.gitignore:1,16,25,8`); only T9-created files removed.

## Deviations
- `NOTES.md:86`: the "(was …)" notes were dropped during the scrub (they named the retired cast).
- Signing fallback (`gpg.ssh.program ssh-keygen`) was not needed; the global 1Password `op-ssh-sign` signed the probe.
- `~/.ssh/allowed_signers` has no entry for the noreply address, so local `git verify-commit` cannot match a principal. The proof is GitHub `verified: true`. The file was not edited.

## Leftovers
- `.stories/M-0-epic/CHY-1/STATE.md` and `state.json` have uncommitted changes, and this SUMMARY.md is untracked. None is committed, so AC1 (exactly 1 commit) holds until verify.
- S3: ignored PNG and mp3 are not on R2 yet, so a fresh clone of the prototype has missing images until S3 ships.
- S2: CI, CodeRabbit, and the public flip are still to do; the repo stays private until the end of S2.
- `scripts/gen-image.py:8` still defaults to the old `assets/ref/cast.png` (out of scope).
- `backlog/tasks/chy-1.2 …` filename and title still say AC3AC4 although S2 now carries AC5.
