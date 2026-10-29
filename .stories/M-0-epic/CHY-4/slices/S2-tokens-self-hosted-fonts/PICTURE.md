# CHY-4 S2 — picture
ACs: AC4, AC5 · Spec rev 1 · Sub-task CHY-4.2

## What this slice is about

Every font the app shows is served from the app itself, so a lesson page makes no request to Google and still looks right offline. Every colour in a component comes from a design token, and a test stops new literals sneaking in.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-4` (PR #12) |
| Lands | `fonts.css` + `@fontsource` packages, Onest and Kaishu copied from the prototype, CDN links removed, 4 `frost` tokens, guard and equality tests |
| Does not land | per-lesson Kaishu subsets and lesson text (CHY-13), the six primitives (S3) |

## **AC4** — verbatim

> Scenario: Fonts are self-hosted
> Given I load a Bài 1 lesson page with the network panel open
> When the page finishes loading
> Then Be Vietnam Pro, Onest (pinyin tone marks), the display face and the lesson's Kaishu subset are served from the app's own origin
> And no request goes to Google Fonts or another font CDN

## **AC5** — verbatim

> Scenario: Colours come from design tokens only
> Given `design.tokens.json`
> When I run `pnpm tokens`
> Then the generated CSS variables match the tokens
> And a search for hex colour literals in component files finds none

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.svg"><svg viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d1-title d1-desc" style="display:block;width:100%;height:auto"><title id="d1-title">Expected result: every font comes from our own origin, online or off</title><desc id="d1-desc">A learner opens a lesson page. Text shows in Be Vietnam Pro, Literata, Onest and Kaishu, all fetched from the app origin. No request goes to Google Fonts. With the network off after first load, the same fonts still show.</desc><defs><marker id="d1-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="200" y="14" width="240" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="38.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Learner opens a lesson page</text><rect x="200" y="84" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="104.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Page text is drawn</text><text x="320.0" y="120.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Be Vietnam Pro · Literata · Onest · Kaishu</text><rect x="200" y="164" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="184.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Network panel</text><text x="320.0" y="200.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">every font request is our own origin</text><rect x="200" y="244" width="240" height="40" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="268.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">No Google Fonts request</text><rect x="200" y="314" width="240" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="334.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Network off, reload</text><text x="320.0" y="350.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">same fonts still show</text><rect x="200" y="392" width="240" height="30" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="411.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Colours come from tokens</text><path d="M320 54 L320 84" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 132 L320 164" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 212 L320 244" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 284 L320 314" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 362 L320 392" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/></svg></figure>

*Notice: the offline step needs nothing new, the service worker already precaches build output.*

## Requirement [AC4] [AC5]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.svg"><svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d2-title d2-desc" style="display:block;width:100%;height:auto"><title id="d2-title">Requirement: fonts self-hosted, colours from tokens only</title><desc id="d2-desc">AC4 flow: load a lesson page, finish loading, fonts come from the app origin and none from a CDN. AC5 flow: run the tokens command, variables match tokens, no hex literal in components.</desc><defs><marker id="d2-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="150.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">AC4 · Bài 1 page loads</text><rect x="20" y="90" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="110.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Fonts served</text><text x="150.0" y="126.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">from the app's own origin</text><rect x="20" y="170" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="194.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">No request to a font CDN</text><text x="150.0" y="210.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">including Kaishu for the lesson</text><rect x="360" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="490.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">AC5 · design tokens run</text><rect x="360" y="90" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="110.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">CSS variables match</text><text x="490.0" y="126.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">every token</text><rect x="360" y="170" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="194.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Component files hold</text><text x="490.0" y="210.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">no colour literal</text><path d="M150 60 L150 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M150 138 L150 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 60 L490 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 138 L490 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/></svg></figure>

*Notice: AC4 is about where bytes come from, AC5 about what a component may contain; they share no step.*

## Solution [AC4] [AC5]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.svg"><svg viewBox="0 0 640 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d3-title d3-desc" style="display:block;width:100%;height:auto"><title id="d3-title">Solution: package fonts and prototype subsets feed one fonts.css; TabBar reads tokens</title><desc id="d3-desc">New: @fontsource dev dependencies, src/lib/styles/fonts.css, src/lib/assets/fonts, four frost tokens, guard tests. Changed: layout.css imports fonts.css, TabBar.svelte uses tokens. Removed: Google Fonts links in app.html.</desc><defs><marker id="d3-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="250" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="40.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">@fontsource packages</text><text x="145.0" y="56.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Be Vietnam Pro · Literata · NEW</text><rect x="20" y="100" width="250" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="120.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">src/lib/assets/fonts</text><text x="145.0" y="136.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Onest ×3 · ukai-h1-01 · NEW</text><rect x="20" y="190" width="250" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="214.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">src/lib/styles/fonts.css</text><text x="145.0" y="230.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">@font-face, same-origin · NEW</text><rect x="20" y="278" width="250" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="145.0" y="298.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">routes/layout.css</text><text x="145.0" y="314.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">imports fonts.css · CHANGED</text><rect x="350" y="20" width="270" height="48" rx="6" fill="#363a4d" stroke="#7a7d8c" stroke-width="1" stroke-dasharray="5 4"/><text x="485.0" y="40.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">app.html:12-17</text><text x="485.0" y="56.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Google Fonts links · REMOVED</text><rect x="350" y="100" width="270" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="485.0" y="124.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">design.tokens.json frost</text><text x="485.0" y="140.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">+4 colour tokens · NEW</text><rect x="350" y="190" width="270" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="210.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">tokens.css</text><text x="485.0" y="226.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">generated, tested equal · CHANGED</text><rect x="350" y="278" width="270" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="298.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">TabBar.svelte:64,76,77</text><text x="485.0" y="314.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">rgb() → var(--frost-…) · CHANGED</text><rect x="20" y="380" width="600" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="404.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Guard tests · NEW</text><text x="320.0" y="420.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">no CDN host in src · no #hex / rgb() / hsl() in components · tokens.css == toCss()</text><path d="M145 68 L145 100" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M145 148 L145 190" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M145 246 L145 278" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M485 156 L485 190" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M485 238 L485 278" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/></svg></figure>

*Notice: the guard tests (bottom) are what make both ACs stay true after this slice.*

## Settled

| Decision | Why / source |
|---|---|
| Be Vietnam Pro + Literata from `@fontsource` dev dependencies, 0 B of their binaries committed | DISCUSSION.md Q1 → A |
| Keep Literata's optical-size axis (132,392 B latin + vietnamese) | DISCUSSION.md Q2 → A |
| Kaishu clause proven by static test plus a temporary probe page (1 request, 6,388 B) | DISCUSSION.md Q3 → A |
| AC5 covers `rgb()` / `hsl()` too; the 4 `TabBar` literals become 4 `frost` tokens | DISCUSSION.md Q4 → B · `TabBar.svelte:64,76,77` |
| Latin faces `font-display: swap`; Kaishu `block` | DISCUSSION.md Q5 → A · `prototype/lesson.css:1` |
| Onest and `ukai-h1-01` come from `prototype/fonts/`; Kaishu face is named `"AR PL UKai CN"` | DISCUSSION.md Answered · `design.tokens.json:106` |
| Literata face is named `Literata` directly (the package calls it `Literata Variable`), so tokens stay as they are | PLAN Task 6 |
| Anything that moves animates: S2 moves nothing | Loc, CHY-3 → STORY.md Locked |

## Carried elsewhere

| Item | Home |
|---|---|
| Per-lesson Kaishu subsets + lesson text | CHY-13 (`STORY.md` out of scope) |
| `#f7f3ea` in `app.html:7`, manifest | outside AC5's "component files"; no slice |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Guard: no `#hex`/`rgb()`/`hsl()` in components | AC5 | `src/lib/styles/guard.test.ts` (new) | `vitest --run src/lib/styles/guard.test.ts` |
| 2 | 4 `frost` tokens; TabBar uses them | AC5 | `design.tokens.json:421`, `TabBar.svelte:64,76,77` | guard green; computed pill styles unchanged |
| 3 | `tokens.css` equals `toCss(tokens)` | AC5 | `src/lib/styles/tokens.test.ts:1-16` | `vitest --run src/lib/styles/tokens.test.ts` |
| 4 | Font guards: no CDN host, same-origin `src`, families, `font-display` | AC4 | `src/lib/styles/fonts.test.ts` (new) | `vitest --run src/lib/styles/fonts.test.ts` |
| 5 | Add `@fontsource` packages; copy Onest ×3 + `ukai-h1-01` | AC4 | `package.json:24`, `src/lib/assets/fonts/` | files present, sizes unchanged |
| 6 | `fonts.css`, import it, delete CDN links | AC4 | `layout.css:2`, `app.html:12-17` | fonts tests; `pnpm build`; network log |

Mutation paths: the guard walks `.svelte` `<style>`, inline `style=""` and `layout.css`; a CDN link anywhere in `src/` fails Task 4. Rollback: `git revert` + `pnpm remove -D` the two packages.

## Today → after

| | Today | After |
|---|---|---|
| Font origins per page | 2 (`fonts.googleapis.com`, `fonts.gstatic.com`) | 1 (the app) |
| `@font-face` rules in `src/` | 0 | 4 families |
| `rgb()` literals in `TabBar.svelte` | 4 | 0 |
| `tokens.css` variables under test | 2 of 76 | 76 of 76 |

**Correction to Q4:** round 1 said ≈3 new tokens; the 4th, `rgb(255 255 255 / 0)`, cannot be `transparent` without changing the gradient, so it is 4.

## Out of frame
- Lesson text rendered in Kaishu → CHY-13
- Button, Sheet, Dialog, Chip, Section, Toast → S3
