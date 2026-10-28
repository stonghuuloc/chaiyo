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
6. Google sign-in (once): in Google Cloud create a Web OAuth client with redirect URIs `http://127.0.0.1:56321/auth/v1/callback` and `https://<ref>.supabase.co/auth/v1/callback`. `cp supabase/.env.example supabase/.env` and fill the client id and secret there, never in the root `.env`. Restart with `supabase stop && supabase start`.
7. Hosted project (once): `supabase login`, `supabase link --project-ref <ref>`, then `pnpm supabase:push <ref>`. Never run `supabase config push` directly: with an empty Google secret it overwrites the live one. Hosted email uses Supabase's default sender, capped at 2 emails per hour.

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
