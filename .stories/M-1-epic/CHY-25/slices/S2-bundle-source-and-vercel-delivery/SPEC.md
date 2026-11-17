# CHY-25 S2 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 3 (re-based on a65f4297, 2026-11-16)

## AC1 (verbatim, backlog `chy-25` :30-35)
> Scenario: Bài 1 loads from the Source chosen in C1 — Given the Source chosen in C1 is configured, When I call lesson("h1-01"), Then the result has title "Xin chào" and level 1, And it lists the 10 Bài 1 words from 你 to 再见, And it carries a non-empty contentSha.

## Behaviour
- [AC1] `src/lib/catalog/http.ts` exports `httpSource(fetchFn?, base = '/content'): CatalogSource`. With no `fetchFn` it calls `globalThis.fetch` at request time (not at import).
- [AC1] `current()` = `GET <base>/current.json` → `{ sha }`. A sha that is not 64 lowercase hex → `CatalogError('malformed', 'current')`, and no bundle request follows.
- [AC1] `bundle(sha, id)` = `GET <base>/<sha>/<id>.json`, id URL-encoded.
- [AC1] Errors, thrown by the Source itself (S1 verify decision, Loc 2026-11-16), for both requests (id = lesson id, or `current` for `current.json`):

  | Response | Throws |
  |---|---|
  | `fetch` rejects (no network) | `offline`, id |
  | 404 | `not-found`, id |
  | other non-2xx, or body not JSON | `malformed`, id |

- [AC1] `src/lib/catalog/app.ts` (new) exports `catalog = createCatalog(httpSource())`, one app-wide instance (S1's per-session bundle cache lives in it). Importing it makes no request. It is not in `index.ts`: `http.ts` imports `CatalogError` from `index.ts`, and the fixture Source imports `index.ts` too.
- [AC1] `src/routes/(app)/lesson/[id]/+layout.ts` `load({ params })` returns `{ lesson: await catalog.lesson(params.id) }` (type `LessonContent`). Every child route (`[section]`, `gate`, the hub) reads `data.lesson`; none calls the catalog itself. A `CatalogError` propagates out of `load` (its screens are S3 / parked).
- [AC1] Hub proof: `lesson/[id]/+page.ts` returns `{ shell: { template: 'pushed', section: 'roadmap' } }`; `+page.svelte` renders `titleHanzi`, `title` and each of `data.lesson.words` in order as `hanzi pinyin — hanviet`, and sets `data-content-sha` on its root. CHY-31.S1 replaces the body; no new `messages/vi.json` key.
- [AC1] `vercel.json` (new, repo root):
  - `buildCommand` = `python3 -m pip install --quiet -r scripts/requirements-fonts.txt && bash scripts/build-content.sh && pnpm build`.
  - `headers` (Cache-Control):

    | Path | Cache-Control |
    |---|---|
    | `/content/current.json` | `no-store` |
    | `/content/<64 hex>/<file>` | `public, max-age=31536000, immutable` |
    | `/fonts/lessons/<file>` | `public, max-age=0, must-revalidate` |

- [AC1] `.github/workflows/ci.yml` web job: before `pnpm build` (`:52`), add a step that runs `pip install -r scripts/requirements-fonts.txt` and then `bash scripts/build-content.sh`. A content or font break fails CI, not only the deploy.
- [NFR] No new npm dependency. No `svelte.config.js`. No service-worker, content, schema or lint edit.

## Not this slice
- SW precache filter, awaited `current.json`, offline reopen, "cần mạng" screen (S3 — AC5, AC6).
- A not-found lesson screen: AC4 (S1) proves the catalog error. No AC names a route screen, so this is parked.
- Hub body: section rows, progress, resume CTA (CHY-31.S1). Section bodies (CHY-32..35). Word Page (CHY-32.S2).
- Vercel project settings outside `vercel.json`; preview redirects (CHY-63).

## Seam
`src/routes/(app)/lesson/[id]/+layout.ts` load → `{ lesson: LessonContent }`, backed by `catalog` (`src/lib/catalog/app.ts`) over `httpSource` (`src/lib/catalog/http.ts`).

## Test contract
- [AC1] vitest `src/lib/catalog/http.test.ts`, fake fetch over a URL map serving the fixture bundles. `catalog.lesson('h1-01')` over `httpSource` returns title `Xin chào`, level 1, the 10 word ids 你…再见 in order, and a 64-hex `contentSha`. The recorded URLs are exactly `['/content/current.json', '/content/<sha>/h1-01.json']`.
- [AC1] Same file, one negative control per error-table row:
  - bundle fetch rejects (`current.json` answers) → `offline` `h1-01`; `current.json` fetch rejects → `offline` `current`.
  - 404 → `not-found` `h9-99`.
  - 500 → `malformed` `h1-01`; non-JSON body → `malformed` `h1-01`.
  - `current.json` `{ sha: 'abc' }` → `malformed` `current`, with 1 recorded URL only.
- [AC1] vitest `src/routes/(app)/lesson/[id]/layout.test.ts`: with `globalThis.fetch` stubbed to the same map, `load({ params: { id: 'h1-01' } })` (module imported after the stub; 0 requests before `load`) returns `lesson.lesson.title === 'Xin chào'` and a 64-hex `lesson.contentSha`. With 404, it rejects with `not-found` `h9-99`. This proves the singleton wiring and the lazy `globalThis.fetch`.
- [AC1] Manual build, one run on the final tree, with a fontTools venv:
  - `bash scripts/build-content.sh` exits 0.
  - `PUBLIC_SUPABASE_URL=… pnpm build` exits 0, and `.vercel/output/static/content/<sha>/h1-01.json` exists.
  - `git status` stays clean.
- [AC1] Browser, signed in, `pnpm preview` or dev: `/lesson/h1-01` shows `你好 Xin chào` and the 10 words in order. `data-content-sha` equals the sha in `/content/current.json`.
- [CHORE] CI: the new web-job step is green on the PR.
- [AC1] Team-authored Vercel deploy (handoff, not an agent proof — Vercel blocks non-team authors): `curl -sI` on the 3 header paths shows the 3 values above.

## Open assumptions
- [AC1] The Vercel build image has `python3 -m pip` (D3, 80%). If wrong, the first team deploy fails at `pip install`. Fallback: build the fonts in CI.
- [AC1] `vercel.json` `headers` apply to the static files adapter-vercel emits. The team-deploy curl is the check.
