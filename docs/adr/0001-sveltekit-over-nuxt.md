# 0001 — SvelteKit over Nuxt

Status: accepted (2026-10-19)

## Context

The app is a phone-first PWA behind a login wall. Lesson pages carry hundreds to thousands of tappable hanzi, SRS review must work offline, and Azure / Telegram / Web Push keys need server routes in the same codebase. SSR brings no SEO value: the app is unlisted and content is login-only. The owner already works in Vue, so Nuxt was the first proposal.

## Decision

Use SvelteKit: SPA mode for app pages, the Landing Page pre-rendered, Paraglide for compiled i18n (`vi` default, `en` wired but empty), and SvelteKit's built-in service worker for offline.

Compared with Nuxt 3, Next.js, SolidStart and Flutter web, SvelteKit ships the least framework JS per page, has no virtual-DOM cost per tappable character, and keeps server routes in one repo. Flutter web was rejected because it paints text on a canvas, which breaks tap-to-lookup, selection and font subsetting. Next.js was rejected for runtime size and machinery (RSC) that buys nothing behind a login.

## Consequences

- Fewer ready-made UI component libraries; acceptable because the UI is custom and the core libraries (Hanzi Writer, ts-fsrs, Supabase client) are plain JS.
- The framework margin over Nuxt is small (roughly 10–20%, not 2×). Real performance depends on font subsetting, one delegated click handler for hanzi, and service-worker audio caching — not on this choice.
- Familiarity with Vue was explicitly not a factor.
