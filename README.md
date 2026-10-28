# Chaiyo!

Vietnamese-first HSK1→5 Mandarin study app. Phone-first PWA: SvelteKit (SPA app pages, pre-rendered Landing Page), Tailwind CSS v4, Supabase, Vercel.

| Read | For |
|---|---|
| `PRODUCT.md`, `CONTEXT.md` | what the app is; domain terms |
| `docs/architecture.md` | module design (Study, Ledger, Catalog, Importer, …) |
| `docs/content-schema.md` | lesson content YAML → Postgres |
| `docs/adr/` | decisions (0001: SvelteKit over Nuxt) |
| `DESIGN.md`, `design.tokens.json` | visual system; tokens are the source for CSS |
| `prototype/` | static HTML prototype (serve the repo root, open `prototype/home-glass.html`) |

## Develop

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # svelte-check + service-worker types
pnpm lint         # prettier + eslint
pnpm test         # vitest
pnpm build        # Vercel adapter output
```

Node 22+ and pnpm. Local Supabase (Docker required):

1. Install the CLI: `brew install supabase/tap/supabase`
2. Start Docker.
3. `supabase start`. The first run pulls the images. chaiyo uses its own ports (API 56321, Studio http://127.0.0.1:56323), so it runs beside another local Supabase project. Stop it with `supabase stop`.
4. `cp .env.example .env`
5. Paste the printed Project URL into `PUBLIC_SUPABASE_URL` and the Publishable key into `PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Generated files

| Command | From | To |
|---|---|---|
| `pnpm tokens` | `design.tokens.json` | `src/lib/styles/tokens.css`, a Tailwind `@theme` (never edit by hand) |
| `pnpm icons` | `assets/brand/source.png` | `static/brand/*` (logo, PWA icons, favicon) |
| `pnpm check` / `pnpm dev` | `messages/*.json` | `src/lib/paraglide/` (git-ignored) |

## Layout

```
src/
  routes/            +page = Landing Page (pre-rendered); app pages are SPA (ssr = false)
  routes/layout.css  Tailwind entry: tailwindcss + tokens + base layer
  lib/styles/        tokens.css (generated @theme)
  lib/paraglide/     compiled i18n (vi base, en empty)
  service-worker/    offline app shell (own tsconfig, WebWorker lib)
static/              manifest.webmanifest, brand/ icons
messages/            vi.json, en.json
supabase/            config.toml; migrations and Edge Functions go here
scripts/             build-tokens.mjs, build-icons.sh
```

Styling: Tailwind utilities named after the tokens — `bg-lantern-red`, `bg-sunflower`, `text-ink`, `font-display text-display`, `p-s4`, `rounded-action`. Add a colour or size to `design.tokens.json`, then `pnpm tokens`; never hard-code hex in markup.

Modules from `docs/architecture.md` land under `src/lib/<module>/` as they are built.
