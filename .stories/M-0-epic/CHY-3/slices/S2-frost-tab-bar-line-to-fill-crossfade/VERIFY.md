# CHY-3 S2 — verify
Commit `7bdbdaf` (PR #11 head) · `pnpm dev` · headless Chromium 390×844, bottom safe-area 34px via CDP · signed in with a seeded 30-day `sb-127-auth-token` (local Supabase not running) · 2026-10-29
Device checks: **iOS Simulator iPhone 17 (iOS 26.5), Mobile Safari**, driven through Orca (`orca emulator` tap/ax/gesture) with `simctl io recordVideo` for frames; frames/screens in `screens/sim/`.

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC3 | bar stays fixed at the bottom | ✅ | nav `position: fixed`; pill top 730px at scroll 0 and at scroll 600 |
| AC3 | content behind it is blurred via `backdrop-filter` | ✅ | pill computed `backdrop-filter: blur(24px) saturate(1.75)`; striped content visibly blurred behind it in `screens/after-today-390.webp` (before: `before-today-390.webp`, no bar styling) |
| AC3 | bottom padding includes `env(safe-area-inset-bottom)` | ✅ | nav `padding-bottom` 48px = 14 + 34; pill bottom edge 48px above screen bottom; pill 66px tall, 362px wide |
| AC3 | last content clears the bar (spec) | ✅ | tab-root wrapper emits `padding-bottom: calc(66px + 14px + env(safe-area-inset-bottom, 0px))` in the built CSS |
| AC3 | bar clears the bottom (home indicator / Safari toolbar) | ✅ | iOS Simulator Safari: layout viewport ends at the toolbar top (`innerHeight` 714pt, `env(safe-area-inset-bottom)` 0px, probe `screens/sim/06-safe-area-probe.png`); pill bottom 761pt vs toolbar top ~775pt = **14pt** gap; home indicator sits under the toolbar, never touched (`04-today-stripes.png`) |
| AC3 | `env(safe-area-inset-bottom)` > 0 on WebKit | ⚠️ | **The ⚠️ is scoped:** the 34px inset path is proven in Chromium (nav padding 48px); Safari-in-browser reports inset 0 so it was not exercised, and a standalone PWA (where the inset is real) was not run. Simulator is not hardware |
| AC4 | old tab fill → line, new tab line → fill | ✅ | tap Lộ trình → Hôm nay: at 83ms Hôm nay fill 0.42 / line 0.58, Lộ trình fill 0.58 / line 0.42; at 333ms Hôm nay 1 / 0, Lộ trình 0 / 1 |
| AC4 | motion duration like prototype | ✅ | `transition-duration` 0.26s on both layers (`prototype/roots.css:76`); reduced motion 0.15s (`:90`) |
| AC4 | no icon scale or move | ✅ | `transform: none` on line and fill layers; pill top moved 0px during tab → tab |
| AC4 | fill colours | ✅ | silhouette `rgb(198,48,29)`, detail `rgb(246,225,219)`; brain silhouette `--duo .42` (`roots.css:77-80`) |
| LOCK | label colour animates | ✅ | Graphite `rgb(74,66,58)` → Ink `rgb(29,24,20)` over the same 0.26s (mid-sample `rgb(55,48,42)` at 83ms) |
| LOCK | bar slides out / in | ✅ | /today → /settings: translateY 0 → 114px, nav removed at ~279ms, opacity 1 throughout; back: 114px → 0 |
| LOCK | selection frozen during slide-out | ✅ | /roadmap → /settings at 129ms: selected tab fill 1, line 0; fill stays 1 until the nav leaves; back restores selection (`0100`) |
| NFR | reduced motion | ✅ | Chromium emulation (0.15s, nav gone in 14ms) and iOS Simulator Safari with Reduce Motion on (`matchMedia` true, `07-reduced-probe-crop.png`): fade 8 frames (t=2.218→2.330s) vs 12 normally; bar slide 1 frame out and 1 frame in vs 8 / 17 normally (`reduced-fade-red.txt`) |
| AC4 | motion matches `prototype/tabs.js` on a phone | ✅ | iOS Simulator Safari, same Lộ trình→Luyện tập tap: app fill fade **12 frames** (t=1.858→2.037s, red-fill metric 31→88), prototype **12 frames** (t=2.293→2.477s, 34→74); same ease curve, crossfade looks alike (`screens/sim/app-fade-strip.png`, `app-fade-red.txt`, `proto-fade-red.txt`). **The ✅ is scoped:** simulator, not hardware (GPU compositing can differ) |
| LOCK | bar blur holds during the slide | ✅ | iOS Simulator Safari, slide-in over striped content: 17 changed frames (~250ms); frames 68/70/72 show the pill frosted over the stripes, no drop-out or snap (`slide-in-mid.png`, `slide-in-strip.png`). Slide-out reveals a plain page (no stripes to blur), so it shows nothing either way |
| LOCK | last content clears the bar | ✅ | iOS Simulator Safari, scrolled to the end: last element bottom y=2087px (695.7pt), pill top directly below, **0pt** overlap, 0pt spare (`05-end-of-content.png`) |

Unit: `pnpm test` → `Test Files  5 passed (5)` · `Tests  23 passed (23)` on `7bdbdaf`. Local gates on that tree: check 0 errors, lint clean, build done.
CI on PR #11: `ci` ✅ (both runs), Vercel ✅ "Deployment has completed", Vercel Preview Comments ✅, CodeRabbit in progress.
Preview: https://chaiyo-git-chy-3-stonghuulocs-projects.vercel.app — 302 to Vercel SSO, and the app has no sign-in UI yet (CHY-26), so a phone cannot get past the guard there.

### Δ AC3 — the inset > 0 path on WebKit is not exercised
| | Proven | Not proven |
|---|---|---|
| Chromium, emulated 34px inset | nav `padding-bottom` 48px = 14 + 34 | — |
| iOS Simulator Safari (browser chrome) | inset 0, pill 14pt above the toolbar | inset 34px with a real home indicator |

**No numeric gap** — nothing contradicts the AC; the exposure is that no run had a non-zero `env()` on WebKit (standalone PWA or hardware).

## Residual risk
- Simulator is not hardware: GPU compositing and frame pacing can differ on a device.
- Last content sits flush against the pill (0pt spare) because padding equals the bar's footprint; no AC asks for more.
- Verified with a seeded session, not a real magic-link sign-in (local Supabase down).
- The 260 in `motion.ts` duplicates `--motion-fade`; a token change would desync the slide from the fades.
