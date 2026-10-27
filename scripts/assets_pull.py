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

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(get, missing))
    print(f'downloaded {len(missing)}, skipped {len(keys) - len(missing)}')


if __name__ == '__main__':
    main()
