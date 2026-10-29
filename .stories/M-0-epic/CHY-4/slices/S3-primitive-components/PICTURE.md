# CHY-4 S3 — picture
ACs: AC3 · Spec rev 1 · Sub-task CHY-4.3

## What this slice is about

The app gets its six shared building blocks: Button, Sheet, Dialog, Chip, Section and Toast, ported from the prototype onto design tokens. Everything that opens or closes animates, and reduced motion shortens it to a quick fade.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-4` (PR #12) |
| Lands | `src/lib/ui/*.svelte` ×6, `motion.ts`, 14 tokens (size, lift, overlay, motion, frost divider), SSR + unit tests |
| Does not land | screens using them, tab-bar lift for Toast, focus trap, scroll lock |

## **AC3** — verbatim

> Scenario Outline: Every primitive component exists with its variants
> Given the component library
> When I render <component>
> Then it shows <variants>
>
> | component | variants |
> | Button | primary red, ink, outline |
> | Sheet | bottom sheet |
> | Dialog | centered, max width 340px |
> | Chip | default |
> | Section | content with a divider line |
> | Toast | message |

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.svg"><svg viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d1-title d1-desc" style="display:block;width:100%;height:auto"><title id="d1-title">Expected result: six building blocks, each with its variants, all motion animated</title><desc id="d1-desc">A developer imports Button, Sheet, Dialog, Chip, Section and Toast. Each renders its variants. Opening and closing animate; with reduced motion they shorten to a quick fade.</desc><defs><marker id="d1-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="200" y="14" width="240" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="38.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Developer imports a primitive</text><rect x="200" y="84" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="104.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Button · Sheet · Dialog</text><text x="320.0" y="120.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Chip · Section · Toast</text><rect x="200" y="164" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="184.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Each shows its variants</text><text x="320.0" y="200.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">red · ink · outline, 340px dialog</text><rect x="200" y="244" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="264.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Open / close animates</text><text x="320.0" y="280.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">slide, pop, rise, fade</text><rect x="200" y="324" width="240" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="344.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Reduced motion</text><text x="320.0" y="360.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">150ms fade, no movement</text><rect x="200" y="394" width="240" height="30" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="413.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Colours from tokens</text><path d="M320 54 L320 84" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 132 L320 164" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 212 L320 244" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 292 L320 324" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 372 L320 394" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/></svg></figure>

*Notice: motion is part of the result, not an add-on; reduced motion is the fallback branch.*

## Requirement [AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.svg"><svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d2-title d2-desc" style="display:block;width:100%;height:auto"><title id="d2-title">Requirement: every primitive exists with its variants</title><desc id="d2-desc">AC3 flow: render a component from the library and see its variants: Button primary red, ink, outline; Sheet bottom; Dialog centred, max 340px; Chip default; Section with divider; Toast message.</desc><defs><marker id="d2-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="150.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">AC3 · render a component</text><rect x="20" y="90" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="114.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Button shows</text><text x="150.0" y="130.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">primary red · ink · outline</text><rect x="20" y="170" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="198.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Sheet shows a bottom sheet</text><rect x="360" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="490.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Dialog</text><rect x="360" y="90" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="122.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Centred, max width 340px</text><rect x="360" y="170" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="190.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Chip · Section · Toast</text><text x="490.0" y="206.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">one variant each</text><path d="M150 60 L150 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M150 146 L150 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 60 L490 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 146 L490 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/></svg></figure>

*Notice: the AC is a list of six renders; nothing in it says how they open or close, that comes from the locked motion rule.*

## Solution [AC3]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.svg"><svg viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d3-title d3-desc" style="display:block;width:100%;height:auto"><title id="d3-title">Solution: six components in src/lib/ui share tokens and one motion helper</title><desc id="d3-desc">New: Button, Sheet, Dialog, Chip, Section, Toast in src/lib/ui, motion.ts with transitions, new tokens for size, lift, overlay and motion durations. Unchanged: frost tokens, sprite, fonts.</desc><defs><marker id="d3-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="270" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="155.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">design.tokens.json + tokens.css</text><text x="155.0" y="60.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">size · lift · overlay · motion · NEW</text><rect x="20" y="110" width="270" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="155.0" y="134.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">src/lib/ui/motion.ts</text><text x="155.0" y="150.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">cssMs · sheetSlide · dialogPop · NEW</text><rect x="20" y="200" width="270" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="155.0" y="224.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Sheet · Dialog · Toast</text><text x="155.0" y="240.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">transition: + Esc/scrim close · NEW</text><rect x="350" y="20" width="270" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="485.0" y="40.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Button · Chip · Section</text><text x="485.0" y="56.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">scoped styles on tokens · NEW</text><rect x="350" y="110" width="270" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="134.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">S1 sprite</text><text x="485.0" y="150.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">icon left, caret right · reused</text><rect x="350" y="200" width="270" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="224.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">S2 frost tokens + fonts</text><text x="485.0" y="240.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">Chip, Button label · reused</text><rect x="20" y="300" width="600" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="324.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Tests · NEW</text><text x="320.0" y="340.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">SSR render per variant · token + motion unit tests · guard bans colour literals</text><path d="M155 76 L155 110" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M155 166 L155 200" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M485 68 L485 110" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M485 166 L485 200" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/></svg></figure>

*Notice: three new boxes carry the shared parts; components never hold a colour or a duration.*

## Settled

| Decision | Why / source |
|---|---|
| Ink button = Ink fill, Paper label, no lift, Graphite press | DISCUSSION.md Q1 → A (auto-accepted, Loc to review) |
| Section padding below the divider 24px, not the prototype's 16px | Q2 → A · `DESIGN.md:187` vs `prototype/lesson.css:54` |
| Dialog enters 280ms ease-out, no overshoot | Q3 → A · `DESIGN.md` "no bouncy cartoon buttons" |
| Sheet top corners 18px | Q4 → A · `prototype/onboard.css:36` |
| Toast stays 20px + inset from the bottom, no tab-bar lift | Q5 → A |
| Esc and scrim tap close; focus in and restored; no trap | Q6 → A |
| Dialog max width 340px | STORY.md Locked |
| Anything that moves animates; reduced motion = 150ms fade | Loc, CHY-3 → STORY.md Locked |
| Colours from tokens only; one-offs use `color-mix()` of tokens | `guard.test.ts` |

## Carried elsewhere

| Item | Home |
|---|---|
| Toast above the tab bar, focus trap, scroll lock | no AC; consumers decide |
| Screens using the primitives | later stories |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Tokens: size, lift, overlay, frost divider, motion | AC3 | `design.tokens.json:279-297` | `tokens.test.ts` primitive tokens present |
| 2 | Motion helpers read durations from tokens; reduced = 150ms fade | LOCK | `src/lib/ui/motion.ts` (new), pattern `shell/motion.ts:1-20` | `motion.test.ts` |
| 3 | Button primary / ink / outline, `<a>` with href, icon + caret | AC3 | `src/lib/ui/Button.svelte` (new) | `ui.test.ts -t Button` |
| 4 | Section and Chip | AC3 | `Section.svelte`, `Chip.svelte` (new) | `ui.test.ts -t "Section\|Chip"` |
| 5 | Sheet and Dialog with exit transitions, Esc, focus | AC3 | `Sheet.svelte`, `Dialog.svelte` (new) | `ui.test.ts -t "Sheet\|Dialog"` |
| 6 | Toast with auto-dismiss | AC3 | `Toast.svelte` (new) | `ui.test.ts -t Toast` |
| 7 | Guard stays green over the new files | LOCK | `guard.test.ts` | `vitest --run src/lib` |

Mutation paths: open ↔ close both animate, Esc / scrim / `onclose` share one path, `href` vs `<button>`. Rollback: `git revert` the slice's commits.

## Today → after

| | Today | After |
|---|---|---|
| `src/lib/ui/` | absent | 6 components + `motion.ts` |
| Tokens for overlay / lift / sizes / press, sheet, dialog, toast durations | 0 | 14 |
| Primitives that exist | 0 of 6 | 6 of 6 |

## Out of frame
- Using the primitives on screens → later stories
- Toast lift, focus trap → no AC
