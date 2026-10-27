# CHY-1 S3 — spec
ACs: AC6  ·  Repo: chaiyo  ·  rev 1

## Behaviour
- [AC6] Upload set = 1,565 files: ignored `assets/**/*.png` minus `assets/cast-options/` (111 PNG), plus `prototype/audio/**` minus `.DS_Store` (1,454 mp3). Each is stored in bucket `chaiyo-assets` under its repo-relative path (e.g. `prototype/audio/pl/互相.mp3`, `assets/words/h5-01/w06.png`). Verified by: listing the bucket and diffing against the local set (empty diff).
- [AC6] Paths are handled NUL-safe: all 20 non-ASCII names (`prototype/audio/pl/*.mp3`) are present in the bucket. Verified by: the same diff, filtered to non-ASCII keys, shows 20 matches.
- [AC6] After upload, object count under prefixes `assets/` + `prototype/audio/` = 1,565 and total bytes = local set bytes. Verified by: `aws s3 ls s3://chaiyo-assets/ --recursive --summarize --endpoint-url https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com` ("Total Objects", "Total Size") against a local `find` byte sum over the same set.
- [AC6] Re-running upload with no local change uploads 0 files and deletes 0. Verified by: the second run's summary line reads `uploaded 0, deleted 0`.
- [AC6] Changing the bytes of one local file at the same path and re-running upload overwrites that one key: summary reads `uploaded 1`, and the object's size/ETag in the bucket matches the new file.
- [AC6] Paths present in the bucket but missing locally are printed as a list (count + each key) on every run and are NOT deleted. They are deleted only when `--delete` is passed (Q6-A + safeguard). Verified by: delete one local PNG, run upload → key listed, still in bucket; run upload `--delete` → key gone, summary `deleted 1`.
- [AC6] Upload reads only `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` from `.env` and uses no named AWS profile. Verified by: a full run succeeds with `AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null` and `AWS_PROFILE` unset.
- [AC6] If any of the 4 vars is unset or empty, upload and pull each exit non-zero before any network call and name the missing variable on stderr. Verified by: for each var, run with only that var blanked → exit code ≠ 0, stderr contains its name.
- [AC6] Bucket is private: an anonymous GET of one uploaded object returns HTTP 400/403 or 404 on `https://$R2_ACCOUNT_ID.r2.cloudflarestorage.com/chaiyo-assets/<key>` and on any `*.r2.dev` URL; Loc confirms the dashboard shows "Public Development URL: Disabled" and no custom domain. Verified by: `curl -s -o /dev/null -w '%{http_code}'` ≠ 200 for both, plus Loc's confirmation.
- [AC6] Pull on a fresh clone (`git clone git@stonghuuloc:stonghuuloc/chaiyo.git /tmp/x`, `.env` copied in) restores all 1,565 files with byte-identical content. Verified by: sha256 of every restored file equals sha256 of the original on this Mac.
- [AC6] Pull only fills missing files and never overwrites (Q7-A): a locally modified file keeps its local bytes. Verified by: modify one file, record its sha256, run pull, sha256 unchanged.
- [AC6] A second pull run with nothing missing downloads 0 files (summary `downloaded 0, skipped 1565`).
- [AC6] After pull, every static `../assets/…` and `audio/…` reference in `prototype/*.html|js` resolves to a file on disk. Verified by: `rg -o --no-filename '\.\./assets/[A-Za-z0-9_./-]*\.png' prototype | sort -u` fed to a `[ -f prototype/$p ]` loop prints nothing, and likewise for literal `audio/…mp3` strings.
- [AC6] Dynamic references (`${id}`, `${w.img}`, `audio/${key}.mp3` in lesson.html:122,129; l3-words.html:75; w1-word.html:263; step.js:17,50) are checked by expanding the ids/keys from `prototype/data/*.js` and testing `[ -f ]` for each expansion; any unresolved target is listed, not silently skipped. Coverage limit: ids that data files compute at runtime (not literal strings) are not expanded and are reported as "unchecked: N".
- [AC6] `.env.example` gains `R2_ACCOUNT_ID=`, `R2_ACCESS_KEY_ID=`, `R2_SECRET_ACCESS_KEY=`, `R2_BUCKET=` with empty values; `.env` stays ignored (`git check-ignore .env` exits 0). No secret in git: `rg -n "<first 6 chars of R2_ACCESS_KEY_ID>"` over `git ls-files -z` content returns no match, and the secret value likewise.
- [LOCK] Only the repo is public; generated PNG + mp3 live in a private R2 bucket (`chaiyo-assets`), not git (Loc, 2026-10-26).
- [LOCK] Repo private until the end of S2 (after S3) (Loc, 2026-10-26).
- [LOCK] Personal GitHub only: stonghuuloc, ssh alias `stonghuuloc`, noreply author email, signed with `~/.ssh/id_ed25519` — never the CoverGo work account/key (Loc, 2026-10-26).
- [CHORE] Note: execute is blocked until Loc creates the R2 account, bucket `chaiyo-assets` (public access off) and an Object Read & Write token scoped to it, and pastes the 4 values into `chaiyo/.env`.

## Not this slice
- CHY-15 sha256 audio keys and any public R2 URL (Q4-A prefix split applies when CHY-15 lands).
- Serving assets inside the SvelteKit app (`src/` reads 0 files from `assets/`).
- S2: CI workflow, CodeRabbit, the public flip of the repo.
- `assets/cast-options/` (28 files, 49.2 MB) stays local only (Q1-A).
- No prototype code change; no `prototype/talk/*` (tracked in git).

## Seam
Two scripts under `scripts/` (names in the plan: upload and pull) plus `.env.example`; both drive `aws s3` against the R2 endpoint.

## Test contract
- [AC6] Upload: run on this Mac, then bucket listing diff against the local 1,565-file set is empty and `--summarize` count/bytes equal the local count/bytes.
- [AC6] Idempotence: second upload run reports `uploaded 0, deleted 0`; one edited file reports `uploaded 1`.
- [AC6] Delete safeguard: with one local file removed, a plain run lists it and leaves the object; a `--delete` run removes exactly that object.
- [AC6] Config: each of the 4 vars blanked in turn → non-zero exit naming that var; full run passes with `AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null`.
- [AC6] Privacy: anonymous curl on the S3 endpoint and `*.r2.dev` URL returns ≠ 200; Loc confirms dashboard state.
- [AC6] Pull: fresh clone in `/tmp` + `.env` → 1,565 files restored with matching sha256; modified-file sha256 preserved on re-run; second run `downloaded 0`.
- [AC6] Prototype: static-reference loop prints nothing; dynamic-reference expansion lists unresolved targets (expected 0) and an "unchecked: N" count.
- [AC6] Secrets: `git check-ignore .env` exits 0 and the key-prefix `rg` over tracked content has no match.

## Open assumptions
- [AC6] Assumed the aws CLI (already at `/opt/homebrew/bin/aws`) works against R2 with `--endpoint-url` and a path-style/auto region config (plan detail; Cloudflare documents the endpoint at developers.cloudflare.com/r2/api/s3/). If wrong, the fallback is `brew install rclone` — one extra install, upload/pull behaviour above unchanged.
