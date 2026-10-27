# CHY-1 S3 — verify

| AC | Verdict | Evidence |
|---|---|---|
| AC6 | ✅ | Checks 1–6 all pass (details below) |

## Checks

- **1 Set:** 1565 local keys, 273,346,014 B, 20 non-ASCII; 0 under `assets/cast-options/`; 0 `.DS_Store`.
- **2 Bucket:** 1565 objects in `chaiyo-assets`; key diff 0/0 both ways; ETag mismatches 0/1565 (ETag == md5, single-part PUT); 20 non-ASCII keys.
- **3 Private:** anonymous GET `assets/words/h5-01/w06.png` → HTTP 400 (≠200). Loc confirmed 2026-10-27: r2.dev disabled, no custom domain.
- **4 Fresh-clone pull:** copied 1560 of 1565 files, removed 5 → `downloaded 5, skipped 1560`; sha256 5/5 equal to originals; rerun → `downloaded 0, skipped 1565`.
- **5 Prototype refs:** 9 unique static `../assets/*.png` refs, 0 missing. Dynamic `check-dyn.mjs`: checked 1506, missing 0, unchecked 0.
- **6 Secrets:** `.env` tracked lines in clone 0. Exact-value scan of `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`: history hits 0/0, tracked-file hits 0/0 (354 files, 3.7 MB log).

## Residual risk

- Upload/pull throughput ~1 file/s; first full upload needed 2 runs; full pull ~16 min.
- `pnpm lint` fails on 92 pre-existing files; S2's CI will hit it.
- Story and backlog files still uncommitted.
