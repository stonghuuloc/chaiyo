# CHY-25 S2 — discussion
ACs: AC1  ·  rev 2  ·  2026-11-16 (re-run on `CHY-40-S1` tip a65f4297, wave 2 of M-5)

## Current behaviour (verified, with anchors, a65f4297)
- [AC1] `src/lib/catalog/index.ts:6-9` `CatalogSource = { current(), bundle(sha, lessonId) }`; `:11-20` `CatalogError(code, id)`, codes `not-found | offline | malformed`; `:87-95` `lesson(id)` calls `current()` then `bundle(sha, id)` and returns `LessonContent` (`:22-32`), not `Bundle`. S1 passes Source errors through unchanged.
- [AC1] No HTTP Source exists; the only Source is the test fixture (`src/lib/catalog/fixtures/source.ts:8`). No app-wide `catalog` instance exists.
- [AC1] Routes: `src/routes/(app)/lesson/[id]/` has `[section]/+page.{ts,svelte}` and `gate/+page.{ts,svelte}`, both placeholders that return only `{ shell: { template: 'focus' } }` (`[section]/+page.ts:3`, `gate/+page.ts:3`). No `lesson/[id]/+layout.ts` and no hub `+page` exist, so `/lesson/h1-01` is a 404 today.
- [AC1] App pages are SPA (`src/routes/+layout.ts:8` `ssr = false`), so a lesson `load` runs in the browser behind `requireSession` (`src/routes/(app)/+layout.ts:5-10`).
- [AC1] Route `load` functions are unit-tested by direct call (`src/routes/(app)/pinyin/chart.test.ts:162-173`).
- [AC1] No `vercel.json`; `package.json:8` `build` = `vite build`; adapter-vercel at `vite.config.ts:4,25`.
- [AC1] `scripts/build-content.sh:1-5` (`set -euo pipefail`) imports `content` into `static/content` and runs `pnpm fonts` (`package.json:31` = `python3 scripts/build-kaishu-subsets.py`, needs `scripts/requirements-fonts.txt` = fonttools 4.68.0 + brotli 1.2.1).
- [AC1] CI web job: `.github/workflows/ci.yml:28-30` sets up Python 3.12 but installs **no** fontTools (the rev-1 plan said it did; wrong on this tip). `:36` is the fixture import; `:52` `pnpm build`. Only the `python` job installs the font requirements (`:67`, via uv).

## Answered here (no human needed)
- [AC1] Q: what does the HTTP Source throw? A: S1 verify decision (Loc, 2026-11-16): the Source throws `CatalogError` itself — 404 → `not-found` with the lesson id, rejected `fetch` → `offline` with the id. Other non-ok / bad JSON → `malformed` (the only remaining code).
- [AC1] Q: route return type? A: `catalog.lesson()` returns `LessonContent` (`index.ts:87`), so the seam carries `LessonContent`; `Bundle` in `slices.json` is a naming slip.
- [AC1] Q: hub shell template? A: `{ template: 'pushed', section: 'roadmap' }`, same as `/pinyin` (`pinyin/+page.ts:4`); CHY-31.S1 owns the real hub and may change it.
- [AC1] Q: how does the singleton reach a test's fake fetch? A: the default fetcher reads `globalThis.fetch` per call, so `vi.stubGlobal('fetch', …)` works after import.
- [AC1] Q: CI needs fontTools for `build-content.sh`? A: yes — the new CI step installs `scripts/requirements-fonts.txt` with pip before running it.

- [AC1] Q: AC1 says "the 10 Bài 1 words from 你 to 对不起"; the data order is 你 好 您 你们 你好 对不起 没关系 谢谢 不客气 再见 (`content/lessons/hsk1/h1-01.yaml:36`, S1 test `catalog.test.ts:26-37`). A: the AC's 10 words are all present and 对不起 is one of them. The test asserts the content order, because the content is the frozen source (C3). Flagged to Loc in the design-run report so the AC tick is not disputed.
  - Answer (Loc 2026-11-16, Q7 = A): typo; AC text corrected to "你 to 再见" in the backlog task, STORY.md and SPEC.md.
- [AC1] Q: offline with no network at all — which id? A: `current()` fails first, so the error is `offline` `current`. S3 (AC6) reads the code, not the id; parked as a note for S3.

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC1] | where the lesson load lives | A — `src/routes/(app)/lesson/[id]/+layout.ts` returns `{ lesson: LessonContent }`; `[section]` and `gate` inherit it; minimal hub `+page.svelte` proof, replaced by CHY-31.S1 | Loc via coordinator, 2026-11-16 |
| rev 1 | D3 [AC1] | Vercel build command | `python3 -m pip install --quiet -r scripts/requirements-fonts.txt && bash scripts/build-content.sh && pnpm build` | Loc review, 2026-11-06 |
| rev 2 | D3 [AC1] | Vercel build command | `bash scripts/vercel-build.sh` (fontTools in a venv: the image's uv-managed Python refuses pip, PEP 668) | PR #169 Vercel deploy log, 2026-11-17 |
| rev 1 | I2 | font cache header | `/fonts/lessons/*` = `public, max-age=0, must-revalidate`; `immutable` only under `/content/<64 hex>/` | Loc, 2026-11-06 |
| rev 1 | I3 [AC1] | CI builds real content | yes, before `pnpm build` | Loc, 2026-11-06 |
| rev 1 | I4 | deploy proof | local build + first team-authored deploy; agent commits cannot create Vercel deploys | Loc, 2026-11-06 |

## Files outside the lane
- none. `lesson/[id]/+layout.ts` is the seam the coordinator assigned to this slice (Q1). `[section]/+page.ts` and `gate/+page.ts` are not edited; they inherit `data.lesson`.

## Locked (do not re-open)
- ADR 0002: per-lesson JSON bundle, same-origin, URL carries the sha (`/content/<64 hex>/<id>.json`); `current.json` = `{ sha }`.
- CHY-13: font names carry no hash → revalidated header, not `immutable`.
- M-5 Q1–Q8 decided as option A (Loc, 2026-11-13); none touches this slice.
