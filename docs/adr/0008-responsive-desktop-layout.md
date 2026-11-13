# 0008 — Desktop is a first-class layout: one responsive app, sidebar from 1024px

Date: 2026-11-11 · Status: accepted 2026-11-11 (Loc: Q1 = A sidebar shell, retrofit before M-4 wave B; Q2 = A Today split hero at ≥ 1280px; Q3 = A Login and Landing art left + 400px column from 1024px) · Owner: Loc

## Context

PRODUCT.md said "phone-first, also usable on desktop". DESIGN.md, docs/screens.md and every `prototype/` page describe one 430px phone column, centred on wider screens. Loc wants desktop to be a first-class target: the 1–1.5h lesson sessions at home are the most likely desktop use, with a keyboard and a mouse.

What exists on main (0323fd56): the shell (`src/lib/shell/TabBar.svelte`, the `(app)` and `(tabs)` layouts), the UI primitives (`src/lib/ui/`: Button, Chip, Dialog, Section, Sheet, Toast, plus `modal.ts`) and two width tokens, `--container-column: 430px` and `--container-dialog: 340px` (`src/lib/styles/tokens.css`, pinned by `tokens.test.ts`). Every app route is still a 5-line stub. So the retrofit is the frame and the primitives, not finished screens.

## Decision

**1. One app, one DOM per screen, CSS decides the layout.** No separate desktop routes, no `{#if desktop}` component swaps. A screen keeps its state when the window is resized, because nothing remounts. JavaScript reads a media query only for behaviour CSS cannot express. The named exceptions: AppNav reads `(min-width: 64rem)` so a pushed screen below 1024px does not move the tab bar's selection while the bar slides away; Sheet picks its enter/exit transition at intro (slide below 64rem, `dialogPop` from 64rem), and the lookup popover picks where it anchors.

**2. Four window classes, by viewport width only.** Tailwind v4 default breakpoints (48rem, 64rem, 80rem), no custom ones. They are rem-based, so a larger browser default font moves them; proofs run at the default 16px.

| Class | Width | Navigation | Tab root content | Focus flow column | Gutter |
|---|---|---|---|---|---|
| compact | < 768px | frost tab bar (today's) | 430px column | 430px | 20px |
| medium | 768–1023px | frost tab bar | 600px column | 600px | 32px |
| expanded | 1024–1279px | sidebar 232px | 640px main | 640px | 40px |
| wide | ≥ 1280px | sidebar 232px | 640px main + 280px aside, 48px gap | 640px | 40px |

At 1280px the content area is 1280 − 232 − 2 × 40 = 968px, exactly 640 + 48 + 280, so nothing squeezes. Tab-root content never grows past 968px: on a 2560px screen the sidebar stays at the left edge and the content centres in the rest. Width decides layout; input type never does.

Three named variants of the column rule:
- **Form steps** (Welcome, Settings forms) use `--container-narrow` 560px from 768px, because one text field across 640px reads badly.
- **Two-column Result** (O3, L9, M3) from 1024px: art 3:2 (520px) left, result and action right, max 1040px.
- **Public pages** (Landing, Login) from 1024px: art left, a 400px column right, max 1120px. Login uses 3:2 art (560px). Landing uses portrait art 480px wide, stretched to the column height so both tops and bottoms align (Loc, 2026-11-13). Both pages centre the pair vertically as one block and align the tops.

Height: at medium and expanded the Today art band uses `clamp(280px, 42svh, 380px)`; at wide the art keeps `aspect-ratio: 3 / 2`. Full-height layouts use `dvh`/`svh`, never `vh`. A 1366×768 laptop shows the primary action without scrolling.

**3. Navigation: tab bar below 1024px, sidebar from 1024px.** Same four destinations, same order, same icons and active state (bold-duotone red icon, Ink label, milky white selection pill). The sidebar is flat Notebook Paper with a 1px Ruled Line on its right edge. It is not frost, because it sits beside the page instead of floating over it (The Only Frost Floats Rule). It holds the logo and the four items, nothing else. A top bar was rejected: laptops are short and wide, the Today hero needs the height, and four items do not justify a bar across 1440px. A tablet rail at 768px was rejected: a touch tablet keeps the thumb-reach tab bar, and one switch point means one layout change to test. (Loc approved this shell as Q1 = A.)

**4. Where the navigation shows.** Each route declares its own template, never inferred from the URL prefix (`/practice/session` is a focus flow under `/practice`). Its `+layout.ts` or `+page.ts` load returns `shell: { template, section }`; AppNav reads it from `page.data.shell`. A route that declares nothing gets no navigation (fail-safe), and no shared file grows a row per route. The table below is the rule each route follows:

| Route (screen) | Template | Nav below 1024 | Nav from 1024, active tab |
|---|---|---|---|
| `/today`, `/roadmap`, `/practice`, `/me` (T1–T4) | Tab root | tab bar | sidebar, itself |
| L0 Primer hub, L1 lesson hub, W3 Pinyin Table | Hub / Detail | none | sidebar, Lộ trình |
| T3a Lexicon, W1 Word Page, W2 entry, K2 skill, M1 Mock list | List / Detail | none | sidebar, Luyện tập |
| U1 Badges, U2 Friends, U3 Profile, U4 Settings, A1, A2 | List / Detail / Settings | none | sidebar, Tôi |
| L0a, L2–L8, K1 `/practice/session`, M2, M3, L9, Welcome, Placement + result | Focus flow | none | none |
| Landing, Login | Public page | none | none |

W1 has three parents (T3a, X1, A1); it always lights Luyện tập, where the Lexicon lives. Focus flows have a top bar with ✕ or back plus progress, one centred column, and an action bar that is `position: sticky; bottom: 0` after the content: short content keeps the button next to it, long content keeps it at the bottom edge. While the sidebar shows, `--nav-inset` is 232px, else 0. It is set in CSS only: under `@media (min-width: 64rem)` on the shell wrapper that carries the nav-visible data attribute (`.shell[data-nav]`), so it is never non-zero below 1024px. Toast and any other overlay that centres on the content area must be rendered inside that wrapper, so it inherits `--nav-inset`.

**5. Overlays.** Sheet stays a bottom sheet (430px) below 1024px and becomes a centred dialog (`--container-sheet` 480px) from 1024px: same component, same focus trap, Esc closes it. `--container-dialog` 340px stays for Dialog, which is unchanged. The lookup popover (X1) anchors above or below the clicked text at every width. Toasts centre on the content area (`calc(50% + var(--nav-inset) / 2)`).

**6. Input modes.**
- Touch targets stay at least 44px at every width; a mouse does not shrink them.
- Hover gives feedback only: a Shaded Paper fill on rows, the press colour on buttons, an underline on text links. Nothing is shown only on hover. Tailwind 4.3's `hover:` variant already compiles to `@media (hover: hover)`, so touch never sticks in a hover state; hand-written `:hover` must sit inside that query too.
- Keyboard: Tab order follows the visual order, with a "Bỏ qua tới nội dung" skip link first. When a step's content is replaced, focus moves to the new step heading (`tabindex="-1"`), never to `<body>`. One named exception to visual order: below 1024px the tab bar sits at the bottom of the screen but comes before `<main>` in the DOM (one nav, one DOM), so Tab reaches it after the skip link and before the content; the skip link is how a keyboard user avoids it. Safari skips links and buttons on Tab by default (Option+Tab, or Settings → Advanced); proofs say which they used.
- Focus flows add keys, matched by `event.code` so the keyboard layout does not matter (some Vietnamese layouts, e.g. on Windows, put ă â ê ô on the digit row): `Digit1`–`Digit9` and `Numpad1`–`Numpad9` pick answer options, `Enter` is the primary action, `Space` plays the clip, `Esc` closes the top overlay or, when none is open, triggers the top bar's ✕ (which confirms before data is lost). The handler skips: `event.isComposing`, focus in a text field, any Cmd/Ctrl/Alt combination, any key while a modal is open (`modal.ts` exports `hasOpenModal()`; the open overlay owns Esc, Enter and Tab, so the ✕ handler never runs under it), and Space/Enter on a focused button or link (native activation wins). Space with no clip on the step keeps scrolling. No letter shortcuts: they trigger by accident while reading. Tab roots and public pages get no key shortcuts; on Login, Enter in the email field is the form's native submit.
- Key hints (small `kbd` badges) show only under `(hover: hover) and (pointer: fine)`.
- Hanzi lookup opens on a single click (`event.detail === 1`) with a collapsed selection (`getSelection().isCollapsed`), never on hover. A drag or a double-click selects text as usual and Cmd+C copies it. Hanzi are not Tab stops; keyboard users reach a word through its W1 link.
- Audio: a clip that starts on its own (a listening question) may be blocked by the browser's autoplay policy after a reload or a deep link. `play()` rejection is caught, the play button stays ready, and progress is never blocked.

**7. PWA install on desktop.** The manifest already has `display: standalone` and a paper `theme_color`, so Chrome and Edge install it and Safari 17+ adds it to the Dock as is. CHY-61 adds, for desktop: an install row in Tôi → Cài đặt on Chromium (`beforeinstallprompt`), a short "Thêm vào Dock" hint on Safari for macOS, no automatic desktop banner (CHY-61's Android prompt stays as written), and `id: "/"` plus `launch_handler: { client_mode: "focus-existing" }` so the Dock icon focuses the open window. The installed window can be resized down to compact, so it follows rule 2.

**8. Desktop proof.** Every UI slice proves 390×844, 1024×768, 1280×800 and 1440×900 (Chrome and Safari on the Mac), and one live resize from 1440 to 390 and back without state loss. The iPhone check in DESIGN.md stays.

## Consequences

- Tokens gain `--container-medium 600px`, `--container-main 640px`, `--container-aside 280px`, `--container-narrow 560px`, `--container-form 400px`, `--container-sheet 480px`, `--sidebar 232px`; `--container-column` 430 and `--container-dialog` 340 stay. `--nav-inset` is a runtime variable, not a design token: it is 0 or `var(--sidebar)`, set in `src/routes/layout.css` on the shell wrapper (`.shell[data-nav]`).
- The retrofit is two sequential slices before more UI lands (`docs/responsive.md`: R1 shell, R2 primitives). The Login desktop layout and every unbuilt M-4 screen get desktop rows in their own slices.
- Screens with no desktop prototype (lessons, practice, Mock Test, Tôi) follow their template's rules here until their story draws them.
- Art shown wider than 430 CSS px ships a 1280px-wide WebP (a 560px slot on a 2× screen needs 1120 device px); the 1536×1024 masters cover it.

Prototypes: `prototype/desktop/` (shell, Today, Roadmap, Login, Welcome, Placement). Checklist and build plan: `docs/responsive.md`.
