# CHY-1 S3 — plan
ACs: AC6  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: main

Execute is blocked until Loc creates the R2 account, bucket `chaiyo-assets` (public access off) and an Object Read & Write token, and puts the 4 values in `.env` (Task 0). Tasks 1-3 are offline and can land before that.

## Anchors (verified 2026-10-26)
- `.gitignore:28` `assets/**/*.png` · `:29` `prototype/audio/` · `:35` `assets/cast-options/` · `:16` `.env` (`:17` `.env.*`; `.env.example` is un-ignored below it)
- `.env.example` (3 lines, no trailing R2 keys): `:1` `# Supabase project (Settings → API). Public values; RLS guards the data.` · `:2` `PUBLIC_SUPABASE_URL=` · `:3` `PUBLIC_SUPABASE_ANON_KEY=`
- `package.json:17-18` `"tokens": "node scripts/build-tokens.mjs"`, `"icons": "scripts/build-icons.sh"` — one-line runners for repeatable repo tasks; indentation is tabs (prettier checks `package.json` in `pnpm lint`).
- `scripts/` conventions: Python with `#!/usr/bin/env python3` + docstring `Usage:` (`build-lesson-media.py:1-3`, `check-lesson.py:1-3`, `gen-image.py:1-3`); bash only for image tooling (`build-icons.sh:1`, `gen-result-art.sh:1`); `.mjs` for token/YAML transforms. No script uploads anywhere today.
- `aws-cli/2.34.33 Python/3.14.5 Darwin/25.3.0 source/arm64` at `/opt/homebrew/bin/aws`; `jq` at `/opt/homebrew/bin/jq`; `python3` 3.15.0; `node` v24.19.0.
- git identity (repo-local): `stonghuuloc` / `43029756+stonghuuloc@users.noreply.github.com`, `commit.gpgsign=true`, `user.signingkey=~/.ssh/id_ed25519.pub`.
- Dynamic ref sites and where their ids come from:
  - `prototype/lesson.html:122` `../assets/words/${id}/wNN.png` + audio key `${id}/wNN` — `id` = lesson id from the URL; `L.words` array length in `data/h2-01.js`…`h5-01.js` (`LESSON.words`).
  - `prototype/lesson.html:129` `../assets/words/${w.img}.png`, audio `w.a`, `w.ex[3]` — `WORDS[].img/.a/.ex` in `data/h1-01.js` (e.g. `img: 'ni', a: '01'`, `h1-01.js:13`).
  - `prototype/l3-words.html:75` `../assets/words/${w.img}.png` — `WORDS` from `./data/h1-01.js` (`l3-words.html:59`).
  - `prototype/w1-word.html:263` `../assets/words/${t.img}.png` — `LESSON` from `./data/h1-01.js` + `lexicon.js` (`w1-word.html:148-149`).
  - `prototype/step.js:17,50` `audio/${key}.mp3` — callers pass `w.a`, `w.key` (`${id}/wNN`), `${id}/${sid}` sentence keys, `py/${syllable}` (`w3-pinyin.html:96`, `primer.js:31,52`, keys from `data/syllables.js`), `pl/${hz}` (`data/placement.js:81`).

## Design decisions
- **Languages/tools:** two Python 3 stdlib scripts that shell out to the installed `aws` CLI. Why: scripts/ is Python for anything with logic; this needs NUL-safe paths, JSON parsing of bucket listings and md5 compare, which bash does badly; no install needed (`aws` present, boto3 not assumed).
- **Two files, no third:** `scripts/assets_push.py` (importable; underscore name) and `scripts/assets_pull.py` imports `load_cfg`, `aws`, `list_bucket`, `in_scope` from it — matches SPEC seam (two scripts) and avoids copying ~35 lines.
- **npm runners:** add `"assets:push": "python3 scripts/assets_push.py"` and `"assets:pull": "python3 scripts/assets_pull.py"` after `icons` — same convention as `tokens`/`icons`; pull is the documented fresh-clone step.
- **Set enumeration:** `git ls-files -z --others --ignored --exclude-standard` filtered to `^assets/.*\.png$|^prototype/audio/` minus `assets/cast-options/` and `.DS_Store`. Single source for upload only. Pull cannot enumerate ignored files on a fresh clone, so it lists the BUCKET and downloads keys missing locally.
- **Upload = own diff + per-file `aws s3 cp`, not `aws s3 sync`.** `sync` skips on size+mtime: a same-size edit is missed (breaks "edit → uploaded 1"), and a clone/restore changes mtimes so unchanged files re-upload (breaks "no change → uploaded 0"). Instead: list bucket once (`s3api list-objects-v2`, JSON: Key, Size, ETag), compute local md5; upload iff key absent or ETag ≠ md5. R2 ETag is MD5 for single PUT; max file 3.2 MiB, below the aws multipart threshold (8 MiB), so ETag = MD5 holds (confirm in Task 5).
- **Delete safeguard:** orphans = bucket keys under `assets/` or `prototype/audio/` not in the local set; always printed; removed only with `--delete` via `aws s3 rm`. Keys outside those two prefixes (CHY-15 `audio/<sha256>.mp3`, Q4-A) are never listed as orphans and never touched.
- **Env:** parse `.env` by hand (only the 4 R2 keys; a non-empty process env value overrides `.env`, blank counts as missing); child gets a fresh env — `PATH`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION=auto`, `AWS_CONFIG_FILE=/dev/null`, `AWS_SHARED_CREDENTIALS_FILE=/dev/null`, `AWS_EC2_METADATA_DISABLED=true`, `AWS_REQUEST_CHECKSUM_CALCULATION=when_required`, `AWS_RESPONSE_CHECKSUM_VALIDATION=when_required` — so no `AWS_PROFILE` or CoverGo credential can leak in. Missing/blank var → exit 2 naming it before any network call. Secrets never printed.
- **Pull overwrite rule:** exists-check before download (`os.path.lexists`); download to `<path>.part`, then `os.replace`. Keys containing `..` or a leading `/` are refused.
- **Dynamic-ref checker (Task 4) is throwaway** (`/tmp/check-dyn.mjs`), not committed: pull doesn't use it, and the spec only needs it as verification.

## Task 0 [AC6] Prerequisite gate (Loc)
File: `.env` (ignored, `.gitignore:16`); no repo change.
- Change: Loc creates the Cloudflare account, bucket `chaiyo-assets` (Public Development URL left disabled, no custom domain), and an Object Read & Write token scoped to that bucket; pastes the 4 values into `.env`.
- Test first (fails now): `rg -c '^R2_(ACCOUNT_ID|ACCESS_KEY_ID|SECRET_ACCESS_KEY|BUCKET)=.+' .env` → currently no match / file absent.
- Verify: same command prints `4`; after Task 2 exists, `python3 -c "import sys; sys.path.insert(0,'scripts'); import assets_push as a; c=a.load_cfg(); a.aws(c,'s3api','head-bucket','--bucket',c['R2_BUCKET'])"` exits 0 with no output. Task 5 does not start until both pass.

## Task 1 [AC6] `.env.example` keys
File: `.env.example:3` (append after).
- Change: add a comment line `# Cloudflare R2 (private bucket chaiyo-assets) for scripts/assets_*.py. Secrets: set in .env only.` then `R2_ACCOUNT_ID=`, `R2_ACCESS_KEY_ID=`, `R2_SECRET_ACCESS_KEY=`, `R2_BUCKET=` (empty values).
- Test first (fails now): `rg -c '^R2_(ACCOUNT_ID|ACCESS_KEY_ID|SECRET_ACCESS_KEY|BUCKET)=$' .env.example` → no match (rg exit 1).
- Verify: same command → `4`; `git check-ignore .env; echo $?` → `.env` / `0`; `git check-ignore -v .env.example` → exit 1 (still tracked).

## Task 2 [AC6] Upload script
File: `scripts/assets_push.py` (new) + `package.json:18` (add `assets:push` after `icons`, tab-indented, comma fix on `:18`).
- Change: implement per Draft code; summary line `uploaded N, deleted M`; orphan list printed as `orphans: K` + one key per line (indented, NUL-safe via Python strings, never through a shell).
- Test first (fails now; `scripts/assets_push.py` absent → each command errors):
  1. `python3 -c "import sys; sys.path.insert(0,'scripts'); import assets_push as a; s=a.local_set(); print(len(s), sum(1 for k in s if not k.isascii()))"` → expect `1565 20`.
  2. `for v in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET; do env R2_ACCOUNT_ID=a R2_ACCESS_KEY_ID=b R2_SECRET_ACCESS_KEY=c R2_BUCKET=d $v= python3 scripts/assets_push.py 2>&1 >/dev/null | rg -c $v; done` → four `1`s; exit code 2 each (`echo $?`). No network (fake creds, exit before any call).
  3. `python3 -c "…a.local_set()…"`: assert no key starts with `assets/cast-options/` and none ends with `.DS_Store`.
- Verify: `pnpm lint` still passes on `package.json` (prettier); tests 1-3 above pass; `grep -c '\.env' scripts/assets_push.py` shows it reads only `.env`.

## Task 3 [AC6] Pull script
File: `scripts/assets_pull.py` (new) + `package.json:18` (add `assets:pull` after `assets:push`).
- Change: per Draft code; imports helpers from `assets_push`; summary line `downloaded N, skipped M`.
- Test first (fails now; file absent):
  1. Missing-var loop as Task 2 test 2, with `scripts/assets_pull.py` → exit 2, var name on stderr.
  2. `python3 -c "import sys; sys.path.insert(0,'scripts'); import assets_push as a; print(a.in_scope('assets/words/x.png'), a.in_scope('prototype/audio/pl/互相.mp3'), a.in_scope('audio/abc.mp3'), a.in_scope('assets/../.env'), a.in_scope('assets/cast-options/a.png'))"` → `True True False False False`.
- Verify: both pass; `python3 scripts/assets_pull.py` with fake creds fails only at the network step with exit ≠ 0 and without printing any credential (`2>&1 | rg -c 'b|c'` is not used; check by running with `R2_SECRET_ACCESS_KEY=SECRETSENTINEL` and `rg -c SECRETSENTINEL` on the output → `0`).

## Task 4 [AC6] Dynamic-reference expansion checker (throwaway)
File: `/tmp/check-dyn.mjs` (not committed); reads `prototype/data/*.js` (`h1-01.js:13` `WORDS[].img/.a/.ex[3]`; `h2-01.js`…`h5-01.js` `LESSON.words`, `LESSON.sentences`; `placement.js:81` `pl/${hz}`; `syllables.js` keys → `py/<key>`).
- Change: for each source above import the module with `await import(...)`, expand to `assets/words/<…>.png` and `prototype/audio/<key>.mp3` paths, test `fs.existsSync` for each, print missing ones and a final `unchecked: N` count of entries it could not expand (non-literal ids).
- Test first (fails now, before pull on a fresh clone): run in the fresh clone of Task 8 BEFORE pull → many missing; run on this Mac now as a baseline → expect `missing: 0` (art/audio are all present locally).
- Verify: on this Mac `node /tmp/check-dyn.mjs` → `missing: 0, unchecked: N` (N recorded in the report); static loop: `rg -o --no-filename '\.\./assets/[A-Za-z0-9_./-]*\.png' prototype | sort -u | while read p; do [ -f prototype/$p ] || echo MISSING $p; done` → no output.

## Task 5 [AC6] First real upload + count/bytes check
File: runs `scripts/assets_push.py`; no repo change.
- Test first (fails now): `aws s3 ls s3://chaiyo-assets/ --recursive --summarize --endpoint-url https://$ACCT.r2.cloudflarestorage.com` (via the cfg env, see Task 0 command) → `Total Objects: 0`.
- Change: `python3 scripts/assets_push.py`.
- Verify: summary `uploaded 1565, deleted 0`; listing `Total Objects: 1565` and `Total Size` = local byte sum (`python3 -c "…sum(os.path.getsize(k) for k in a.local_set())"`); non-ASCII check: JSON key list contains 20 keys with non-ASCII; one `head-object` on `prototype/audio/pl/互相.mp3` succeeds; ETag of `assets/words/h5-01/w06.png` equals `md5` of the file (confirms ETag=MD5; if not, STOP and switch the compare to a stored `x-amz-meta-sha256`).

## Task 6 [AC6] Idempotence, same-path edit, delete safeguard
File: scratch copy of ONE file: `prototype/audio/pl/互相.mp3` → keep original at `/tmp/s3-orig/互相.mp3` (`cp -p`) and restore after; never touch real art otherwise.
- Test first (fails now: no script behaviour yet verified): run steps below.
- Verify:
  1. `python3 scripts/assets_push.py` → `uploaded 0, deleted 0`.
  2. Append one byte to the scratch-chosen file (`printf x >> prototype/audio/pl/互相.mp3`), run → `uploaded 1`; restore with `cp -p /tmp/s3-orig/互相.mp3 prototype/audio/pl/互相.mp3`, run → `uploaded 1` (restores bucket bytes); sha256 equals the saved original.
  3. Same-size edit: flip one byte keeping the size (python), run → `uploaded 1` (proves content, not size, drives it); restore + run → `uploaded 1`.
  4. Delete safeguard: `cp -p prototype/audio/pl/再见.mp3 /tmp/s3-orig/` then `mv` it away from the repo; run → `orphans: 1` + that key, object still in bucket (`head-object` exit 0); run with `--delete` → `deleted 1`, `head-object` fails 404; `cp -p` the file back, run → `uploaded 1`; final run → `uploaded 0, deleted 0`.
  5. Put a throwaway key `audio/zz-test.mp3` (outside both prefixes) with `aws s3 cp` first; `--delete` run must NOT list or remove it; then delete that test key.
  6. Profile-free: `AWS_CONFIG_FILE=/dev/null AWS_SHARED_CREDENTIALS_FILE=/dev/null env -u AWS_PROFILE python3 scripts/assets_push.py` → `uploaded 0, deleted 0`.

## Task 7 [AC6] Privacy checks
File: none.
- Test first (fails if bucket were public): `curl -s -o /dev/null -w '%{http_code}\n' "https://$ACCT.r2.cloudflarestorage.com/chaiyo-assets/assets/words/h5-01/w06.png"` and the same against `https://pub-*.r2.dev/…` (the `pub-` host name comes from the dashboard; Loc supplies it, or confirms r2.dev is off).
- Verify: both `≠ 200` (expected 403/400/404); Loc confirms in the dashboard: "Public Development URL: Disabled", no custom domains. Record Loc's confirmation in the slice note.

## Task 8 [AC6] Fresh-clone pull
File: `/tmp/s3-fresh` (scratch clone); runs `scripts/assets_pull.py`.
- Test first (fails now): `git clone git@stonghuuloc:stonghuuloc/chaiyo.git /tmp/s3-fresh && cp .env /tmp/s3-fresh/.env` (requires Task 9 pushed so scripts exist on origin) then Task 4 checker in the clone → missing > 0, `find /tmp/s3-fresh/assets -name '*.png' | wc -l` = 0.
- Verify:
  1. `cd /tmp/s3-fresh && python3 scripts/assets_pull.py` → `downloaded 1565, skipped 0`.
  2. sha256 compare: both trees listed via `local_set()` keys; all equal to this Mac's (`python3` loop prints `mismatch: 0`).
  3. Q7-A: `printf x >> assets/badges/first.png`; record sha256; run pull → `downloaded 0, skipped 1565`; sha256 unchanged.
  4. Second run → `downloaded 0, skipped 1565`.
  5. Task 4 checker in the clone → `missing: 0`; static loop → no output.
  6. `rm -rf /tmp/s3-fresh` afterwards (it holds a copy of `.env`).

## Task 9 [AC6] Commit and push
Files: `scripts/assets_push.py`, `scripts/assets_pull.py`, `.env.example`, `package.json`, `backlog/tasks/chy-1 - Git-repo-CI-checks.md`, `.stories/M-0-epic/CHY-1/**` (STORY/DISCUSSION/SPEC/PLAN).
- Test first: `git status --short` lists exactly these and no `.env`.
- Change: `git add` the listed files by name; one signed commit `CHY-1 S3: R2 upload/pull scripts for ignored art and audio`; `git push origin main` (origin `git@stonghuuloc:stonghuuloc/chaiyo.git`, repo still private). Note: Task 8 needs this push first, so run order is 0,1,2,3,4,5,6,7,9,8, then tick AC6 only after Task 8 passes.
- Verify: `git log -1 --show-signature | head -n 5` shows a good signature by `id_ed25519`; `git ls-files -z | xargs -0 rg -n "<first 6 chars of R2_ACCESS_KEY_ID>|<secret>"` → no match (run with the values read from `.env` into shell variables, never echoed); `git ls-files .env` → empty.

## Mutation paths covered
- create object: Tasks 5 · overwrite same key (same-size and different-size): Task 6.2-6.3 · delete: Task 6.4 (listed, then `--delete`) · foreign prefix untouched: Task 6.5 · local-only download: Task 8.1 · modified local file: Task 8.3 · non-ASCII keys: Tasks 2.1, 5 · missing credentials: Tasks 2.2, 3.1.

## Risks
- **CoverGo aws profile leakage:** child env is built from scratch; `AWS_CONFIG_FILE`/`AWS_SHARED_CREDENTIALS_FILE` = `/dev/null`; Task 6.6 proves it.
- **Secrets in history/logs:** script never prints cfg values; Task 3 sentinel check; commands in this plan read values from `.env`, not typed; Task 9 scans tracked content.
- **NUL/non-ASCII keys:** keys travel only as Python strings and argv elements (no shell); bucket listing parsed from `s3api list-objects-v2 --output json` (UTF-8 JSON), not from `aws s3 ls` text.
- **Class A ops:** ~1,565 PUT + a handful of lists on first run (0.16% of the 1M/month free tier); re-runs do 1-2 list calls (a Class A each) and 0 PUTs.
- **Pull overwriting:** exists-check + `.part` rename; Task 8.3 proves it.
- **aws CLI ≥2.23 default checksums vs R2:** set `when_required` env vars; if Task 5 still fails with a checksum error, that is a plan-level fix, not a script hack.
- **`pnpm lint` (`prettier --check .`)** also reads `package.json`, `.env.example` and story markdown; keep `package.json` tab-indented and run `pnpm lint` before Task 9.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk; report a self-contradictory fixture, don't hack around it)
```python
#!/usr/bin/env python3
"""Upload the git-ignored art + audio to the private R2 bucket (key = repo-relative path).
Usage: python3 scripts/assets_push.py [--delete]
Reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET from .env (a non-empty process env value wins)."""
import hashlib, json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEED = ('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET')
PREFIXES = ('assets/', 'prototype/audio/')

def load_cfg():
    vals = {}
    f = ROOT / '.env'
    if f.exists():
        for line in f.read_text(encoding='utf-8').splitlines():
            k, sep, v = line.partition('=')
            if sep and k.strip() in NEED:
                vals[k.strip()] = v.strip().strip('"\'')
    cfg = {k: os.environ.get(k) or vals.get(k, '') for k in NEED}
    for k in NEED:
        if not cfg[k]:
            print(f'{k} is missing or empty (set it in .env)', file=sys.stderr)
            sys.exit(2)
    return cfg

def in_scope(key):
    return (key.startswith(PREFIXES) and not key.startswith('assets/cast-options/')
            and not key.endswith('.DS_Store') and '..' not in key.split('/') and not key.startswith('/'))

def local_set():
    out = subprocess.run(['git', 'ls-files', '-z', '--others', '--ignored', '--exclude-standard'],
                         cwd=ROOT, check=True, capture_output=True).stdout.decode('utf-8')
    return sorted(k for k in out.split('\0') if k and (k.endswith('.png') or k.startswith('prototype/audio/')) and in_scope(k))

def aws(cfg, *args, check=True):
    env = {'PATH': os.environ['PATH'], 'AWS_ACCESS_KEY_ID': cfg['R2_ACCESS_KEY_ID'],
           'AWS_SECRET_ACCESS_KEY': cfg['R2_SECRET_ACCESS_KEY'], 'AWS_DEFAULT_REGION': 'auto',
           'AWS_CONFIG_FILE': '/dev/null', 'AWS_SHARED_CREDENTIALS_FILE': '/dev/null',
           'AWS_EC2_METADATA_DISABLED': 'true', 'AWS_REQUEST_CHECKSUM_CALCULATION': 'when_required',
           'AWS_RESPONSE_CHECKSUM_VALIDATION': 'when_required'}
    ep = f"https://{cfg['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    return subprocess.run(['aws', '--endpoint-url', ep, *args], env=env, cwd=ROOT, check=check,
                          capture_output=True, text=True, encoding='utf-8')

def list_bucket(cfg):
    """{key: etag-without-quotes} for keys under PREFIXES."""
    got = {}
    for p in PREFIXES:
        tok = None
        while True:
            a = ['s3api', 'list-objects-v2', '--bucket', cfg['R2_BUCKET'], '--prefix', p, '--output', 'json']
            if tok: a += ['--starting-token', tok]
            r = json.loads(aws(cfg, *a).stdout or '{}')
            for o in r.get('Contents', []): got[o['Key']] = o['ETag'].strip('"')
            tok = r.get('NextToken')
            if not tok: break
    return got

def md5(path):
    h = hashlib.md5()
    with open(ROOT / path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''): h.update(b)
    return h.hexdigest()

def main():
    cfg = load_cfg()
    local = local_set()
    remote = list_bucket(cfg)
    todo = [k for k in local if remote.get(k) != md5(k)]
    def put(k): aws(cfg, 's3', 'cp', '--only-show-errors', str(ROOT / k), f"s3://{cfg['R2_BUCKET']}/{k}")
    with ThreadPoolExecutor(8) as ex: list(ex.map(put, todo))
    orphans = sorted(set(remote) - set(local))
    print(f'orphans: {len(orphans)}')
    for k in orphans: print('  ' + k)
    deleted = 0
    if '--delete' in sys.argv[1:]:
        for k in orphans: aws(cfg, 's3', 'rm', '--only-show-errors', f"s3://{cfg['R2_BUCKET']}/{k}"); deleted += 1
    print(f'uploaded {len(todo)}, deleted {deleted}')

if __name__ == '__main__':
    main()
```
Note when implementing: the gate in `local_set` keeps only `*.png` anywhere under the repo plus everything under `prototype/audio/`, then `in_scope` removes `cast-options/` and `.DS_Store`; `list_bucket` already restricts remote keys to the two prefixes.

```python
#!/usr/bin/env python3
"""Restore the git-ignored art + audio from the private R2 bucket. Fills missing files only; never overwrites.
Usage: python3 scripts/assets_pull.py   (needs the 4 R2_* values, see assets_push.py)"""
import os
from concurrent.futures import ThreadPoolExecutor
from assets_push import ROOT, aws, in_scope, list_bucket, load_cfg

def main():
    cfg = load_cfg()
    keys = [k for k in sorted(list_bucket(cfg)) if in_scope(k)]
    missing = [k for k in keys if not os.path.lexists(ROOT / k)]
    def get(k):
        dst = ROOT / k
        dst.parent.mkdir(parents=True, exist_ok=True)
        tmp = dst.with_name(dst.name + '.part')
        aws(cfg, 's3', 'cp', '--only-show-errors', f"s3://{cfg['R2_BUCKET']}/{k}", str(tmp))
        os.replace(tmp, dst)
    with ThreadPoolExecutor(8) as ex: list(ex.map(get, missing))
    print(f'downloaded {len(missing)}, skipped {len(keys) - len(missing)}')

if __name__ == '__main__':
    main()
```
```js
// /tmp/check-dyn.mjs (throwaway). Expand dynamic ids from prototype/data/*.js; report files missing on disk.
import fs from 'node:fs';
const miss = [], seen = new Set(); let unchecked = 0;
const chk = (p) => { if (!seen.has(p)) { seen.add(p); if (!fs.existsSync(p)) miss.push(p); } };
const pad = (i) => String(i + 1).padStart(2, '0');
for (const id of ['h2-01', 'h3-01', 'h4-01', 'h5-01']) {
  const L = (await import(`/Users/loctong/Documents/Projects/chaiyo/prototype/data/${id}.js`)).LESSON;
  L.words.forEach((_, i) => { chk(`assets/words/${id}/w${pad(i)}.png`); chk(`prototype/audio/${id}/w${pad(i)}.mp3`); });
  Object.keys(L.sentences).forEach((s) => chk(`prototype/audio/${id}/${s}.mp3`));
}
const h1 = await import('/Users/loctong/Documents/Projects/chaiyo/prototype/data/h1-01.js');
for (const w of h1.WORDS) { w.img ? chk(`assets/words/${w.img}.png`) : unchecked++; w.a ? chk(`prototype/audio/${w.a}.mp3`) : unchecked++; }
console.log('missing:', miss.length, miss.slice(0, 20), 'unchecked:', unchecked);
```
(`placement.js` `pl/<hz>` and `syllables.js` `py/<key>` expansions, and any lexicon `img` ids, are added in Task 4 once their export shapes are read; whatever cannot be expanded counts in `unchecked`.)

## Rollback
- Code: `git revert` of the Task 9 commit (scripts, `.env.example`, `package.json` lines); no migration.
- Bucket: delete the two prefixes only with Loc's say-so: `aws s3 rm s3://chaiyo-assets/assets/ --recursive` and `…/prototype/audio/ --recursive` via the same endpoint env — the local files remain the source until Task 8 passes.
- Credentials: Loc revokes the R2 token in the dashboard; remove the 4 values from `.env`.
