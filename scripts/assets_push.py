#!/usr/bin/env python3
"""Upload the git-ignored art + audio to the private R2 bucket (key = repo-relative path).
Usage: python3 scripts/assets_push.py [--delete]
Reads R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET from .env (a variable set in the
process environment wins, even when blank). Bucket keys under assets/ + prototype/audio/ with no local file
are listed as orphans and removed only with --delete. Keys outside those two prefixes are never touched."""
import hashlib, json, os, shutil, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEED = ('R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET')
PREFIXES = ('assets/', 'prototype/audio/')
CHUNK = 100    # files per aws process: amortises the ~1 s CLI startup, aws itself runs 10 transfers inside
WORKERS = 4    # aws processes in parallel (=> up to 40 concurrent transfers)


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


def par(fn, items, workers=WORKERS):
    """Run fn over items on a bounded pool; the first failure cancels queued work and propagates."""
    with ThreadPoolExecutor(workers) as ex:
        futs = [ex.submit(fn, i) for i in items]
        try:
            return [f.result() for f in futs]
        except BaseException:
            ex.shutdown(wait=False, cancel_futures=True)
            raise


def chunks(seq, n=CHUNK):
    return [seq[i:i + n] for i in range(0, len(seq), n)]


def list_bucket(cfg):
    """{key: etag without quotes} for bucket keys under PREFIXES."""
    def one(p):
        return json.loads(aws(cfg, 's3api', 'list-objects-v2', '--bucket', cfg['R2_BUCKET'],
                              '--prefix', p, '--output', 'json').stdout or 'null') or {}
    got = {}
    for r in par(one, PREFIXES):
        for o in r.get('Contents') or []:
            got[o['Key']] = o['ETag'].strip('"')
    return got


def md5(path):
    h = hashlib.md5()
    with open(ROOT / path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def upload(cfg, keys):
    """One `aws s3 cp --recursive` over a symlink stage holding just these keys (stage lives in /tmp)."""
    stage = tempfile.mkdtemp(prefix='assets-push-')
    try:
        for k in keys:
            dst = os.path.join(stage, k)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            os.symlink(ROOT / k, dst)
        aws(cfg, 's3', 'cp', '--recursive', '--only-show-errors', stage, f"s3://{cfg['R2_BUCKET']}/")
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def delete(cfg, keys):
    for part in chunks(keys, 1000):
        body = json.dumps({'Objects': [{'Key': k} for k in part], 'Quiet': True})
        r = json.loads(aws(cfg, 's3api', 'delete-objects', '--bucket', cfg['R2_BUCKET'],
                           '--delete', body, '--output', 'json').stdout or 'null') or {}
        if r.get('Errors'):
            print('delete failed for: ' + ', '.join(e['Key'] for e in r['Errors']), file=sys.stderr)
            sys.exit(1)


def main():
    cfg = load_cfg()
    local = local_set()
    remote = list_bucket(cfg)
    with ThreadPoolExecutor(8) as ex:
        sums = list(ex.map(md5, local))
    todo = [k for k, s in zip(local, sums) if remote.get(k) != s]
    par(lambda ks: upload(cfg, ks), chunks(todo))
    orphans = sorted(set(remote) - set(local))
    print(f'orphans: {len(orphans)}')
    for k in orphans:
        print('  ' + k)
    deleted = 0
    if '--delete' in sys.argv[1:]:
        delete(cfg, orphans)
        deleted = len(orphans)
    print(f'uploaded {len(todo)}, deleted {deleted}')


if __name__ == '__main__':
    main()
