# CHY-1 S1 — spec
ACs: AC1, AC2, AC7  ·  Repo: github.com/stonghuuloc/chaiyo (private)  ·  rev 2

## Behaviour
- [AC1] The repo is on branch `main` with exactly 1 commit and a clean tree. Verified by:
  `git branch --show-current` → `main`; `git rev-list --count HEAD` → `1`; `git status --short` → no output.
- [AC1] `git ls-files` lists no path under `node_modules/`, `.env` (the file; `.env.example` stays allowed),
  `src/lib/paraglide/`, `.svelte-kit/`. Verified by the grep in the first test-contract bullet → no output.
- [AC1] These Q1–Q7 paths are ignored and absent from `git ls-files`: `assets/**/*.png`, `prototype/audio/`,
  `.impeccable/review/`, `.impeccable/mocks/`, `rr-session-*`, `prototype/logos/` (covers its `_work/`),
  `assets/cast-options/`, `prototype/lesson-images.html`, `scripts/__pycache__/`.
  Verified by: `git check-ignore -v <path>` prints a `.gitignore` rule for one real path of each, and the same grep → no output.
- [AC1] These are committed: `.stories/`, `.claude/skills/`, `.impeccable/design.json`, `.impeccable/questions/`,
  `assets/ukai.ttc`. Verified by: `git ls-files --error-unmatch assets/ukai.ttc .impeccable/design.json` → exit 0, and
  `git ls-files .stories .claude/skills .impeccable/questions | wc -l` → greater than 0.
- [AC1] Committed bytes ≤ 30 MB (measured ~28.5 MB with these ignores). Verified by:
  `git ls-files -z | xargs -0 stat -f %z | awk '{s+=$1} END {print s}'` → ≤ 30000000.
- [AC2] After the commit, creating `node_modules/x/index.js`, `.env`, `src/lib/paraglide/m.js` and `.svelte-kit/output`
  leaves `git status --short` empty. Verified by: create the 4 files, run it → no output; then
  `git check-ignore -v node_modules/x/index.js .env src/lib/paraglide/m.js .svelte-kit/output` → 4 lines, one rule each.
- [AC7] Before the commit is made, the staged set has no retired cast name outside `backlog/` and `.stories/`.
  Verified by: `git add -A`, then
  `git ls-files | grep -v -e '^backlog/' -e '^\.stories/' | xargs rg -i 'chiikawa|hachiware|usagi|momonga|nagano'`
  → exit 1, no output. This includes `.impeccable/design.json`.
- [AC7] Live references become the cast v2 species, following `NOTES.md:79-84`: Chiikawa → baby panda,
  Hachiware → red panda, Usagi → sika deer fawn, Momonga → takin calf. Machine ids use the `assets/cast/` file names:
  `panda`, `redpanda`, `fawn`, `takin`. Verified by: the zero-match search above, plus `rg -w 'redpanda|fawn|takin|panda' docs/content-schema.md` → at least one match.
- [AC7] `NOTES.md` has its "Was" column deleted (the table keeps Role and Character). Verified by:
  `rg -n '^\| Role \| Character \|$' NOTES.md` → 1 line; `rg -n '\| Was \|' NOTES.md` → no output.
- [AC7] The 5 style lines (`NOTES.md:51,67,77`, `PRODUCT.md:45`, `design.tokens.json:504`) no longer say
  "Chiikawa/Nagano chibi style". Each now uses the `gen-result-art.sh:7` wording: "cute chibi style with thin dark
  brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals". Verified by:
  `rg -c 'cute chibi style with thin dark brown outlines' NOTES.md PRODUCT.md design.tokens.json` → each file ≥ 1.
- [AC7] `prototype/talk/seedance.sh` names `redpanda-closed.png` (an existing file) in place of `chiikawa-closed.png`.
  Verified by: `test -e prototype/talk/redpanda-closed.png` → exit 0; `rg 'chiikawa' prototype/talk/seedance.sh` → no output.
- [AC7] No id that `prototype/*.js` reads is renamed, and no edited prototype page loses an image. Today
  `rg -il 'chiikawa|hachiware|usagi|momonga' prototype --glob '*.js'` → no output, so the prototype hits are text,
  alt text and wireframe labels only. Verified by: that command still → no output after the scrub, and for each edited
  `prototype/*.html`: `rg -o 'src="([^"#]+)"' -r '$1' <file> | grep -v '^data:' | while read p; do test -e "prototype/$p" || echo "MISSING $p"; done`
  → no output.
- [AC7] `NOTES.md:67` (the franchise sources line) is deleted, `NOTES.md:47` lists only the 4 creatures, and the Kuri-manju and Rakko rows (`:61-62`) are deleted. Verified by the side-character `rg` below → no output, and `rg -c 'Sources: Wikipedia' NOTES.md` → no output.
- [LOCK] The repo goes public at the end of S2 (after S3), not in S1; generated PNG + mp3 live on R2, not in git (Loc, 2026-10-26).
- [LOCK] Personal GitHub only (Loc, 2026-10-26): the first commit is authored, committed and signed as `stonghuuloc` (noreply email, `~/.ssh/id_ed25519`), never the CoverGo work identity or key. Verified by the first two [LOCK] bullets in the test contract.
- [LOCK] The private repo `stonghuuloc/chaiyo` is created and `main` is pushed in S1; `origin` is `git@stonghuuloc:stonghuuloc/chaiyo.git`. Verified by the remote, visibility and push bullets in the test contract.
- [LOCK] The Chiikawa cast is retired; the app uses the cast v2 creature family (Loc, 2026-10-26).
- [CHORE] `scripts/__pycache__/` is added to `.gitignore` (append-only; no existing line changes). Verified by:
  `git check-ignore -v scripts/__pycache__/x.pyc` → prints a `.gitignore` rule for it.

## Not this slice
- AC3, AC4 (CI workflow, green on main) and AC5 (CodeRabbit) → S2. The flip to public visibility → end of S2, after S3.
- AC6 (upload ignored PNG + mp3 to R2, pull script) → S3. After S1 a fresh clone of the prototype has missing images
  until S3 ships; that is expected.
- Editing `backlog/` or `.stories/` text for the retired cast names (excluded from the AC7 search by Q10).
- Regenerating art or audio, or changing `scripts/gen-image.py`'s default reference image.

## Seam
`.gitignore` (appended rules) + the first signed `git commit` on `main`, pushed to the private `origin`.

## Test contract
- [AC1] Shell: `git branch --show-current` → `main`; `git rev-list --count HEAD` → `1`; `git status --short` → no output.
- [AC1] Shell: `git ls-files | grep -E '^(node_modules/|src/lib/paraglide/|\.svelte-kit/|prototype/audio/|prototype/logos/|assets/cast-options/|\.impeccable/(review|mocks)/|scripts/__pycache__/|rr-session-|prototype/lesson-images\.html$)|(^|/)\.env$|^assets/.*\.png$'` → no output.
- [AC1] Shell: committed bytes command above → ≤ 30000000; `git ls-files --error-unmatch assets/ukai.ttc` → exit 0.
- [AC2] Shell: create the 4 paths, `git status --short` → no output; `git check-ignore -v` on them → 4 lines.
- [AC7] Shell: the zero-match `rg` over `git ls-files` minus `backlog/` and `.stories/` → exit 1 before the commit.
- [AC7] Shell: `rg -il 'chiikawa|hachiware|usagi|momonga' prototype --glob '*.js'` → no output; the MISSING loop → no output.
- [AC7] Shell: `test -e prototype/talk/redpanda-closed.png` → exit 0; `rg -c 'cute chibi style with thin dark brown outlines'` → ≥ 1 in `NOTES.md`, `PRODUCT.md`, `design.tokens.json`.
- [LOCK] Author and committer email of the commit = `43029756+stonghuuloc@users.noreply.github.com`: `git log -1 --format='%ae %ce'` → that address twice.
- [LOCK] The commit is signed with the personal key: `git cat-file commit HEAD | rg -c 'BEGIN SSH SIGNATURE'` → `1`, and after the push `gh api repos/stonghuuloc/chaiyo/commits/$(git rev-parse HEAD) --jq .commit.verification.verified` → `true`.
- [LOCK] Remote is the personal alias: `git remote get-url origin` → `git@stonghuuloc:stonghuuloc/chaiyo.git`; `ssh -T git@stonghuuloc` → "Hi stonghuuloc!".
- [LOCK] The repo is PRIVATE at the end of S1: `gh repo view stonghuuloc/chaiyo --json visibility --jq .visibility` → `PRIVATE`.
- [LOCK] The push landed: `git ls-remote origin main | awk '{print $1}'` → equals `git rev-parse HEAD`.
- [AC7] Side characters are dropped: `rg -i 'kuri-manju|rakko|shisa|\bkani\b'` over the same staged set (minus `backlog/`, `.stories/`) → exit 1, no output.

## Open assumptions
None. Note: `~/.ssh/allowed_signers` lists only `stonghuuloc@gmail.com` and `loc.tong@covergo.com`, not the noreply address, so local `git verify-commit` cannot match a principal; the signature proof therefore uses GitHub's verification (`verified: true`).
