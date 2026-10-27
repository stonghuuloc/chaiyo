#!/usr/bin/env python3
"""Upload the git-ignored art + audio to the private R2 bucket (key = repo-relative path).
Usage: python3 scripts/assets_push.py [--delete]
Reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET from .env (a variable set in the
process environment wins, even when blank). Bucket keys under assets/ + prototype/audio/ with no local file
are listed as orphans and removed only with --delete. Keys outside those two prefixes are never touched."""
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
    cfg = {k: os.environ[k] if k in os.environ else vals.get(k, '') for k in NEED}
    for k in NEED:
        if not cfg[k]:
            print(f'{k} is missing or empty (set it in .env)', file=sys.stderr)
            sys.exit(2)
    return cfg


def in_scope(key):
    return (key.startswith(PREFIXES) and not key.startswith('assets/cast-options/')
            and not key.endswith('.DS_Store') and '..' not in key.split('/'))


def local_set():
    out = subprocess.run(['git', 'ls-files', '-z', '--others', '--ignored', '--exclude-standard'],
                         cwd=ROOT, check=True, capture_output=True).stdout.decode('utf-8')
    return sorted(k for k in out.split('\0')
                  if k and (k.endswith('.png') or k.startswith('prototype/audio/')) and in_scope(k))


def aws(cfg, *args, check=True):
    env = {'PATH': os.environ['PATH'], 'AWS_ACCESS_KEY_ID': cfg['R2_ACCESS_KEY_ID'],
           'AWS_SECRET_ACCESS_KEY': cfg['R2_SECRET_ACCESS_KEY'], 'AWS_DEFAULT_REGION': 'auto',
           'AWS_CONFIG_FILE': '/dev/null', 'AWS_SHARED_CREDENTIALS_FILE': '/dev/null',
           'AWS_EC2_METADATA_DISABLED': 'true', 'AWS_REQUEST_CHECKSUM_CALCULATION': 'when_required',
           'AWS_RESPONSE_CHECKSUM_VALIDATION': 'when_required'}
    ep = f"https://{cfg['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com"
    r = subprocess.run(['aws', '--endpoint-url', ep, *args], env=env, cwd=ROOT,
                       capture_output=True, text=True, encoding='utf-8')
    if check and r.returncode:
        print(f'aws {" ".join(args[:2])} failed ({r.returncode}):\n{r.stderr.strip()}', file=sys.stderr)
        sys.exit(1)
    return r


def list_bucket(cfg):
    """{key: etag without quotes} for bucket keys under PREFIXES."""
    got = {}
    for p in PREFIXES:
        r = json.loads(aws(cfg, 's3api', 'list-objects-v2', '--bucket', cfg['R2_BUCKET'],
                           '--prefix', p, '--output', 'json').stdout or 'null') or {}
        for o in r.get('Contents') or []:
            got[o['Key']] = o['ETag'].strip('"')
    return got


def md5(path):
    h = hashlib.md5()
    with open(ROOT / path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def main():
    cfg = load_cfg()
    local = local_set()
    remote = list_bucket(cfg)
    todo = [k for k in local if remote.get(k) != md5(k)]

    def put(k):
        aws(cfg, 's3', 'cp', '--only-show-errors', str(ROOT / k), f"s3://{cfg['R2_BUCKET']}/{k}")

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(put, todo))
    orphans = sorted(set(remote) - set(local))
    print(f'orphans: {len(orphans)}')
    for k in orphans:
        print('  ' + k)
    deleted = 0
    if '--delete' in sys.argv[1:]:
        for k in orphans:
            aws(cfg, 's3', 'rm', '--only-show-errors', f"s3://{cfg['R2_BUCKET']}/{k}")
            deleted += 1
    print(f'uploaded {len(todo)}, deleted {deleted}')


if __name__ == '__main__':
    main()
