# CHY-25 — Catalog: content reads + offline

Backlog: `backlog/tasks/chy-25 - Catalog-content-reads-offline.md` · Milestone m-3 (Core ledger/offline) · owns `src/lib/catalog/` and `vercel.json`

## Goal (business why, 1-2 sentences)
Screens read a lesson, its words, characters and tap lookups from the versioned per-lesson JSON bundle, and every result carries the same `contentSha`. A lesson opened online reopens offline from the service-worker cache; a lesson never opened says "cần mạng".

## Context an agent can't derive from code
- ADR 0002 (`docs/adr/0002-lesson-content-as-static-bundles.md:11-19`): one static JSON bundle per lesson, the URL carries the sha, the service worker caches it; Postgres keeps the Dictionary, `questions`/`content_versions` and the Admin mirror. `docs/architecture.md:29`: Catalog = `lesson`, `word`, `char`, `lookup`, `entry`; bundle results carry `contentSha?`; works offline for an opened lesson.
- C3 is on main: `Bundle` = `{ sha, lesson, sentences, questions, grammar, words, chars, gateCoverage, thin }` (`src/lib/content/import/bundle.ts:6-16`). `words` are `ImportedWord` with `taughtIn` and `listedIn` (`import/sink.ts:19`). A sentence's `seg` tokens concatenate to its `hanzi`, punctuation as its own token (`derive/seg.ts:25-37`). `thin` holds one entry per hanzi word in the bundle plus each of its chars (`derive/thin.ts:40-58`), so tap lookup needs no Dictionary.
- Bundle URLs: `static/content/current.json` = `{ sha }`, then `static/content/<sha>/<id>.json`, written by `createBundleSink` (`import/bundle-sink.ts:11-55`). `.gitignore:41-42` ignores `static/content/` and `static/fonts/lessons/`. No `vercel.json` exists; the default build is `pnpm build` (`package.json:8`), so production serves no `/content/` today.
- Build chain: `scripts/build-content.sh:1-5` imports `content` scoped to `lessons/hsk1` into `static/content`, then runs `pnpm fonts`; the latter needs Python fontTools (`package.json:25`, `scripts/requirements-fonts.txt`). Verified on main `23f1db9` (2026-11-06): the scoped import exits 0 with sha `7915681c…`; the bundle sink writes `h1-01.json` (32,281 B) and `h0-00.json` (29,321 B); the font step writes `ukai-h1-01.woff2` (22,776 B, 88 glyphs) and `ukai-h0-00.woff2` (8,512 B, 30 glyphs) with the Mac venv. The content gate CHY-8 S3 set for this story's `vercel.json` is met.
- Service worker: `SHELL = [...immutable, ...assets, ...prerendered]` (`src/service-worker/index.ts:9-11`), precached at install (`:13-15`) and served cache-first (`:32-34`). SvelteKit's `$app/manifest.assets` lists every file under `static/` at build, so bundles built before `vite build` are precached: a local `pnpm build` at 23f1db9 with `static/content` present emits a `service-worker.js` asset list holding `content/7915681c…/h1-01.json`, `content/current.json` and `fonts/lessons/ukai-*.woff2` — every lesson would work offline, which breaks AC6. Both rules are frozen elsewhere: C3 is frozen at rev 3 (`.stories/M-1-epic/CHY-10/slices/S2-prototype-parity/DISCUSSION.md:17`; `.stories/M-2-epic/WAVE-PLAN.md` "C3 (frozen rev 3)"), and CHY-8 S3 decided `static/` is precached per deploy (`.stories/M-1-epic/CHY-8/slices/S3-sinks-bundle-postgres-audio-manifest/DISCUSSION.md:7`). S3 reverses that decision for `/content/`; S3 DISCUSSION D4 cites both. `networkFirst` awaits the cache write only for `/content/<64 hex>/<file>.json` and defers every other GET (`src/service-worker/network.ts:1,12-14`), so `/content/current.json` is not awaited today (S3 DISCUSSION D5). A client-side navigation to a lesson creates no document request, so the lesson document is not in the SW cache when the user reloads offline; the S3 navigation fallback (`/today`, app pages are `ssr = false`, network first and shell only when the network fails) closes that gap (S3 DISCUSSION D6).
- Offline auth already tolerates a failed token refresh: `requireSession` keeps the stored session when the refresh error is retryable (`src/lib/shell/guard.ts:6-10`). App pages are a client-rendered SPA (`src/routes/+layout.ts:7-8`), so a lesson route's `load` runs in the browser.
- The lesson and word routes are placeholders (`src/routes/(app)/lesson/[id]/[section]/+page.svelte:1-5`, `src/routes/(app)/word/[id]/+page.svelte:1-5`); their bodies belong to CHY-31..35. `docs/screens.md:126` is the lesson screen (L1); the "cần mạng" CTA wording is the Today screen's T1 state at `docs/screens.md:114`, which AC6 borrows.

## Locked decisions (BA/Loc already ruled — never re-open)
- ADR 0002: per-lesson JSON bundle served same-origin by Vercel; the URL carries `contentSha`; the service worker caches it; Postgres is not the lesson source.
- CHY-7 (Loc, 2026-11-03): `contentSha` is optional on Catalog results — present on bundle results, absent on Dictionary rows; no `search(query)`; `entry(hanzi)` only, and the 122k Dictionary load is parked.
- CHY-8 S3 / CHY-69 (LOC-10): a bundle URL is `/content/<64 hex>/<file>.json`, and the worker awaits its cache write; the bundle URL shape does not change. The `current.json` await and the `/content/` precache filter are S3 design decisions, not locks, and are cited in S3 DISCUSSION D4/D5.
- CHY-13: `pnpm fonts` writes `static/fonts/lessons/ukai-<lessonId>.woff2`; the names carry no hash, so this story gives them a revalidated cache header, not `immutable` (S2 SPEC).
- Scope fence: this PR is the design only. It touches no `lint/**`, `content/`, `schemas.ts` or source code; slices run as later PRs.

## Ownership and order
- Slice order: S1 → S2 → S3, one PR each; S1 is the only slice with no build/SW dependency.
- S2 owns `vercel.json`, the CI real-content build step in `.github/workflows/ci.yml`, and the minimal lesson route `load`.
- S3 owns `src/service-worker/**`: the `/content/` precache filter, the awaited `current.json` write and the `/today` navigation fallback.
- M-2: `.stories/M-2-epic/WAVE-PLAN.md` says CHY-16 S2 also writes `src/service-worker/**` and rebases on whichever lands first. Q4 asks the M-2 plan to fix the order and the owner.

## AC index

| # | AC (≤12 words) | Pri | Slice |
|---|----|-----|-------|
| AC1 | Bài 1 lesson loads from the bundle Source | high | S2 |
| AC2 | Word and char reads carry contentSha and lesson links | high | S1 |
| AC3 | Tap lookup returns the word under the tap | high | S1 |
| AC4 | Unknown lesson id fails clearly, naming the id | high | S1 |
| AC5 | Opened lesson reopens offline with the same contentSha | high | S3 |
| AC6 | Unopened lesson offline reports unavailable; screen "cần mạng" | high | S3 |
| AC7 | Tests use the fixture Source, never the network | high | S1 |

## Out of scope
- `entry(hanzi)` and the 122k Dictionary (parked DB load); X1 outside lesson text.
- Screen bodies: lesson hub and sections (CHY-31..35), Word Page W1 (CHY-32), audio player offline (CHY-16), PWA install/update (CHY-61), app-shell precache beyond the `/content/` exclusion.
- Postgres content reads, content authoring and import (CHY-8..13), per-lesson font loading in the app (CHY-35).

## Open questions for the owner

| # | Question | Options | Recommendation | If wrong |
|---|---|---|---|---|
| Q1 | How does a cold `word(id)` / `char(hanzi)` / `lookup(...)` resolve when no lesson is loaded in this session (hard reload on `/word/你好`, or X1 outside a lesson)? The bundle holds the word data, but an id alone names no lesson. | A accept "not found until a lesson is loaded"; B add `?lesson=<id>` to the Word Page URL and load that bundle; C online, query Supabase `words.taught_in` first, then fetch the bundle | B, in CHY-32; CHY-25 AC2 passes because the word card and X1 open inside a lesson | AC2 still passes, but ADR 0002's "Word Page for an unopened lesson needs the network" (`docs/adr/0002-lesson-content-as-static-bundles.md:31`) stays unmet; C adds a Supabase read to Catalog |
| Q2 | May the Vercel build install Python fontTools (`python3 -m pip install -r scripts/requirements-fonts.txt`) so `scripts/build-content.sh` can run `pnpm fonts`? | A yes, in `vercel.json` `buildCommand`; B build the fonts in CI and publish them with the deploy; C commit the subset woff2 files | A; the local `build-content.sh` proves the chain, and the first **team-authored** deploy (merge commit or a branch pushed by a team member) proves the pip step, because agent commits cannot create Vercel deployments | a team deploy fails visibly and the fallback is B; C contradicts CHY-13's generated output |
| Q3 | AC5 after a client-side navigation needs an app-shell navigation fallback in the service worker (the common flow never requests the lesson document). The PWA shell is CHY-61's area, not this story's. | A add the minimum fallback in S3 (CHY-25): network first, shell only when the network fails; B leave it to CHY-61 and mark AC5 as "direct load only" | A — AC5 cannot pass in the normal flow without it; CHY-61 can replace it later | B keeps the story honest but AC5 fails when the learner reaches the lesson from the hub; a note on the ticket would be needed |
| Q4 | `.stories/M-2-epic/WAVE-PLAN.md` says CHY-16 S2 also writes `src/service-worker/**` and rebases on whichever lands first, but no plan states who owns the service worker or whether CHY-25 S3 or CHY-16 S2 lands first. | A CHY-25 S3 lands first (filter, `current.json`, fallback), then CHY-16 S2 rebases; B CHY-16 S2 first and CHY-25 S3 rebases; C split ownership of the worker | A — AC5/AC6 are the current priority and S3 changes the precache list CHY-16 would touch; the M-2 plan should record the order and owner | B puts CHY-25 S3 behind an M-2 dependency; C leaves two writers on one file |
