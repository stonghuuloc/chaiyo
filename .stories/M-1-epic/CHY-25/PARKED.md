# CHY-25 — parked / out of scope

Findings with no AC behind them. NOT planned, NOT built. Raise with BA if they matter.

- [2026-11-16] S2: a not-found lesson id at /lesson/<id> surfaces as SvelteKit's generic error page (CatalogError propagates from the layout load); no AC names a route-level not-found screen — AC4 is proven at the catalog
- [2026-11-16] S2→S3: with no network, lesson() fails at current() so the CatalogError is offline/'current', not the lesson id; S3's cần mạng screen must key on code=offline, not on id
