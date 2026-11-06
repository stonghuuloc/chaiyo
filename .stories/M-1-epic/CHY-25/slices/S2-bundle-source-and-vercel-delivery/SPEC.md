# CHY-25 S2 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (design; anchors on main 23f1db9, 2026-11-06)

## Behaviour
- [AC1] `src/lib/catalog/http.ts` exports `httpSource(fetchFn: typeof fetch = fetch, base = '/content'): CatalogSource` (the interface from S1). `current()` = `GET <base>/current.json`, parsed as `{ sha }`; a sha that is not 64 lowercase hex throws `CatalogError` code `malformed` with id `current`. `bundle(sha, id)` = `GET <base>/<sha>/<id>.json`; a 404 throws `not-found` with the lesson id, another non-ok status or unparsable JSON throws `malformed` with the lesson id, and a rejected `fetch` throws `offline` with the lesson id (the screen for that code is S3).
- [AC1] `src/lib/catalog/index.ts` exports `catalog = createCatalog(httpSource())`, the app-wide instance. It is created at module load but performs no request until `lesson` is called; tests import the module without touching the network.
- [AC1] `src/routes/(app)/lesson/[id]/[section]/+page.ts` loads `catalog.lesson(params.id)` and returns `{ content }`; `+page.svelte` renders the lesson's `titleHanzi` and `title` and every word of `content.words` in lesson order as `hanzi pinyin — hanviet`, and puts `data-content-sha={content.contentSha}` on the root element. This is the minimum that proves the bundle read path and the element the S3 verify reads; section bodies, progress and the resume CTA belong to CHY-31..35.
- [AC1] `vercel.json` (new, repo root):
  - `buildCommand`: `python3 -m pip install --quiet -r scripts/requirements-fonts.txt && bash scripts/build-content.sh && pnpm build` — the production build writes `static/content/` and `static/fonts/lessons/` before `vite build`. `scripts/build-content.sh` is `set -euo pipefail`, so a failed import or font subset fails the deploy instead of shipping a partial `/content/`.
  - `headers`: `GET /content/current.json` -> `Cache-Control: no-store`; `GET /content/<64 hex>/<file>` -> `public, max-age=31536000, immutable`; `GET /fonts/lessons/<file>` -> the same immutable value. The sha folder never changes, so immutable is safe; `current.json` must not be reused across deploys because it names the current sha.
- [AC1] At main 23f1db9 the build chain already works on a machine with fontTools: `pnpm -s import:content content --sink memory --only lessons/hsk1` exits 0 with sha `7915681c…`; `bash scripts/build-content.sh` writes `static/content/7915681c…/{h0-00,h1-01,manifest,audio-manifest}.json`, `static/content/current.json`, and `static/fonts/lessons/ukai-{h0-00,h1-01}.woff2`. `pnpm build` copies them to `.vercel/output/static/content/…`. Nothing else is missing on this side.
- [NFR] No new dependency; `vercel.json` is the only build configuration added (no `svelte.config.js`). The route stays behind the existing `(app)` auth load (`src/routes/(app)/+layout.ts:4-8`), which is browser-side because app pages are SPA (`src/routes/+layout.ts:7-8`).

## Fixtures (described, not committed code)
- `src/lib/catalog/http.test.ts` serves `Response` objects from a map keyed by exact URL: `/content/current.json` -> `{ sha: <fixture sha> }`; `/content/<fixture sha>/h1-01.json` -> the fixture bundle from `fixtures/source.ts`; `/content/<fixture sha>/h0-00.json` -> the Primer. A `fetch` spy records the URLs, so the request shape is asserted, not just the result.
- No test starts a server and no test reaches the network; the fake fetch is the only transport.
- Manual fixture: the real content build (`bash scripts/build-content.sh`) produces the same URL shape at `static/content/`, which `pnpm build` and the Vercel preview serve.

## Negative controls
- `current.json` = `{ sha: 'abc' }` -> `malformed` id `current` (no request for a bundle).
- `GET /content/<sha>/h9-99.json` = 404 -> `not-found` naming `h9-99`.
- 500, or a body that is not JSON -> `malformed` naming the lesson id.
- Bundle body with a `sha` different from the URL sha -> `malformed` (S1 validation; exercised here through the HTTP source).
- Header checks on the preview: `current.json` must not answer `immutable`; a bundle under `/content/<sha>/` must answer `immutable`; `/content/current.json` must not be cached by the browser HTTP cache across a deploy.
- Build: a deliberately broken content file makes `scripts/build-content.sh` exit 1 and the deploy fail; the deploy must never publish a `current.json` that points at a missing sha.

## Not this slice
- The SW precache exclusion, the awaited `current.json` write, the offline error screen and `cần mạng` (S3).
- The Word Page body (CHY-32), section bodies and lesson hub (CHY-31..35), font `@font-face` loading (CHY-35), audio.
- Vercel project settings outside `vercel.json`; custom domains; preview redirects (CHY-63).

## Seam
`src/lib/catalog/http.ts` (new), `src/lib/catalog/index.ts` (adds the `catalog` instance), `src/routes/(app)/lesson/[id]/[section]/+page.ts` (new) and `+page.svelte` (body replaced), `vercel.json` (new). No content, schema, lint or SW edit.

## Test contract
- vitest `src/lib/catalog/http.test.ts`: the URL sequence `current.json` then `<sha>/h1-01.json`; the parsed `LessonContent` (title `Xin chào`, level 1, 10 words, sha); every negative control above. `pnpm test -- src/lib/catalog` green.
- Mac build (manual, one run on the final tree): `source ~/.capy/work/ft/bin/activate` (or a venv with `scripts/requirements-fonts.txt`), then `bash scripts/build-content.sh` exits 0; `ls static/content/*/h1-01.json static/fonts/lessons/ukai-h1-01.woff2` finds both; `PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder pnpm build` exits 0 and `.vercel/output/static/content/<sha>/h1-01.json` exists. Both output dirs are git-ignored; `git status` stays clean.
- Vercel preview (manual, after the PR opens): `curl -sI https://<preview>/content/current.json` -> 200 with `cache-control: no-store`; `curl -s https://<preview>/content/current.json` -> the sha; `curl -sI https://<preview>/content/<sha>/h1-01.json` -> 200 with `immutable`; `curl -sI https://<preview>/fonts/lessons/ukai-h1-01.woff2` -> 200 with `immutable`. The preview deploy is also the proof for the Python/fontTools assumption (Q2).
- Browser (manual, signed-in session — local Supabase from CHY-2 or the hosted preview with the test account): `/lesson/h1-01/tu-moi` shows `你好 Xin chào`, the 10 words in lesson order, and `data-content-sha` equals the sha from `current.json`.

## Open assumptions
- [AC1] The Vercel build image provides `python3` and `python3 -m pip` (Q2, 80%). Wrong pick: the preview deploy fails at `pip install`, visible before merge; fallback is Q2-B (build fonts in CI) or `installCommand`.
- [AC1] `headers` in `vercel.json` apply to the static files the adapter copies into the output. Vercel documents header rules as applying to matching requests, including static files; the preview curl is the check.
- [AC1] `pnpm fonts` needs `fontTools` + `brotli` only (`scripts/requirements-fonts.txt`); if the Vercel pip step needs a build tool for `brotli`, the pinned wheels cover linux-x86_64. Verified locally on macOS arm64 only; the preview is the linux check.
- [AC1] The route's `load` runs in the browser (root `ssr = false`); if a later change opts app pages back into SSR, the `catalog` instance must be given the SvelteKit `fetch`.
