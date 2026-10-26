# CHY-1 S1 — discussion
ACs: AC1, AC2, AC7

## Current behaviour (verified, with anchors)
- [AC1] No `.git` in `chaiyo/` or any parent. git 2.53.0, `init.defaultBranch` unset → `git init` makes `master`; S2 AC4 targets `main`. Task: init on `main`.
- [AC2] `.gitignore:1` `node_modules`, `:18-19` `.env` + `.env.*` (keeps `.env.example`), `:27` `src/lib/paraglide`, `:8` `/.svelte-kit` — all 4 AC2 paths already covered. Task: prove with `git check-ignore` after init.
- [AC1] Not ignored today: `scripts/__pycache__/` (Python bytecode). Task: ignore it — regenerable junk, no decision.
- [AC1] Tree minus node_modules: 2,588 files, ~433 MB. PNG 338 MB · mp3 21 MB · `assets/ukai.ttc` 17 MB (largest file; GitHub warns at 50 MB, rejects at 100 MB).
- [AC1] `src/`, `static/`, `vite.config.ts` reference nothing under `assets/`; only `prototype/*.html|js` do (`../assets/home`, `words`, …).
- [AC1] `git lfs` not installed.
- [AC1] Global git identity is WORK: `user.name loc-tong-covergo`, `user.email loc.tong@covergo.com`, `user.signingkey` = `id_loctongcovergo.pub` (signed via 1Password `gpg.ssh.program op-ssh-sign`, `commit.gpgsign true`, `gpg.format ssh`); no `includeIf`. Task: set repo-local personal identity before the first commit.
- [AC1] `~/.ssh/config`: Host `stonghuuloc` → `~/.ssh/id_ed25519` (`ssh -T git@stonghuuloc` → "Hi stonghuuloc!"); Host `github.com` → `id_loctongcovergo` (work, "Hi loc-tong-covergo!").
- [AC1] `gh` is logged in as `stonghuuloc` (id 43029756, keyring, ssh protocol); `GH_TOKEN`/`GITHUB_TOKEN` env count 0. `id_ed25519` is registered as a SIGNING key on `stonghuuloc` ("SSH Key stonghuuloc").
- [AC7] 24 committed files / 88 lines name the retired cast: 71 live references, 6 history (`NOTES.md:75-86` "Was" column), 5 style lines (`NOTES.md:51,67,77`, `PRODUCT.md:45`, `design.tokens.json:504`), 4 missing-file refs (`prototype/talk/seedance.sh:11,32-34`), 2 story-record self-refs. Task: live refs → v2 species per `NOTES.md:79-84` (Chiikawa→baby panda, Hachiware→red panda, Usagi→sika deer fawn, Momonga→takin calf); `seedance.sh` → existing `redpanda-closed.png`; `.impeccable/design.json` (2 hits) included.
- [AC7] Correction: all art was regenerated with cast v2 on 2026-10-23 (`NOTES.md:86`); the earlier "231 MB Chiikawa-derived" estimate was wrong. Only `lesson-images.html` + `.impeccable/mocks/` held old-cast images (ignored by Q7).

## Answered here (no human needed)
- [AC1] Q: does `.gitignore` need rewriting? A: no — append-only; every AC2 path is already there.
- [AC1] Q: GitHub remote in this slice? A: superseded by Q13 — the private repo is created and pushed in S1; only the public flip, CI and CodeRabbit stay in S2.
- [AC1] Q: why would art be in the repo at all? A: `src/`, `static/`, `vite.config.ts` read 0 files from `assets/`. Only the prototype (15 `../assets/` paths) and the generators (`gen-result-art.sh:16-89` writes, `build-lesson-media.py:48` reads `ukai.ttc`) use it. Production audio is already planned on R2 (CHY-15, `docs/architecture.md:28-33`); no doc says where lesson images are served.
- [AC1] Q: can Supabase Storage hold it? A: yes but worst fit — Free: 1 GB storage, 5 GB egress/month, project pauses after 1 week idle (supabase.com/pricing). R2 free: 10 GB, egress $0 (developers.cloudflare.com/r2/pricing).

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q2 | Commit `.impeccable/review/` screenshots? | A — ignore `review/` only (7 MB committed) | Loc, 2026-10-26 |
| 1 | Q3 | Commit scratch run logs? | A — ignore `rr-session-*` and `prototype/logos/*/_work/` | Loc, 2026-10-26 |
| 1 | Q4 | Commit rejected design explorations? | B — ignore `assets/cast-options/` and `prototype/logos/` | Loc, 2026-10-26 |
| 1 | Q5 | Commit `.stories/` and `.claude/skills/`? | A — commit both (76 KB) | Loc, 2026-10-26 |
| 2 | Q1 | Commit generated PNG + mp3? | B — ignore `assets/**/*.png` + `prototype/audio`, store on R2 | Loc, 2026-10-26 |
| 2 | Q6 | Repo public? | B — public | Loc, 2026-10-26 |
| 3 | Q7 | Keep `prototype/lesson-images.html` + `.impeccable/mocks/` out of the public repo? | A — ignore both (supersedes Q2's mocks part) | Loc, 2026-10-26 |
| 3 | Q8 | Who uploads ignored art + audio to R2? | A — AC6 on CHY-1, new slice S3, before the public push | Loc, 2026-10-26 |
| 3 | Q9 | Scrub old cast names from committed text? | B — scrub in S1 before the first commit, covered by new AC7 | Loc, 2026-10-26 |
| 4 | Q10 | AC7 search also covers story records + NOTES.md "Was" history? | A — AC7 search skips `backlog/` + `.stories/`; delete NOTES.md "Was" column | Loc, 2026-10-26 |
| 4 | Q11 | Reword or delete the 5 "Chiikawa/Nagano chibi style" lines? | A — replace with the `gen-result-art.sh:7` wording | Loc, 2026-10-26 |
| 5 | Q12 | Keep side characters (Kuri-manju, Rakko, Shisa, Kani) in docs? | A — drop; 4 creatures only (`NOTES.md:47` clause + rows `:61-62` deleted; `NOTES.md:67` sources line deleted) | Loc, 2026-10-26 |
| 5 | Q13 | When is the GitHub repo created / public? | Created PRIVATE in S1 and pushed in S1; made public at the end of S2 (after S3). Supersedes Q6's timing and the "remote belongs to S2" answer. | Loc, 2026-10-26 |
| 5 | Q14 | Which GitHub identity? | `stonghuuloc` / `43029756+stonghuuloc@users.noreply.github.com`, signed with `~/.ssh/id_ed25519.pub`, remote `git@stonghuuloc:stonghuuloc/chaiyo.git` (never the work `github.com` alias / work key) | Loc, 2026-10-26 |

## Open — needs an answer before spec
None open.

## Locked (do not re-open)
- CI runs exactly `pnpm check`, `lint`, `test`, `build` (S2 territory; noted only so S1 commits nothing CI can't build).
- Chiikawa cast is retired; the app uses a new original creature family (Loc, 2026-10-26).
