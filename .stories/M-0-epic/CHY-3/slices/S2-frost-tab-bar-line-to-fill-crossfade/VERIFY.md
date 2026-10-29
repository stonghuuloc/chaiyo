# CHY-3 S2 — verify
Commit `7bdbdaf` (PR #11 head) · `pnpm dev` · headless Chromium 390×844, bottom safe-area 34px via CDP · signed in with a seeded 30-day `sb-127-auth-token` (local Supabase not running) · 2026-10-29

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC3 | bar stays fixed at the bottom | ✅ | nav `position: fixed`; pill top 730px at scroll 0 and at scroll 600 |
| AC3 | content behind it is blurred via `backdrop-filter` | ✅ | pill computed `backdrop-filter: blur(24px) saturate(1.75)`; striped content visibly blurred behind it in `screens/after-today-390.webp` (before: `before-today-390.webp`, no bar styling) |
| AC3 | bottom padding includes `env(safe-area-inset-bottom)` | ✅ | nav `padding-bottom` 48px = 14 + 34; pill bottom edge 48px above screen bottom; pill 66px tall, 362px wide |
| AC3 | last content clears the bar (spec) | ✅ | tab-root wrapper emits `padding-bottom: calc(66px + 14px + env(safe-area-inset-bottom, 0px))` in the built CSS |
| AC3 | on a real phone with a home indicator | ⚠️ | headless inset is emulated. **The ⚠️ is scoped:** layout, blur and offset are proven in Chromium; a physical home indicator is not. Pending Loc's device check |
| AC4 | old tab fill → line, new tab line → fill | ✅ | tap Lộ trình → Hôm nay: at 83ms Hôm nay fill 0.42 / line 0.58, Lộ trình fill 0.58 / line 0.42; at 333ms Hôm nay 1 / 0, Lộ trình 0 / 1 |
| AC4 | motion duration like prototype | ✅ | `transition-duration` 0.26s on both layers (`prototype/roots.css:76`); reduced motion 0.15s (`:90`) |
| AC4 | no icon scale or move | ✅ | `transform: none` on line and fill layers; pill top moved 0px during tab → tab |
| AC4 | fill colours | ✅ | silhouette `rgb(198,48,29)`, detail `rgb(246,225,219)`; brain silhouette `--duo .42` (`roots.css:77-80`) |
| LOCK | label colour animates | ✅ | Graphite `rgb(74,66,58)` → Ink `rgb(29,24,20)` over the same 0.26s (mid-sample `rgb(55,48,42)` at 83ms) |
| LOCK | bar slides out / in | ✅ | /today → /settings: translateY 0 → 114px, nav removed at ~279ms, opacity 1 throughout; back: 114px → 0 |
| LOCK | selection frozen during slide-out | ✅ | /roadmap → /settings at 129ms: selected tab fill 1, line 0; fill stays 1 until the nav leaves; back restores selection (`0100`) |
| NFR | reduced motion | ✅ | emulated `prefers-reduced-motion: reduce`: fades 0.15s; nav gone within 14ms |
| AC4 | motion matches `prototype/tabs.js` on a real phone | ⚠️ | **The ⚠️ is scoped:** timing, opacity curve and colours match in Chromium; the AC's own side-by-side on a device is not run. Pending Loc's device check |
| LOCK | bar blur holds during the slide | ⚠️ | computed `backdrop-filter` is set on every frame of the slide and opacity stays 1; **The ⚠️ is scoped:** the pixels mid-slide were not looked at on a phone (inference: transform-only keeps the backdrop). Pending Loc's device check |

Unit: `pnpm test` → `Test Files  5 passed (5)` · `Tests  23 passed (23)` on `7bdbdaf`. Local gates on that tree: check 0 errors, lint clean, build done.
CI on PR #11: `ci` ✅ (both runs), Vercel ✅ "Deployment has completed", Vercel Preview Comments ✅, CodeRabbit in progress.
Preview: https://chaiyo-git-chy-3-stonghuulocs-projects.vercel.app — 302 to Vercel SSO, and the app has no sign-in UI yet (CHY-26), so a phone cannot get past the guard there.

### Δ AC3 — headless proves the layout, not the physical home indicator
| | Proven (Chromium, emulated 34px inset) | Open on a phone |
|---|---|---|
| bar offset above screen bottom | 48px (14 + 34) | the real inset on Loc's phone |
| pill clearance of the indicator | 48px gap | looks clear of the indicator |
| blur over scrolling content | `blur(24px)`, stripes blurred | blur looks right in Safari |

**No numeric gap** — nothing contradicts the AC; the exposure is that only emulation backed the inset, so Loc's device is the proof.

### Δ AC4 — real-phone side-by-side is the AC's own check
| | Proven (Chromium) | Open on a phone |
|---|---|---|
| crossfade timing | 0.26s, mid 0.58/0.42 at 83ms | feels like `prototype/t2-roadmap.html` |
| reduced motion | 0.15s, slide 0ms | OS setting honoured |
| blur during bar slide | `backdrop-filter` set on all frames | no blur drop-out in Safari |

**No numeric gap** — the exposure is the mid-slide blur on Safari, which no headless frame check can show.

## Residual risk
- Safari may composite `backdrop-filter` differently under a sliding transform than Chromium; only the phone check settles it.
- Verified with a seeded session, not a real magic-link sign-in (local Supabase down).
- The 260 in `motion.ts` duplicates `--motion-fade`; a token change would desync the slide from the fades.
