#!/usr/bin/env python3
"""Restore the git-ignored art + audio from the private R2 bucket. Fills missing files only; never overwrites.
Usage: python3 scripts/assets_pull.py   (needs the 4 R2_* values, see assets_push.py)"""
import os, re, shutil, sys, tempfile
from assets_push import PREFIXES, ROOT, aws, chunks, in_scope, list_bucket, load_cfg, par


def fetch(cfg, prefix, keys):
    """One `aws s3 cp --recursive` of just these keys (exact-name --include) into a stage inside ROOT,
    then rename each into place only if still absent. Stage is on ROOT's filesystem so rename is atomic."""
    stage = tempfile.mkdtemp(prefix='.assets-pull-', dir=ROOT)
    try:
        plain = [k for k in keys if not re.search(r'[*?\[\]]', k)]   # --include is a glob; others go one by one
        for k in set(keys) - set(plain):
            aws(cfg, 's3', 'cp', '--only-show-errors', f"s3://{cfg['R2_BUCKET']}/{k}", os.path.join(stage, k))
        args = ['s3', 'cp', '--recursive', '--only-show-errors', '--exclude', '*']
        for k in plain:
            args += ['--include', k[len(prefix):]]
        if plain:
            aws(cfg, *args, f"s3://{cfg['R2_BUCKET']}/{prefix}", os.path.join(stage, prefix))
        for k in keys:
            src, dst = os.path.join(stage, k), ROOT / k
            if not os.path.isfile(src):
                print(f'download failed: {k} (not fetched)', file=sys.stderr)
                sys.exit(1)
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not os.path.lexists(dst):
                os.replace(src, dst)
    finally:
        shutil.rmtree(stage, ignore_errors=True)


def main():
    cfg = load_cfg()
    keys = [k for k in sorted(list_bucket(cfg)) if in_scope(k)]
    missing = [k for k in keys if not os.path.lexists(ROOT / k)]
    jobs = [(p, c) for p in PREFIXES for c in chunks([k for k in missing if k.startswith(p)])]
    par(lambda j: fetch(cfg, *j), jobs)
    print(f'downloaded {len(missing)}, skipped {len(keys) - len(missing)}')


if __name__ == '__main__':
    main()
