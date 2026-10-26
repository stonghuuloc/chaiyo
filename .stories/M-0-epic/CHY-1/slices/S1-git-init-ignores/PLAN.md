# CHY-1 S1 — plan
ACs: AC1, AC2, AC7  ·  Spec rev 2  ·  Repo: github.com/stonghuuloc/chaiyo (private)  ·  Branch: main (first commit; no story branch possible before a repo exists)

Order matters: T0 snapshot → T1 init + identity + signing probe → T1b private repo + remote → T2 ignores → T3–T6 scrub → T7 zero-match → T8 commit + push → T9 AC2 proof.
NOTHING below has been executed. T1b is the first step that touches GitHub (creates a PRIVATE repo under `stonghuuloc`); the flip to public is S2.

## Anchors (verified 2026-10-26)
- `.gitignore` is 26 lines, ends with a newline. `:1` `node_modules`, `:8` `/.svelte-kit`, `:16` `.env`, `:17` `.env.*`,
  `:18` `!.env.example`, `:25` `src/lib/paraglide`, `:26` `project.inlang/cache/`. Append after `:26`.
  (DISCUSSION.md cites `:18-19`/`:27`/`:8`; the real lines are `:16-17`/`:25`/`:8` — only the rules matter.)
- No root `.env` exists (`ls .env*` → `.env.example` only). `prototype/talk/.env` exists (192 B, `ARK_API_KEY`), already
  matched by `.gitignore:16`. `.claude/skills/` = `grill-me grill-with-docs grilling`.
- Side-character hits (Kuri-manju, Rakko, Shisa, Kani), in-scope files: `NOTES.md:47` (clause), `NOTES.md:61` Kuri-manju row, `NOTES.md:62` Rakko row. No other file (checked outside `backlog/`/`.stories/` and the ignored paths).
- Identity facts: global git identity = work (`loc-tong-covergo`, `loc.tong@covergo.com`, `user.signingkey` = `id_loctongcovergo.pub`, 1Password `op-ssh-sign`, `commit.gpgsign true`, `gpg.format ssh`, no `includeIf`). `ssh -T git@stonghuuloc` → `Hi stonghuuloc!`; `gh` active account `stonghuuloc` (id 43029756); `id_ed25519` is a registered SIGNING key on `stonghuuloc`.
- Retired-cast hits, IN scope (13 files, 62 lines), `rg --hidden -ni 'chiikawa|hachiware|usagi|momonga|nagano'` minus the
  ignored paths, `backlog/`, `.stories/`:
  - `NOTES.md` 27: 47,50,51,53,57,58,59,60,64,66,67,75,77,81,82,83,84,86,105,111,117,118,125,126,146,151,156
  - `docs/content-schema.md` 12: 59,167,168,171,172,173,174,175,176,177,247,345
  - `prototype/wireframes-core-loop.html` 7: 124,142,174,230,399,456,492
  - `prototype/talk/seedance.sh` 4: 11,32,33,34
  - `DESIGN.md` 2: 123,244 · `PRODUCT.md` 2: 23,45 · `.impeccable/design.json` 2: 399,444
  - 1 each: `CONTEXT.md:170`, `docs/screens.md:94`, `design.tokens.json:504`, `prototype/home.html:153`,
    `prototype/talk-sample.html:9`, `prototype/palettes.html:21`
- Retired-cast hits, OUT of scope (Q10 excludes `backlog/` + `.stories/`): `backlog/tasks/` chy-60 26,39,41 · chy-32 45,46 ·
  chy-9 45 · chy-14 21,48,49,62 · chy-15 31,47,48 · chy-1 81 · chy-45 23 · chy-34 32 · chy-18 22,27,31,42,49,64 ·
  chy-33 22,44,60 (26 lines); `.stories/…/SPEC.md` 9 lines, `DISCUSSION.md` 4 lines.
- The 5 style lines, current text:
  - `NOTES.md:51` `2. Append: ". The characters must look exactly like the attached character lineup, drawn in the original Chiikawa manga style by Nagano with bold dark outlines and flat colours; Chiikawa has exactly two small round ears. Set them in …`
  - `NOTES.md:67` `Sources: Wikipedia "Chiikawa", chiikawa.miraheze.org Chiikawa (Character), fan guides (charmieandco, blippo). Researched 2026-10-21.`
  - `NOTES.md:77` `Loc: "can't go big with Chiikawa" → own cast, drawn in the Chiikawa/Nagano chibi style but different species. Reference: …`
  - `PRODUCT.md:45` `- Art: Chiikawa franchise characters (main cast Chiikawa, Momonga, Usagi, Hachiware) drawn in Nagano's manga style — bold dark outlines, flat colours — set in richly detailed, cozy storybook backgrounds with warm golden light. …`
  - `design.tokens.json:504` `"imageryStyle": "Chiikawa character art as the one rich, warm image per screen, cropped 3:2, with no text inside it; …"`
- `NOTES.md:79-84`:
  `| Role | Character | Was |` / `|---|---|---|` / `| cries, shy | baby panda | Chiikawa |` / `| talks, comforts, teaches | red panda | Hachiware |` /
  `| wild, excited | sika deer fawn | Usagi |` / `| smug, selfish-cute | takin calf | Momonga |`
- `scripts/gen-result-art.sh:7` (`LOOK`): "cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals".
- `prototype/talk/seedance.sh:11` `sips -s format jpeg -Z 512 chiikawa-closed.png --out /tmp/seed-first.jpg >/dev/null`;
  `:32` `curl -sS -o chiikawa-talk.mp4 "$url"`; `:33` `ffmpeg … -i chiikawa-talk.mp4 -i nihao.mp3 … chiikawa-talk-nihao.mp4`;
  `:34` `echo "done: prototype/talk/chiikawa-talk.mp4 (silent) · chiikawa-talk-nihao.mp4 (with our 你好)"`.
  `prototype/talk/redpanda-closed.png` exists (also `panda-closed.png`, `redpanda-half-m.png`, `redpanda-open-m.png`).
- **Id check:** `rg -il 'chiikawa|hachiware|usagi|momonga' prototype --glob '*.js'` → no output today. Prototype JS already uses
  the v2 ids: `prototype/data/h1-01.js:8-9` `redpanda: { name: 'Gấu Đỏ', … }`, `takin: { name: 'Linh Ngưu', … }`;
  `prototype/talk.js:4` `FRAMES = ['talk/redpanda-closed.png', …]`; `prototype/data/h0-00.js:194` `cast: ['panda']`.
- **Vietnamese naming convention (copy it):** red panda = **Gấu Đỏ** (`prototype/lesson.html:115`, `prototype/data/h1-01.js:8`,
  `prototype/home-glass.html:89` alt, `prototype/l5-dialogue.html:137`); takin = **Linh Ngưu** (`lesson.html:115`, `h1-01.js:9`);
  panda = **Gấu Trúc** (`prototype/l0-hub.html:66`, `prototype/l1-hub.html:79`); fawn = **Nai Con** (`prototype/l1-hub.html:79`).
  English prose uses: baby panda / red panda / sika deer fawn / takin calf. Machine ids: `panda`, `redpanda`, `fawn`, `takin`.

## Task 0 [AC1] Snapshot every file the plan edits
File: `.gitignore:26` plus the 13 files in Anchors
- Change: `mkdir -p /tmp/chy1-s1-backup && tar -cf /tmp/chy1-s1-backup/touched.tar .gitignore NOTES.md PRODUCT.md DESIGN.md CONTEXT.md docs/content-schema.md docs/screens.md design.tokens.json .impeccable/design.json prototype/home.html prototype/talk-sample.html prototype/palettes.html prototype/wireframes-core-loop.html prototype/talk/seedance.sh`
- Test first: `test -e /tmp/chy1-s1-backup/touched.tar` → exit 1 now.
- Verify: `tar -tf /tmp/chy1-s1-backup/touched.tar | wc -l` → `14`.

## Task 1 [AC1] Init the repo on `main`, set the personal identity, prove signing
File: repo root (`.git` absent)
- Change: `git init -b main`; repo-local `git config user.name stonghuuloc`, `user.email 43029756+stonghuuloc@users.noreply.github.com`, `user.signingkey ~/.ssh/id_ed25519.pub`; keep global `commit.gpgsign true`. Run the identity + signing probe from "Draft code" BEFORE any commit; fallback `gpg.ssh.program ssh-keygen` (repo-local) only if the probe commit fails. No `git add`, no commit yet.
- Test first: `git rev-parse --git-dir` → exit 128 now.
- Verify: `git branch --show-current` → `main`; `git rev-list --count --all` → `0`; `git config --show-origin --get-regexp '^user\.' | rg -c '\.git/config'` → `3`; probe prints `1`.

## Task 1b [AC1] Create the PRIVATE repo and add the remote
File: repo root (`.git/config`)
- Change: check `gh auth status` active account is `stonghuuloc`; `gh repo create stonghuuloc/chaiyo --private --description "…"` (no `--source`, no `--push`); `git remote add origin git@stonghuuloc:stonghuuloc/chaiyo.git`. Never the `github.com` alias or work token.
- Test first: `gh repo view stonghuuloc/chaiyo` → fails (not found) now.
- Verify: `gh repo view stonghuuloc/chaiyo --json visibility --jq .visibility` → `PRIVATE`; `git remote get-url origin` → `git@stonghuuloc:stonghuuloc/chaiyo.git`; `ssh -T git@stonghuuloc 2>&1 | head -n 1` → `Hi stonghuuloc!`.

## Task 2 [AC1] Append the ignore rules
File: `.gitignore:26` (append after)
- Change: append the block in "Draft code". Append-only; lines 1–26 untouched.
- Test first: `git check-ignore -q assets/words/x.png; echo $?` → `1` now (not ignored); same for the other 8 paths.
- Verify: `git check-ignore -v assets/words/x.png prototype/audio/x.mp3 .impeccable/review/x.png .impeccable/mocks/x.png rr-session-1.json prototype/logos/a/_work/x.log assets/cast-options/x.png prototype/lesson-images.html scripts/__pycache__/x.pyc` → 9 lines;
  `git check-ignore -q assets/ukai.ttc; echo $?` → `1`; `git check-ignore -q .env.example; echo $?` → `1`.

## Task 3 [AC7] Scrub the docs
Files: `NOTES.md`, `PRODUCT.md`, `DESIGN.md`, `CONTEXT.md`, `docs/screens.md`, `docs/content-schema.md` (lines in Anchors)
- Change (English prose; map Chiikawa→baby panda, Hachiware→red panda, Usagi→sika deer fawn, Momonga→takin calf):
  - `NOTES.md:47` → `The cast v2 creatures act out each word: **baby panda, red panda, sika deer fawn, takin calf**. No other characters.` (the `others (Kuri-manju, Rakko, Shisa, Kani…)` clause is dropped, Q12).
  - `:50` → `` `The sika deer fawn eating a big red apple in an apple orchard` ``
  - `:51` replace `drawn in the original Chiikawa manga style by Nagano with bold dark outlines and flat colours; Chiikawa has exactly two small round ears.` with `in a cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals.`
  - `:53,58,64,66,126` rename in place by the mapping (e.g. `:53` `Hachiware crying while Chiikawa comforts it` → `red panda crying while the baby panda comforts it`); `:66` also `Usagi/Momonga` → `fawn/takin`.
  - `:57-60` first cell → `baby panda` / `red panda` / `sika deer fawn` / `takin calf`.
  - `:67` delete the whole `Sources: Wikipedia "Chiikawa", …` line (Loc, Q12). `:61-62` delete the Kuri-manju and Rakko table rows (Loc, Q12).
  - `:75` → `## Cast v2 (locked 2026-10-23)`. `:77` replace `Loc: "can't go big with Chiikawa" → own cast, drawn in the Chiikawa/Nagano chibi style but different species.` with `Own cast (Loc, 2026-10-23): four original species in a cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals.`
  - `:79-84` delete the `Was` column (4 cells per row → keep `Role`, `Character`; separator `|---|---|`).
  - `:86` `v3 Chiikawa-style species` → `v3 same-style species`.
  - `:105` `(Hachiware ↔ Momonga, Momonga = edge-tts` → `(red panda ↔ takin, takin = edge-tts`; `:111` `4 Hachiware listening` → `4 red panda listening`; `:117` `(Chiikawa)` → `(baby panda)`; `:118` → `reviews-due (red panda), lesson-next (baby panda), day-done (sika deer fawn), streak-at-risk (takin calf), freeze-used (baby panda)`;
    `:125` `Speaker = Hachiware only` → `Speaker = red panda only` and `talk/hachiware-closed.png` → `talk/redpanda-closed.png` (frames in that line likewise); `:146` `hammock Usagi` → `hammock fawn`; `:151` `Chiikawa art badges` → `cast art badges`; `:156` rename by mapping.
  - `PRODUCT.md:23` `The Chiikawa cast acts` → `The cast acts`. `:45` → `- Art: the cast v2 creatures (baby panda, red panda, sika deer fawn, takin calf) in a cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals — set in richly detailed, cozy storybook backgrounds with warm golden light. No text inside images. Images are cropped to 3:2.`
  - `DESIGN.md:123,244` `The Chiikawa art` / `the Chiikawa art` → `The cast art` / `the cast art`.
  - `CONTEXT.md:170` → `The cast v2 creatures who act out words …`; `(Hachiware, Momonga)` → `(red panda, takin)`; `(Chiikawa, Usagi)` → `(baby panda, sika deer fawn)`. `docs/screens.md:94` `Chiikawa cast` → `cast`.
  - `docs/content-schema.md:59` → `type CastId = 'panda' | 'redpanda' | 'fawn' | 'takin' | string;`; `:167,247` `[chiikawa, usagi]` → `[panda, fawn]`; `:168,247` `Chiikawa waving hello to Usagi` → `The baby panda waving hello to the fawn`; `:171-177` `speaker: hachiware` → `redpanda`, `speaker: momonga` → `takin`; `:345` `(hachiware, momonga)` → `(redpanda, takin)`.
- Test first: `! rg -qi 'chiikawa|hachiware|usagi|momonga|nagano|kuri-manju|rakko|shisa|\bkani\b' NOTES.md PRODUCT.md DESIGN.md CONTEXT.md docs/screens.md docs/content-schema.md` → exit 1 now.
- Verify: same command → exit 0; `rg -n '^\| Role \| Character \|$' NOTES.md` → 1 line; `rg -n '\| Was \|' NOTES.md` → no output; `rg -c 'Sources: Wikipedia' NOTES.md` → no output.

## Task 4 [AC7] Scrub tokens and `.impeccable/design.json`
Files: `design.tokens.json:504`, `.impeccable/design.json:399,444`
- Change: `:504` `"imageryStyle": "Cast art in a cute chibi style with thin dark brown outlines and flat pale colours, tiny shiny dot eyes and pink blush ovals, as the one rich, warm image per screen, cropped 3:2, with no text inside it; the interface around it stays flat ink on notebook paper."`
  `design.json:399` `The Chiikawa art is` → `The cast art is`; `:444` `the Chiikawa art` → `the cast art`. Edit the JSON string only; keep escapes (`\n\n`) intact.
- Test first: `! rg -qi 'chiikawa|nagano' design.tokens.json .impeccable/design.json` → exit 1 now.
- Verify: same → exit 0; `python3 -m json.tool design.tokens.json >/dev/null && python3 -m json.tool .impeccable/design.json >/dev/null` → exit 0.

## Task 5 [AC7] Scrub prototype HTML (text, alt text, labels only)
Files: `prototype/home.html:153`, `talk-sample.html:9`, `palettes.html:21`, `wireframes-core-loop.html:124,142,174,230,399,456,492`
- Change (Vietnamese convention: Gấu Đỏ / Linh Ngưu / Gấu Trúc / Nai Con):
  - `home.html:153` alt → `Gấu Đỏ ngồi bên bàn gỗ, giơ một tấm thẻ ôn tập` (copied from `home-glass.html:89`, same image `reviews-due.png`).
  - `talk-sample.html:9` `<title>Talking Chiikawa — free sample</title>` → `<title>Talking red panda — free sample</title>`.
  - `palettes.html:21` `the golden-lit Chiikawa page` → `the golden-lit cast-art page`.
  - wireframes: `:124` `scene: Chiikawa leo lên bậc` → `scene: Gấu Trúc leo lên bậc`; `:142` `Usagi mở cửa lớp` → `Nai Con mở cửa lớp`; `:174` `Chiikawa chào Usagi` → `Gấu Trúc chào Nai Con`;
    `:230,:492` `Chiikawa vẫy chào Usagi` → `Gấu Trúc vẫy chào Nai Con`; `:399` `Usagi nhảy mừng` → `Nai Con nhảy mừng`; `:456` `Hachiware nằm nghỉ` → `Gấu Đỏ nằm nghỉ`.
- Test first: `! rg -qi 'chiikawa|hachiware|usagi|momonga' prototype/home.html prototype/talk-sample.html prototype/palettes.html prototype/wireframes-core-loop.html` → exit 1 now.
- Verify: same → exit 0; for each of the 4 files `rg -o 'src="([^"#]+)"' -r '$1' <file> | grep -v '^data:' | while read p; do test -e "prototype/$p" || echo "MISSING $p"; done` → no output;
  `rg -il 'chiikawa|hachiware|usagi|momonga' prototype --glob '*.js'` → no output.

## Task 6 [AC7] Point `seedance.sh` at the existing red panda still
File: `prototype/talk/seedance.sh:11,32,33,34`
- Change: `chiikawa-closed.png` → `redpanda-closed.png` (`:11`); `chiikawa-talk.mp4` → `redpanda-talk.mp4` (`:32,33,34`); `chiikawa-talk-nihao.mp4` → `redpanda-talk-nihao.mp4` (`:33,34`). Do NOT run the script (calls a paid API).
- Test first: `! rg -qi chiikawa prototype/talk/seedance.sh` → exit 1 now.
- Verify: same → exit 0; `test -e prototype/talk/redpanda-closed.png` → exit 0; `sh -n prototype/talk/seedance.sh` → exit 0.

## Task 7 [AC7] Zero-match check on the file set that will be committed
File: n/a (check only; repo files from T3–T6)
- Change: none. Run the check script from "Draft code" after `git add -A`.
- Test first: run it before T3–T6 → exit 1 with 62 matching lines (proves it detects).
- Verify: `git add -A && git ls-files -z | grep -zv -e '^backlog/' -e '^\.stories/' | xargs -0 rg -i 'chiikawa|hachiware|usagi|momonga|nagano|kuri-manju|rakko|shisa|\bkani\b'` → exit 1, no output.

## Task 8 [AC1] Gates, signed commit, push, proof
File: index (all files)
- Change: `git add -A`; run the check script from "Draft code" (T7 zero-match, exclusion gate, ≤ 30 MB); confirm `git config user.email` prints the noreply address; `git commit -m "chore: initial commit (CHY-1)"`; then `git push -u origin main`.
- Test first: `git rev-list --count HEAD` → fails now (no commit); `git ls-remote origin main` → no output now (empty remote).
- Verify: `git rev-list --count HEAD` → `1`; `git status --short` → no output; `git branch --show-current` → `main`;
  `git log -1 --format='%ae %ce'` → noreply address twice; `git cat-file commit HEAD | rg -c 'BEGIN SSH SIGNATURE'` → `1`;
  `git ls-remote origin main | awk '{print $1}'` → equals `git rev-parse HEAD`;
  `gh api repos/stonghuuloc/chaiyo/commits/$(git rev-parse HEAD) --jq .commit.verification.verified` → `true`;
  `gh repo view stonghuuloc/chaiyo --json visibility --jq .visibility` → `PRIVATE`;
  `git ls-files --error-unmatch assets/ukai.ttc .impeccable/design.json` → exit 0.

## Task 9 [AC2] Post-commit proof for the 4 AC paths
File: `.gitignore:1,16,25,8`
- Change: hard abort ONLY for root `.env`: `test ! -e .env` must exit 0 — a real secrets file is never overwritten or deleted; if it exists, STOP and ask Loc.
  For the other 3 probes (`node_modules/x/index.js`, `src/lib/paraglide/m.js`, `.svelte-kit/output`; `.svelte-kit/` already exists on disk and `.svelte-kit/output` may exist from a past build):
  record `test -e <path>` before; create only the missing ones (`mkdir -p` the parent, then `touch`), noting any parent dir T9 itself created; an existing path counts as the probe as-is.
  After the checks, delete only what T9 created (files, then parent dirs T9 created, only if empty). `prototype/talk/.env` is never touched.
- Test first: before the commit exists, `git status --short` after creating them is meaningless; the test runs only after T8.
- Verify: `git status --short` → no output; `git check-ignore -v node_modules/x/index.js .env src/lib/paraglide/m.js .svelte-kit/output` → 4 lines (with `.env` created by T9 only because it did not exist);
  after cleanup, `git status --short` → no output and `test -e` for each path matches its recorded "before" value.

## Mutation paths covered
n/a (no data writes). Risks instead:
- **Renamed ids the prototype reads:** none renamed in `prototype/*.js` or `prototype/data/*.js`; T5 verify re-runs `rg -il … prototype --glob '*.js'` → no output, and the MISSING loop catches any broken `src`.
- **Doc ids vs prototype ids:** `docs/content-schema.md` ids become `panda|redpanda|fawn|takin`, matching `prototype/data/h1-01.js:8-9` (`redpanda`, `takin`).
- **Vietnamese grammar after rename:** only whole-name swaps (`Chiikawa`→`Gấu Trúc`, `Usagi`→`Nai Con`, `Hachiware`→`Gấu Đỏ`); no classifier or particle changes. Spot-check `wireframes-core-loop.html:174` reads `Gấu Trúc chào Nai Con`.
- **`.env` probe overwrite:** T9 aborts if `.env` exists; `prototype/talk/.env` is untouched and stays ignored (`.gitignore:16`).
- **Wrong identity (work):** the global git identity is work (`loc-tong-covergo`, `id_loctongcovergo`, 1Password signer). T1 sets repo-local user.name/email/signingkey before any commit; T8 checks `git log -1 --format='%ae %ce'` and never commits if it prints `loc.tong@covergo.com`.
- **Signer refuses the file key:** the global `gpg.ssh.program` is 1Password `op-ssh-sign`. The T1 probe commit proves it signs with `id_ed25519` before the real commit; fallback is repo-local `gpg.ssh.program ssh-keygen`.
- **Unverified locally:** `~/.ssh/allowed_signers` has only `stonghuuloc@gmail.com` and `loc.tong@covergo.com`, so `git verify-commit` finds no principal for the noreply email. T8 proves the signature through GitHub (`verification.verified`), not `verify-commit`. The file is not edited.
- **Wrong remote or visibility:** `gh repo create` is `--private` and the remote URL uses the `stonghuuloc` alias, never `git@github.com:` (that alias is the work key). T1b and T8 check `visibility` → `PRIVATE`.
- **JSON breakage:** T4 verify runs `python3 -m json.tool` on both JSON files.
- **Stale line numbers:** all single-line edits shift nothing, except in `NOTES.md` (deleting `:61-62` and `:67`, and the `Was` column). Edit `NOTES.md` bottom-to-top (`:156` first … `:47` last) and re-run `rg -n` before each edit.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk; report a self-contradictory check, don't hack around it)
`.gitignore` block, appended after line 26:
```
# Generated art + audio live on R2 (CHY-1 S3), not git
assets/**/*.png
prototype/audio/
# Design scratch + run output
.impeccable/review/
.impeccable/mocks/
rr-session-*
prototype/logos/
assets/cast-options/
prototype/lesson-images.html
scripts/__pycache__/
```
Check script (run from repo root after `git add -A`):
```sh
set -e
git ls-files -z | grep -zv -e '^backlog/' -e '^\.stories/' | xargs -0 rg -i 'chiikawa|hachiware|usagi|momonga|nagano|kuri-manju|rakko|shisa|\bkani\b' && { echo "FAIL: retired cast name"; exit 1; } || true
git ls-files | grep -E '^(node_modules/|src/lib/paraglide/|\.svelte-kit/|prototype/audio/|prototype/logos/|assets/cast-options/|\.impeccable/(review|mocks)/|scripts/__pycache__/|rr-session-|prototype/lesson-images\.html$)|(^|/)\.env$|^assets/.*\.png$' && { echo "FAIL: ignored path tracked"; exit 1; } || true
bytes=$(git ls-files -z | xargs -0 stat -f %z | awk '{s+=$1} END {print s}')
[ "$bytes" -le 30000000 ] || { echo "FAIL: $bytes bytes"; exit 1; }
echo "OK $bytes bytes"
```
Identity + signing probe, run in T1 before any commit (throwaway repo so nothing touches `chaiyo`):
```sh
id='43029756+stonghuuloc@users.noreply.github.com'
echo x | ssh-keygen -Y sign -f ~/.ssh/id_ed25519 -n git >/dev/null || echo "FAIL: key cannot sign"
d=$(mktemp -d) && git -C "$d" init -q -b main \
  && git -C "$d" config user.name stonghuuloc && git -C "$d" config user.email "$id" \
  && git -C "$d" config user.signingkey ~/.ssh/id_ed25519.pub \
  && git -C "$d" commit -q --allow-empty -m probe \
  && git -C "$d" cat-file commit HEAD | rg -c 'BEGIN SSH SIGNATURE'   # → 1; if the commit fails, 1Password op-ssh-sign refused the file key
rm -rf "$d"
# fallback only if the probe commit failed: git config gpg.ssh.program ssh-keygen   (repo-local, in chaiyo)
```
Repo creation (T1b, private, no --source/--push):
```sh
gh auth status 2>&1 | rg -c 'Active account: true'   # and the account line must say stonghuuloc
gh repo create stonghuuloc/chaiyo --private --description "Chaiyo: Vietnamese-first Mandarin learning app (SvelteKit)"
git remote add origin git@stonghuuloc:stonghuuloc/chaiyo.git
```

## Rollback
- Nothing pushed yet: `rm -rf .git`. If T1b already created the GitHub repo (still empty): `gh repo delete stonghuuloc/chaiyo --yes` ONLY on Loc's say-so (needs the `delete_repo` scope; `gh auth refresh -s delete_repo` would be a new grant, ask first).
- After the push: same two steps (`gh repo delete …` only with Loc's say-so, then `rm -rf .git`). The work account and work key are never involved, so nothing to undo there.
- File edits: `tar -xf /tmp/chy1-s1-backup/touched.tar` from the repo root restores all 14 touched files (T0 snapshot; there is no git history to revert to). The `.gitignore` block alone: restore from the tar.
