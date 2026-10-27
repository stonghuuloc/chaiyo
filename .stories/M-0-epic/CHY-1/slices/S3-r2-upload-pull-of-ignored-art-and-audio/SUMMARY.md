# CHY-1 S3 — summary
ACs: AC6 · executed PLAN rev 1 · commit b87f8c9 (signed, pushed to origin main)

## What changed
- [AC6] `scripts/assets_push.py`: uploads ignored `assets/**/*.png` (minus `cast-options/`) + `prototype/audio/**` (minus `.DS_Store`) to private bucket `chaiyo-assets`, key = repo path. Own diff (bucket ETag vs local md5) + per-file `aws s3 cp`; orphans listed, removed only with `--delete`.
- [AC6] `scripts/assets_pull.py`: lists the bucket, downloads keys missing locally via `.part` + rename, never overwrites.
- [AC6] `package.json`: `assets:push`, `assets:pull`. `.env.example`: 4 R2 keys, empty values.
- [CHORE] Child env is built from scratch (no AWS profile, config/credentials = /dev/null); missing var → exit 2 naming it.

## Verified
- [AC6] Offline: 1,565 files, 20 non-ASCII, 0 cast-options/.DS_Store; 4 blank-var runs → exit 2 naming the var.
- [AC6] Upload: bucket 1,565 objects / 273,346,014 B = local; key set diff 0; 20 non-ASCII keys; ETag = md5 for `h5-01/w06.png`.
- [AC6] Idempotence: rerun `uploaded 0, deleted 0`; 1-byte append → `uploaded 1`; same-size flip → `uploaded 1`; both restored, sha256 equal to originals.
- [AC6] Delete safeguard: missing file listed, object kept; `--delete` → `deleted 1`; foreign key `audio/zz-test.mp3` untouched (then removed).
- [AC6] Profile-free run with `AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null`, no AWS_PROFILE: `uploaded 0, deleted 0`.
- [AC6] Fresh clone in /tmp + `.env`: `downloaded 1565, skipped 0`; 0 sha256 mismatches; modified file kept its bytes; reruns `downloaded 0, skipped 1565`.
- [AC6] Prototype: static `../assets/` loop → no output; dynamic expansion 1,506 targets, missing 0, unchecked 0 (before pull on the fresh clone: missing 1,506).
- [AC6] Secrets: 0 hits for key-id prefix/secret in tracked files; `.env` untracked and ignored.

## Open
- [AC6] Privacy: anonymous GET on the S3 endpoint → HTTP 400. r2.dev check not run (no `pub-*.r2.dev` host known): needs Loc to confirm dashboard "Public Development URL: Disabled", no custom domain.
- [CHORE] Speed: ~1 file/s (aws CLI spawn per file); first upload took 2 runs (900 s timeout, then 377 s), full pull 16 min. Correct but slow; not changed (plan scope).
- [CHORE] `pnpm lint` fails on 92 pre-existing files (content/*.yaml, backlog/config.yml, scripts/lessons-to-yaml.mjs …); none are files this slice touched.
