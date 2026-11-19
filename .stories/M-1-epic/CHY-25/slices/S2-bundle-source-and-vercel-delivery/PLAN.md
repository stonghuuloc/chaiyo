# CHY-25 S2 — plan
ACs: AC1  ·  Spec rev 3  ·  Repo: stonghuuloc/chaiyo  ·  Branch: stonghuuloc/CHY-25-S2 (off `CHY-40-S1` = wave-1 stack tip)
Base: .@a65f4297

Run `pnpm install` first. Node 24 (`source ~/.nvm/nvm.sh && nvm use 24`).

## Files touched
- create: `src/lib/catalog/http.ts`, `src/lib/catalog/app.ts`, `src/lib/catalog/http.test.ts`, `src/lib/catalog/fixtures/http.ts`
- create: `src/routes/(app)/lesson/[id]/+layout.ts`, `layout.test.ts`, `+page.ts`, `+page.svelte`
- create: `vercel.json`
- edit: `.github/workflows/ci.yml` (one step before `:52`)
- Not touched: `src/lib/catalog/index.ts`, `[section]/*`, `gate/*`, `src/service-worker/**`, `messages/vi.json`, content, schemas, lint.

## Anchors (verified 2026-11-16 on a65f4297)
- `src/lib/catalog/index.ts:6-9` `CatalogSource`; `:11` `CatalogErrorCode`; `:13-20` `class CatalogError(code, id)`; `:22-32` `LessonContent`; `:75` `createCatalog(source)`; `:87-95` `lesson(id)`: `current()` → `bundle(sha, id)` → checks sha + lesson id.
- `src/lib/catalog/fixtures/source.ts:8` `fixtureSource()`: imports `fixtures/ok`, `current()` = content sha, `bundle()` = `buildBundle(content, id)`; throws `not-found` for an unknown id.
- `src/lib/catalog/catalog.test.ts:17-40` the AC1 assertion shape (title, level, 10 word ids 你…再见, 64-hex sha).
- `src/routes/(app)/lesson/[id]/[section]/+page.ts:3`, `gate/+page.ts:3`: `{ shell: { template: 'focus' } }` only. No `lesson/[id]/+layout.ts` or `+page.*`.
- `src/routes/(app)/pinyin/+page.ts:3-6` load with a typed plain arg + `shell: { template: 'pushed', section: 'roadmap' } satisfies Shell`; `pinyin/chart.test.ts:162-173` calls `load` directly.
- `src/routes/+layout.ts:8` `ssr = false`; `src/routes/(app)/+layout.ts:5-10` `requireSession`.
- `src/lib/shell/template.ts:3-6` `Shell` type.
- `vite.config.ts:4,25` adapter-vercel; `:50-58` vitest `server` project = `src/**/*.test.ts` in node.
- `scripts/build-content.sh:1-5`; `scripts/requirements-fonts.txt` (fonttools 4.68.0, brotli 1.2.1); `package.json:8` `build`, `:31` `fonts`.
- `.github/workflows/ci.yml:28-30` setup-python 3.12, no pip install; `:36` fixture import; `:52-53` `pnpm build`.
- `.gitignore:43-44` ignores `static/content/`, `static/fonts/lessons/`; `.prettierignore` ignores `/static/`.

## Task 1 [AC1] `httpSource` throws CatalogError itself
Files: create `src/lib/catalog/fixtures/http.ts`, `src/lib/catalog/http.test.ts`, `src/lib/catalog/http.ts`
- Fixture: `async fakeFetch(overrides?)` (awaits `fixtureSource()`, `fixtures/source.ts:8`) builds a `Map<url, () => Response | Promise<never>>` from `fixtureSource()`: `/content/current.json` → `{ sha }`, `/content/<sha>/h1-01.json` and `h0-00.json` → `JSON.stringify(bundle)`. Unknown URL → 404. It returns `{ fetch, urls }`; `urls` records every request. Used by Task 1 and Task 3.
- Test first (`http.test.ts`, Arrange/Act/Assert):
  - `Given_HttpSource_When_LessonH1_01_Then_XinChao_Level1_TenWords_Sha`: `createCatalog(httpSource(f.fetch)).lesson('h1-01')` → title, level, ids 你…再见, 64-hex sha. `f.urls` = `['/content/current.json', '/content/<sha>/h1-01.json']`.
  - `…When_BundleFetchRejects_Then_Offline_NamingId`: only `/content/<sha>/h1-01.json` rejects with `TypeError` (`current.json` still answers, since `lesson()` calls `current()` first, `index.ts:88-89`) → `CatalogError` code `offline`, id `h1-01`.
  - `…When_Bundle404_Then_NotFound_NamingId` → `not-found` `h9-99`.
  - `…When_Bundle500_Then_Malformed`, `…When_BodyNotJson_Then_Malformed` → `malformed` `h1-01`.
  - `…When_CurrentShaNotHex_Then_Malformed_Current`: `{ sha: 'abc' }` → `malformed` `current`, `f.urls.length === 1`.
  - `…When_CurrentRejects_Then_Offline_Current` → `offline` `current`.
- Change: `http.ts` per the draft below. No `fetchFn` → `globalThis.fetch(url)` at call time.
- Verify: `pnpm vitest --run src/lib/catalog`.

## Task 2 [AC1] App-wide `catalog`
File: create `src/lib/catalog/app.ts`
- Change: `export const catalog = createCatalog(httpSource());`. It sits outside `index.ts` to avoid an `index ↔ http` import cycle.
- Test: covered by Task 3 (load through the real singleton). Importing `app.ts` makes no request; Task 3 asserts `urls` is empty before `load` runs.
- Verify: `pnpm check`.

## Task 3 [AC1] Lesson layout load → `{ lesson: LessonContent }`
Files: create `src/routes/(app)/lesson/[id]/+layout.ts`, `src/routes/(app)/lesson/[id]/layout.test.ts`
- Test first (`layout.test.ts`): `vi.stubGlobal('fetch', f.fetch)` FIRST, then `const { load } = await import('./+layout')` (a static import would run before the stub and make the no-request check vacuous); `afterEach(vi.unstubAllGlobals)`.
  - `Given_FetchServesBundles_When_LoadH1_01_Then_LessonXinChao_WithSha`: `f.urls` is `[]` after import. `await load({ params: { id: 'h1-01' } })` → `lesson.lesson.title === 'Xin chào'`, `lesson.words.length === 10`, `lesson.contentSha` 64-hex.
  - `…When_LoadUnknownId_Then_RejectsNotFound_h9_99`.
- Change: `export const load = async ({ params }: { params: { id: string } }) => ({ lesson: await catalog.lesson(params.id) });`. The plain-arg type follows `pinyin/+page.ts:3`, so the test can call it directly. `pnpm check` must still accept it as a `LayoutLoad`.
- Verify: `pnpm vitest --run "src/routes/(app)/lesson"`.

## Task 4 [AC1] Minimal hub proof page
Files: create `src/routes/(app)/lesson/[id]/+page.ts`, `+page.svelte`
- `+page.ts`: `export const load = () => ({ shell: { template: 'pushed', section: 'roadmap' } satisfies Shell });`.
- `+page.svelte` (`<script lang="ts">`, `let { data }: PageProps = $props()`):
  - root `<section data-content-sha={data.lesson.contentSha}>`;
  - `<h1>{data.lesson.lesson.titleHanzi} {data.lesson.lesson.title}</h1>`;
  - `<ol>` of `data.lesson.words` as `{w.hanzi} {w.pinyin} — {w.hanviet}`.
  - Fields (verified): `Lesson`/`Primer` both have `title`, `titleHanzi` (`schemas.ts:191-192`, `:233-234`); `ImportedWord` (`import/sink.ts:19`) = `Word` with `hanzi`, `pinyin`, optional `hanviet` (`schemas.ts:43-48`) — print `hanviet` only when present.
  - No new `messages/vi.json` key; CHY-31.S1 replaces this body.
- Test: no component test (the proof is the browser check in Task 7); `pnpm check` types the `data.lesson` access.
- Verify: `pnpm check && pnpm lint`.

## Task 5 [AC1] `vercel.json`
File: create `vercel.json`
- Change: draft below. Format it with `pnpm format vercel.json`; do not hand-compress.
- Verify: `pnpm lint`; `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8'))"`.

## Task 6 [AC1] CI builds the real content
File: `.github/workflows/ci.yml`
- Change: insert before `- run: pnpm build` (`:52`):
  ```yaml
      - run: pip install -r scripts/requirements-fonts.txt && bash scripts/build-content.sh
        if: ${{ !cancelled() }}
  ```
  Python 3.12 is already set up at `:28-30`. The fixture import at `:36` stays.
- Verify: the PR's `CI / web` job runs the step green and `pnpm build` after it.

## Task 7 [AC1] Prove it (one run on the final tree)
- `pnpm test`, `pnpm check`, `pnpm lint`, each green. Run `pnpm lint` raw, not through rtk: rtk hides a prettier failure.
- Build, with a fontTools venv (`python3 -m venv /tmp/ft && /tmp/ft/bin/pip install -r scripts/requirements-fonts.txt && source /tmp/ft/bin/activate`):
  - `bash scripts/build-content.sh` exits 0;
  - `PUBLIC_SUPABASE_URL=http://127.0.0.1:56321 PUBLIC_SUPABASE_PUBLISHABLE_KEY=ci-placeholder pnpm build` exits 0;
  - `ls .vercel/output/static/content/*/h1-01.json .vercel/output/static/fonts/lessons/ukai-h1-01.woff2` finds both;
  - `git status --porcelain` shows no new file.
- Browser: dev server on port 5412 (`--strictPort`), signed in with local Supabase. Open `/lesson/h1-01`.
  - Screenshot shows `你好 Xin chào` and 10 words, 你 first, 再见 last.
  - `document.querySelector('[data-content-sha]').dataset.contentSha` equals the sha in `/content/current.json`.
- Handoff (not an agent proof; Vercel blocks non-team authors): on the first team-authored deploy, `curl -sI` checks the 3 header paths for `no-store`, `immutable` and `must-revalidate`, all 200.

## Mutation paths covered
- Reads only. `current.json`: ok / non-hex sha / 404 / 500 / rejects. Bundle: ok / 404 / 500 / not JSON / rejects. Wrong sha or lesson id inside the bundle: S1 `lesson()` checks (`index.ts:92`).
- Callers of the seam: hub `+page.svelte` (Task 4). `[section]` and `gate` inherit `data.lesson` without an edit.
- Build: `set -euo pipefail` (`build-content.sh:2`) fails the deploy before `pnpm build`, so no partial `/content/` ships.

## Rollback
Revert this slice's commits. Production then falls back to the default `pnpm build`, which serves no `/content/`. S1 stays green. No migration.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what is on disk)
A self-contradictory fixture must be reported, not hacked around to make tests pass.
```ts
// src/lib/catalog/http.ts
import { CatalogError, type CatalogSource } from './index';
import type { Bundle } from '../content/import/bundle';

type Fetch = (url: string) => Promise<Response>;

export function httpSource(fetchFn?: Fetch, base = '/content'): CatalogSource {
	const get: Fetch = fetchFn ?? ((url) => globalThis.fetch(url));
	const read = async (url: string, id: string): Promise<unknown> => {
		let res: Response;
		try {
			res = await get(url);
		} catch {
			throw new CatalogError('offline', id);
		}
		if (res.status === 404) throw new CatalogError('not-found', id);
		if (!res.ok) throw new CatalogError('malformed', id);
		try {
			return await res.json();
		} catch {
			throw new CatalogError('malformed', id);
		}
	};
	return {
		async current() {
			const sha = ((await read(`${base}/current.json`, 'current')) as { sha?: unknown })?.sha;
			if (typeof sha !== 'string' || !/^[0-9a-f]{64}$/.test(sha))
				throw new CatalogError('malformed', 'current');
			return sha;
		},
		bundle: async (sha, id) =>
			(await read(`${base}/${sha}/${encodeURIComponent(id)}.json`, id)) as Bundle
	};
}
```
```json
{
	"$schema": "https://openapi.vercel.sh/vercel.json",
	"buildCommand": "bash scripts/vercel-build.sh",
	"headers": [
		{ "source": "/content/current.json", "headers": [{ "key": "Cache-Control", "value": "no-store" }] },
		{ "source": "/content/:sha([0-9a-f]{64})/:file", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
		{ "source": "/fonts/lessons/:file", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] }
	]
}
```
