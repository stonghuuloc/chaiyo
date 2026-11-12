# Responsive layout: checklist and retrofit plan

Rules: `docs/adr/0008-responsive-desktop-layout.md`. Visual rules: `DESIGN.md` → Layout, Navigation. Prototypes: `prototype/desktop/d-*.html` (open from a local server at the repo root; the art is git-ignored, so copy it into `assets/` first).

## Checklist for every UI slice

Paste this block into each implementer, tester and reviewer brief. A slice is not READY until each row is true on its head.

```
RESPONSIVE (docs/adr/0008)
[ ] Picture/prototype at 390x844, 1024x768, 1280x800 and 1440x900 (768x1024 too if the layout differs there).
[ ] Containers come from tokens (--container-column/medium/main/aside/narrow/form/sheet). Check: the diff adds no
    430px and no max-w-[<n>px] / width:<n>px for layout.
[ ] One DOM per screen. Breakpoints in CSS only; no {#if desktop} component swap. matchMedia only for the ADR 0008 §1 exceptions.
[ ] Each new route under (app) declares shell: { template, section } in its own load, returned as `shell` (ADR 0008 §4); nav per its table: tab root = tab bar <1024 / sidebar >=1024; pushed browse screen = sidebar >=1024
    with the table's tab active; focus flow = no nav at any width (top bar + centred column + sticky action bar); public page = no nav.
[ ] Overlays use Sheet/Dialog from src/lib/ui (Sheet turns into a centred dialog >=1024). No custom sheets.
[ ] Keyboard: Tab order = visual order (exception: the tab bar below 1024 comes before main, ADR 0008 §6), focus ring visible, focus moves to the new step heading when a step changes.
    Focus flows use the keys action from src/lib/ui (event.code digits, Enter, Space, Esc). No letter shortcuts, none on tab roots.
[ ] Key hints (kbd) only under (hover: hover) and (pointer: fine).
[ ] Hover is feedback only. Check: every hand-written :hover in the diff sits inside @media (hover: hover). Clickable rows have cursor: pointer.
[ ] Targets >= 44px at every width. Body text measure <= 70ch. Full-height layouts use dvh/svh, never vh.
[ ] Copy says "Bấm" (click and tap); never "Chạm" or "Vuốt". Every swipe has a button. (Grep the screen's prototype for "Chạm" at SPEC time.)
[ ] Art wider than 430 CSS px ships a 1280w WebP and keeps 3:2 (aspect-ratio); no text in images.
[ ] Auto-playing audio catches play() rejection; the play button stays ready (proof: reload on that step, no console error).
[ ] Floating UI never covers content at any width (tab-bar bottom padding only below 1024).
[ ] Proof rows: Playwright at the four sizes above with a screenshot each; one live resize 1440 -> 390 -> 1440 mid-flow with no
    state lost and no horizontal scroll at 320. Chrome + Safari on the Mac for the desktop rows (say Tab or Option+Tab in Safari).
```

## Templates at a glance

| Template | compact < 768 | medium 768–1023 | expanded 1024–1279 | wide ≥ 1280 |
|---|---|---|---|---|
| Tab root | 430 column, tab bar | 600 column, tab bar | sidebar + 640 main | sidebar + 640 main + 280 aside |
| Hub / List / Detail / Settings | 430, no nav | 600, no nav | sidebar + 640 | sidebar + 640 (+ aside if the story draws one) |
| Step flow / Test runner | 430, sticky action bar | 600 (form steps 560) | 640 (form steps 560), no nav | same |
| Result | 430 | 600 | art 3:2 left + result right, max 1040 | same |
| Public page | 430 | 480 | Login: art 3:2 (560) + 400 column, max 1120; Landing: art 2:3 (480) + 400 column | same |
| Sheet | bottom sheet 430 | bottom sheet 430 | centred dialog 480 | same |

## Retrofit plan

What is built on main (0323fd56) and phone-only: the shell, six UI primitives plus `modal.ts`, two width tokens. All app screens are stubs. CHY-26 S1 (Login) is built phone-only on its branch; CHY-28 S1 is pure logic. So the retrofit is two small slices. They must land before the next UI wave, or every M-4 screen gets built twice (Q1).

| Slice | Owns (writes) | ACs | Needs first |
|---|---|---|---|
| **R1 Shell: responsive frame and sidebar** (Loc approved Q1 = A on 2026-11-11; spec in `.stories/DESKTOP/slices/R1-shell-sidebar/`) | `src/lib/shell/**` (TabBar becomes AppNav: one nav, CSS switches bar ↔ sidebar at 64rem; reads `page.data.shell` = `{ template, section }`), each existing app route's `+page.ts`/`+layout.ts` load returns `shell` (`(tabs)` layout = tab root; `lesson/[id]/[section]`, `lesson/[id]/gate`, `practice/session` = focus; `word/[id]` = pushed, Luyện tập; `settings` = pushed, Tôi), `src/routes/(app)/+layout.svelte`, `src/routes/(app)/(tabs)/+layout.svelte`, `src/routes/layout.css` (skip link, hover and cursor base, `--nav-inset`), `design.tokens.json` + `src/lib/styles/tokens.css` + `src/lib/styles/tokens.test.ts` (six `--container-*` tokens in the existing container group; `--sidebar` and `--nav-inset` in a new `layout` group, or hand-written in tokens.css if the generator has no such group, decided in R1 SPEC), DESIGN.md frontmatter tokens, `messages/vi.json` (append `shell_skip` under a `shell_*` prefix) | AC1 tab roots show the tab bar below 1024px and the sidebar from 1024px, same 4 items and active state · AC2 every route that exists on main declares the ADR §4 template (rows: `/(app)/(tabs)/practice` → tab root, `/(app)/practice/session` → focus, `/(app)/word/[id]` → pushed + Luyện tập), and a route with no `shell` data shows no nav · AC2b tokens.test pins the new tokens · AC3 the tab-bar bottom padding applies only below 1024px · AC4 the skip link is the first Tab stop (Chrome Tab, Safari Option+Tab) and moves focus to `main` · AC5 on a padded fixture tab root, `<nav>` and `<main>` are the same DOM nodes (`isSameNode`) and `scrollY` is kept after 1440 → 390 → 1440 · AC6 check: every `:hover` in `src/**/*.{svelte,css}` sits inside `@media (hover: hover)` or is a Tailwind `hover:` class · AC7 every focus route (`/lesson/[id]/[section]`, `/lesson/[id]/gate`, `/practice/session`) shows no nav at 390 and 1440 · AC8 `--nav-inset` is 0 at 390 on every template and 232px at 1440 only while the sidebar shows (CSS only) | main |
| **R2 Primitives: sheet as dialog, focus frame, keys** | `src/lib/ui/**` except `celebrate.ts` (M-4 L3): Sheet, Toast, Button hover, `modal.ts`, new `FocusFrame.svelte` (top bar slot, centred column, sticky action bar, focuses the step heading on change), new `Kbd.svelte`, new `keys.ts` (`use:keys` action) | AC1 Sheet is a 430px bottom sheet below 1024px and a centred 480px dialog from 1024px; it slides below 64rem and uses `dialogPop` from 64rem (picked by matchMedia at intro); reduced motion uses `--motion-fade-reduced`; Esc and the scrim close both · AC2 FocusFrame's action bar sits right after short content and sticks to the bottom edge for long content; a step change moves focus to the new heading · AC3 `keys` fires on `Digit1`–`Digit9`/`Numpad1`–`Numpad9` (by `event.code`), Enter, Space, Esc, and does nothing for: `isComposing: true`, focus in an input, Cmd/Ctrl/Alt+digit, Space/Enter on a focused button · AC4 `modal.ts` exports `hasOpenModal()`; with a Sheet or Dialog open, `keys` ignores every key, so Esc closes only that overlay and the ✕ handler does not run (test: open the exit dialog, press Esc once → dialog closed, still in the flow) · AC5 Kbd renders only under `(hover: hover) and (pointer: fine)` · AC6 Toast centres on the content area at 1440px (`--nav-inset`) and on the window inside a focus flow | R1 (tokens, `--nav-inset`) |

Order: R1 then R2, each one lane, one after the other. CHY-28 S2 and CHY-27 S1 then start on FocusFrame. CHY-26 S2 has no file in common with R2 (L1 owns `src/routes/login/**`, `src/lib/auth/**`), so its phone ACs may run beside R2; its desktop rows (restore dialog) are proved after S2 rebases onto R2's merge.

Unbuilt slices get desktop rows in their own SPEC instead of retrofit slices. The Captain adds them in the same delta pass, each pointing at the prototype:

| Story / slice | Desktop rows to add | Prototype |
|---|---|---|
| CHY-26 S2 (L1, also takes Login desktop) | from 1024px: art 3:2 left, 400px sign-in column right, max 1120; the email form and "link sent" states swap only the right column; restore sheet = R2 dialog; Enter submits the email form; owns `static/onboard/welcome-1280.webp` | `d-login.html`, `?s=expired`, `?s=restore` |
| CHY-27 S1, S2 (Welcome) | FocusFrame, 560px column from 768px, Enter = Tiếp, times row stays 3 columns; S2 (offer step) owns `static/onboard/start-b0-1280.webp` | `d-welcome.html`, `?at=1`, `?at=2` |
| CHY-28 S2 (Placement screen) | FocusFrame, text options 2 × 2 from 768px with `1`–`4` hints, "Không biết" = `5`, Space replays the clip, Esc opens the exit dialog, autoplay rejection caught | `d-placement.html` |
| CHY-28 S3 (Result) | two-column Result from 1024px; owns `static/onboard/placed-1280.webp` | `d-placement.html?s=result` |
| CHY-29 S1 (Landing) | the public-page template from 1024px | `d-login.html` (template) |
| CHY-45 Home, CHY-49 Lộ trình | the T1 and T2 desktop layouts | `d-today.html`, `d-roadmap.html` |
| CHY-61 PWA install | the desktop scenarios in ADR 0008 §7 | — |
| CHY-30 Step engine | builds on FocusFrame and `keys` from R2 | `d-placement.html` |

## Answered here (≥ 80 %, Loc can override)

| # | Decision | Confidence | Why |
|---|---|---|---|
| A2 | Tablets 768–1023px keep the frost tab bar | 80 % | Touch thumb reach; one nav switch point to test |
| A3 | Focus flows hide all navigation on desktop | 90 % | Same as phone; a lesson is a session, not a browse |
| A4 | Sidebar = logo + 4 items only (no Streak, no Settings) | 80 % | IA stays identical across widths; Streak lives on Today |
| A5 | Keys by `event.code`: digits, Enter, Space, Esc; no letter keys, none on tab roots | 90 % | IMEs act only in text fields, which are skipped; `code` ignores the Vietnamese layout's digit row; letters fire by accident |
| A6 | Lookup opens on single click with no selection, never hover | 90 % | Hover would fire on every mouse pass over thousands of hanzi; drag and double-click keep selecting |
| A7 | Sticky (not fixed) action bar in focus flows | 85 % | Button stays next to short content; no 600px gap on desktop |
| A8 | Desktop install via the browser + a CHY-61 row; no automatic desktop banner | 85 % | Manifest already installable; banners nag. Android prompt stays per CHY-61 |
| A9 | Wide aside is 280px, not 320px | 90 % | 1280 − 232 − 80 = 968 = 640 + 48 + 280; 320 would squeeze main below 640 until 1320px |
| A10 | CHY-26 S1 merges as it is; Login desktop rides CHY-26 S2 in lane L1 | 85 % | L1 already owns `src/routes/login/**`; the restore sheet arrives in S2 anyway; no reopened review |

## Open questions for Loc

Answered 2026-11-11: Q1 = A, Q2 = A, Q3 = A (recommendations as written). Table kept for the record.

| Q | Question | Options (real values) | rec |
|---|---|---|---|
| Q1 | Approve the sidebar shell, and when does R1 + R2 run? | **A** approve the 232px sidebar from 1024px; run R1 then R2 now, before M-4 wave B (CHY-27 S1 and CHY-28 S2 wait about two slices; CHY-26 S2's phone ACs may run beside R2) · **B** approve the sidebar; run R1 + R2 after M-4 wave C, and the 4 M-4 screens get a second pass · **C** a 64px top bar instead of the sidebar (redraw needed) | A: every later screen builds on this frame, so it is the costliest call to reverse, and building it first means no screen is built twice |
| Q2 | Today at ≥ 1280px: what layout? | **A** split hero (title, Streak chip, CTA left; art 3:2 right, 520×347) + main column (Lộ trình) and aside (Tuần này, Bạn bè) · **B** the phone layout widened to one 640px column, hero 640×360 with the white title over the art | A: keeps the art at 3:2 and the CTA above the fold at 1366×768 |
| Q3 | Login and Landing from 1024px: what layout? | **A** two columns: art 3:2 (560×373) left, sign-in column 400px right · **B** one 480px column: art on top with the fade mask, buttons below (the phone layout, centred) | A: B leaves about 480px of empty paper on each side at 1440px |
