# DESKTOP R1 — spec: responsive shell and sidebar
Repo: stonghuuloc/chaiyo  ·  base origin/main 458d71b4 (ADR 0008 and docs/responsive.md merged, #110)  ·  Loc approved Q1 = A, Q2 = A, Q3 = A on 2026-11-11

R2 (Sheet as dialog, FocusFrame, keys, Kbd) is the next slice and not part of this one.

## Behaviour (Gherkin)

**AC1 — one nav, CSS switches it at 1024px**
- Given a tab root (`/today`, `/roadmap`, `/practice`, `/me`) at 390 or 768px, Then the frost tab bar shows, pixel-identical to main at 390px, and no sidebar.
- Given the same route at 1024, 1280 or 1440px, Then a 232px sidebar shows: logo + "Chaiyo!" and the same four items in the same order and icons; the active item has the bold-duotone red icon, Ink label and the milky selection pill; the sidebar is flat Notebook Paper with a 1px Ruled Line on its right edge (not frost).
- Given a resize from 1440 to 390 and back, Then `<nav>` and `<main>` are the same DOM nodes (`isSameNode`) and `scrollY` is unchanged.

**AC2 — each route declares its template**
- Given any route under `(app)`, Then its load (or its layout's load) returns `shell: { template, section }`; AppNav reads `page.data.shell`.
- Given `/(tabs)/*`, Then template `tab-root`; `lesson/[id]/[section]`, `lesson/[id]/gate`, `practice/session`, Then `focus`; `word/[id]`, Then `pushed` with section `practice`; `settings`, Then `pushed` with section `me`.
- Given a route that returns no `shell`, Then no navigation shows at any width.
- Given a pushed screen at 390 or 768px, Then no nav shows (the tab bar slides away); from 1024px the sidebar shows with its section's tab active.
- Given a focus route at any width, Then no nav and `--nav-inset` is 0 (a focus flow centres its own column).

**AC2b — tokens** `--container-medium 600px`, `--container-main 640px`, `--container-aside 280px`, `--container-narrow 560px`, `--container-form 400px`, `--container-sheet 480px` join the container group; `--sidebar 232px` is a root token; `tokens.test.ts` pins all of them and that 1280 − 232 − 2 × 40 = 640 + 48 + 280.

**AC3 — bottom padding** The tab-bar bottom padding (66 + 14px + safe area) applies only below 1024px; from 1024px the tab-root page has 64px.

**AC4 — skip link** The first Tab stop on every app route is "Bỏ qua tới nội dung" (`shell_skip`); activating it moves focus to `<main id="main" tabindex="-1">`. Chrome: Tab. Safari: Option+Tab (the proof says which was used).

**AC5 — columns** Tab-root and pushed content: 430px column at < 768 (gutter 20), 600px at 768–1023 (gutter 32), 640px from 1024 (gutter 40), centred in the area right of the sidebar. From 1280px a page that draws an `.aside` inside `.page-split` gets main 640 + 48 gap + 280 aside (content area 968 + 2 gutters); below 1280 the aside stacks after main. Tab-root content never exceeds 968px.

**AC6 — hover check** Every `:hover` in `src/**/*.{svelte,css}` sits inside `@media (hover: hover)` (a test greps for it); `button` and `[role=button]` get `cursor: pointer`.

**AC7 — focus routes** `/lesson/[id]/[section]`, `/lesson/[id]/gate`, `/practice/session` show no nav at 390 and 1440px.

**AC8 — `--nav-inset`** Is 0 at 390 on every template and 232px at 1440 only while the sidebar shows. It is set in CSS only, under `@media (min-width: 64rem)` on `.shell[data-nav]`; Toast (R2) and any centred overlay must render inside `.shell`.

## Scope
- Today hero (Q2 = A) and Login (Q3 = A) are NOT in R1: see DISCUSSION. The frame (`.page-split` + `.aside` slot) is what the Today hero and aside will use.
- Lane files: `src/lib/shell/**`, `src/routes/(app)/**` layouts and the `+page.ts` loads, `src/routes/layout.css`, `design.tokens.json`, `src/lib/styles/tokens.*`, `messages/vi.json` (append), ADR 0008, `docs/responsive.md`, DESIGN.md.

## Test contract
- `template.test.ts`: `navFor` for every template × route (tab bar, sidebar only, none, no shell).
- `layout.test.ts`: every `(app)` page is covered by a `shell:` load; the six declared templates; AC3 class; AC8 `--nav-inset` appears twice only (0px default, `var(--sidebar)` under 64rem); AC6 hover audit.
- `tokens.test.ts`: the seven new values and the 1280 arithmetic.
- Playwright (channel chromium, ~/.capy/work/r1/proof.mjs) at 390, 768, 1024, 1280, 1440: nav switches at 1024, no horizontal scroll, widths, skip link, same nodes after a live resize, aside geometry. Screenshots in the PR.

## DISCUSSION (decisions, confidence)
- Today hero not built (85%): `today` and `roadmap` are 5-line stubs without art or content; ADR 0008 assigns the T1/T2 layouts to CHY-45 and CHY-49. R1 ships the slot they need.
- Login not touched (90%): L1 owns `src/routes/login/**`; A10 says Login desktop rides CHY-26 S2.
- `data-nav` on a `.shell` wrapper inside `(app)/+layout.svelte` rather than on `<html>` (80%): no JS, and Toast mounts inside it. Value `tab-bar` or `sidebar`; absent = no nav.
- Pushed screens keep the nav mounted and hide it below 1024 with a transform + visibility (85%) so it still slides away like the bar did.
- Sidebar does not slide (`barSlide` reads `--nav-mode` from CSS; 0ms when `sidebar`), so the one DOM stays CSS-decided.
- Sidebar active pill only in the sidebar; the bar is untouched so 390 stays pixel-identical.
- `.page-col` pads the column with the gutter at every width (as in the prototype), so stub headings move 20px right at 390; real screens (Today hero) go full-bleed with a negative margin as `d-today.html` does.
- Advisor wording nits applied: `--nav-inset` listed as a runtime variable; the nav-visible attribute is on the element that contains Toast; "load returns `shell`" worded once; checklist route row limited to `(app)`. Left for others: R2 AC4 zero-duration case (R2 SPEC); Login prototype `<form>` (L1).
