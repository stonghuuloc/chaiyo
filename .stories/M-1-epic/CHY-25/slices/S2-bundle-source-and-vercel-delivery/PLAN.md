# CHY-25 S2 — plan
ACs: AC1  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-25-S2 off main after S1 · run `pnpm install` first

## Files touched
- create: `src/lib/catalog/http.ts`
- edit: `src/lib/catalog/index.ts` (add the `catalog` instance)
- create: `src/lib/catalog/http.test.ts`
- create: `vercel.json`
- create: `src/routes/(app)/lesson/[id]/[section]/+page.ts`
- edit: `src/routes/(app)/lesson/[id]/[section]/+page.svelte`
No content, schema, lint or service-worker edit.

## Anchors (verified 2026-11-06 on main 23f1db9)
- `src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5` placeholder (`m.screen_lesson_section()` only); `src/routes/(app)/word/[id]/+page.svelte:1-5` placeholder (not touched).
- `src/routes/(app)/+layout.ts:4-8` `load` runs `requireSession`; `src/routes/+layout.ts:7-8` `ssr = false`, so the lesson `load` is browser-side.
- `package.json:8` `build` = `vite build`; `vite.config.ts:4,16-17` `adapter()` from `@sveltejs/adapter-vercel`; there is no `svelte.config.js`.
- `scripts/build-content.sh:1-5` import into `static/content`, then `pnpm fonts` into `static/fonts/lessons`; `.gitignore:41-42` ignores both. `package.json:19` `import:content`, `:25` `fonts`.
- `src/lib/content/import/bundle-sink.ts:11-25` `current.json` = `{ sha }`, written last; `:36-46` `<sha>/<id>.json`, `manifest.json`, `audio-manifest.json`.
- `README.md:37-47` the Vercel project (`chaiyo`, scope `stonghuulocs-projects`, main -> Production, PR -> Preview).
- S1 on disk after Task 1: `src/lib/catalog/index.ts` exports `createCatalog`, `CatalogSource`, `CatalogError`.
- Real content at 23f1db9 imports clean (`pnpm -s import:content content --sink memory --only lessons/hsk1` -> sha `7915681c…`, exit 0); `scripts/build-content.sh` then writes the 2 lessons + 2 fonts (verified on the Mac with `~/.capy/work/ft` activated).

## Task 1 [AC1] `httpSource` + URL/error tests
Files: create `src/lib/catalog/http.ts`, `src/lib/catalog/http.test.ts`
- Test first: the source is built from `await fixtureSource()` and a fake `fetch` over a `Map<string, Response>`:
  - `current()` requests exactly `/content/current.json` and returns the fixture sha;
  - `bundle(sha, 'h1-01')` requests exactly `/content/<sha>/h1-01.json`; the resulting `lesson('h1-01')` has title `Xin chào`, level 1, 10 words and the fixture sha;
  - `current.json` `{ sha: 'abc' }` -> `malformed`, id `current`;
  - 404 -> `not-found` id `h9-99`;
  - 500 -> `malformed`; body `not json` -> `malformed`;
  - a bundle body with `sha: 'f'.repeat(64)` -> `malformed` through S1's validation;
  - the URL list recorded by the spy is exactly `['/content/current.json', '/content/<sha>/h1-01.json']` for one lesson call.
- Change:
  ```ts
  export function httpSource(fetchFn: typeof fetch = fetch, base = '/content'): CatalogSource {
    const read = async (url: string, id: string) => {
      let res: Response;
      try { res = await fetchFn(url); } catch { throw new CatalogError('offline', id); }
      if (res.status === 404) throw new CatalogError('not-found', id);
      if (!res.ok) throw new CatalogError('malformed', id);
      try { return await res.json(); } catch { throw new CatalogError('malformed', id); }
    };
    return {
      current: async () => {
        const body = await read(`${base}/current.json`, 'current');
        const sha = body?.sha;
        if (typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha)) throw new CatalogError('malformed', 'current');
        return sha;
      },
      bundle: async (sha, id) => read(`${base}/${sha}/${encodeURIComponent(id)}.json`, id)
    };
  }
  ```
- Verify: `pnpm test -- src/lib/catalog/http.test.ts`.

## Task 2 [AC1] App instance
File: `src/lib/catalog/index.ts`
- Test first: `import { catalog } from './index'` in a test does not call `fetch` (the factory creates closures only); the existing catalog tests keep passing.
- Change: `import { httpSource } from './http'; export const catalog = createCatalog(httpSource());`
- Verify: `pnpm test -- src/lib/catalog`; `pnpm check` (the module is client-safe: `http.ts` has no `node:` import).

## Task 3 [AC1] Lesson route reads the bundle
Files: create `src/routes/(app)/lesson/[id]/[section]/+page.ts`; edit `+page.svelte`
- Test first: none (no component tests in this repo, `vite.config.ts:56-57`); the load is exercised by the browser check below. The Catalog test is the automated proof.
- Change:
  ```ts
  import { catalog } from '#lib/catalog/index.js';
  import type { PageLoad } from './$types';
  export const load: PageLoad = async ({ params }) => ({ content: await catalog.lesson(params.id) });
  ```
  The page keeps `m.screen_lesson_section()` as the section head, then renders `data.content.lesson.titleHanzi`, `title`, and each word as `hanzi pinyin — hanviet`, with `data-content-sha={data.content.contentSha}` on the root. No other section UI, no progress (CHY-31..35).
- Verify: `pnpm check` and `pnpm lint` green; the browser check below.

## Task 4 [AC1] `vercel.json`
File: create `vercel.json`
- Test first: `pnpm build` on a tree with `static/content/` present must put the bundles in the adapter output — it already does (the adapter copies `static/`); the new part is the command and headers, verified on the preview.
- Change:
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "python3 -m pip install --quiet -r scripts/requirements-fonts.txt && bash scripts/build-content.sh && pnpm build",
    "headers": [
      { "source": "/content/current.json", "headers": [{ "key": "Cache-Control", "value": "no-store" }] },
      { "source": "/content/:sha([0-9a-f]{64})/:file", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
      { "source": "/fonts/lessons/:file", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] }
    ]
  }
  ```
  `pnpm lint` (prettier) formats the JSON; do not hand-compress it.
- Verify: `pnpm lint`; `python3 -c "import json; json.load(open('vercel.json'))"`.

## Task 5 [AC1] Prove it
- On one tree: `pnpm test`, `pnpm check`, `pnpm lint` green.
- Mac, with fontTools (`source ~/.capy/work/ft/bin/activate` or a venv with `scripts/requirements-fonts.txt`): `bash scripts/build-content.sh` exits 0; `ls static/content/*/h1-01.json static/fonts/lessons/ukai-h1-01.woff2` finds both; `git status --porcelain` stays clean (both dirs are ignored).
- `PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder pnpm build` exits 0; `ls .vercel/output/static/content/*/h1-01.json` finds the bundle (the adapter copies `static/`).
- Preview deploy after the PR opens: `curl -s https://<preview>/content/current.json` -> `{ sha }`; `curl -sI .../content/current.json` -> `cache-control: no-store`; `curl -sI .../content/<sha>/h1-01.json` -> `cache-control: public, max-age=31536000, immutable`; `curl -sI .../fonts/lessons/ukai-h1-01.woff2` -> same; all 200. This is also the proof for Q2 (Python on Vercel).
- Browser, signed in (local Supabase session from CHY-2, or the hosted preview with the test account): `/lesson/h1-01/tu-moi` shows `你好 Xin chào`, the 10 words in lesson order, and `data-content-sha` = the sha from `current.json`.

## Mutation paths covered
- `current.json` valid / invalid sha / 404 / 500 / not JSON; `bundle` 404 / 500 / not JSON / wrong sha / wrong lesson id; the build command failing at import or at fonts (set -e) so no partial `/content/` is deployed; header rules overlapping (current.json matches only its own rule); a missing `static/content` at `vite build` (the build command creates it first).
- The route loads only the lesson id from the URL; a section id outside the bundle does not affect the read.

## Rollback
Delete `vercel.json`, `src/lib/catalog/http.ts`, `http.test.ts`, the route `+page.ts`, and revert the `+page.svelte` edit; production falls back to the default `pnpm build` (no `/content/` served). S1 stays green.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
The `httpSource` and `vercel.json` blocks above are drafts only. A preview deploy that fails at `pip install` is reported to the Captain as Q2, not worked around by dropping fonts.
