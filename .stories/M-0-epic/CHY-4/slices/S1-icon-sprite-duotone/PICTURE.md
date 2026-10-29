# CHY-4 S1 — picture
ACs: AC1, AC2 · Spec rev 1 · Sub-task CHY-4.1

## What this slice is about

The icon sprite stops being a hand-built file. `pnpm icons` builds it from the Solar icon set, the same bytes every time, and the two duotone colour knobs (`--duo`, `--duo-c`) are proven to drive the second layer.
The tab bar's separate 8-icon extract goes away; one sprite serves everything.

| | |
|---|---|
| Repo | `chaiyo` · branch `CHY-4` |
| Lands | `pnpm icons` = Solar sprite (58 ids), logo script renamed `pnpm brand`, sprite mounted once in the (app) layout, TabBar keeps only `<use>`, duotone tests |
| Does not land | components (S3), fonts + token audit (S2), Solar credit in About |

## **AC1** — verbatim

> Scenario: Icon sprite is generated, never hand-edited
> Given the Iconify Solar JSON is available
> When I run `pnpm icons`
> Then the sprite is written from the Solar JSON
> And re-running it produces a byte-identical sprite
> And the sprite file contains no symbol that the script did not generate

## **AC2** — verbatim

> Scenario: Duotone colours are tunable
> Given an icon rendered from the sprite
> When I set `--duo` and `--duo-c` on its parent
> Then the icon's secondary layer takes those values

## Expected result

<figure class="story-figure" style="margin:0" data-src="diagrams/1-expected.svg"><svg viewBox="0 0 640 430" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d1-title d1-desc" style="display:block;width:100%;height:auto"><title id="d1-title">Expected result: one command makes the sprite, a parent sets the duotone colours</title><desc id="d1-desc">A developer runs pnpm icons and gets a sprite of 58 Solar icons. Running again changes nothing. A screen draws an icon from it; setting two variables on a parent recolours the icon second layer.</desc><defs><marker id="d1-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="200" y="14" width="240" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="38.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Developer runs pnpm icons</text><rect x="200" y="84" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="104.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Sprite written</text><text x="320.0" y="120.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">58 Solar symbols, only those</text><rect x="200" y="164" width="240" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="184.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Run it again</text><text x="320.0" y="200.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">file is byte-identical</text><rect x="200" y="244" width="240" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="268.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Screen draws an icon</text><rect x="200" y="314" width="240" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="320.0" y="334.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Parent sets --duo, --duo-c</text><text x="320.0" y="350.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">second layer follows</text><rect x="200" y="392" width="240" height="30" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="320.0" y="411.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Icon shows the new tint</text><path d="M320 54 L320 84" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 132 L320 164" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 212 L320 244" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 284 L320 314" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/><path d="M320 362 L320 392" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d1-a)"/></svg></figure>

*Notice: the sprite is a pure function of the script, so step 3 can never produce a diff.*

## Requirement [AC1] [AC2]

<figure class="story-figure" style="margin:0" data-src="diagrams/2-requirement.svg"><svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d2-title d2-desc" style="display:block;width:100%;height:auto"><title id="d2-title">Requirement: generated never hand-edited, and tunable colours</title><desc id="d2-desc">AC1 flow: Solar icon set, one command, sprite with nothing hand-added. AC2 flow: a parent sets two colour values and the icon secondary layer takes them.</desc><defs><marker id="d2-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="150.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">AC1 · Solar icon set is available</text><rect x="20" y="90" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="110.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Run the icon command</text><text x="150.0" y="126.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">sprite comes from Solar only</text><rect x="20" y="170" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="150.0" y="194.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Re-run: same bytes</text><text x="150.0" y="210.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">no symbol the script did not make</text><rect x="360" y="20" width="260" height="40" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="490.0" y="44.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">AC2 · icon from the sprite</text><rect x="360" y="90" width="260" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="110.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Parent sets --duo / --duo-c</text><text x="490.0" y="126.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">two plain values</text><rect x="360" y="170" width="260" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="490.0" y="194.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Secondary layer takes them</text><text x="490.0" y="210.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">opacity and colour change</text><path d="M150 60 L150 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M150 138 L150 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 60 L490 90" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/><path d="M490 138 L490 170" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d2-a)"/></svg></figure>

*Notice: AC1 is about where the file comes from, AC2 about how it is tinted; they share only the sprite.*

## Solution [AC1] [AC2]

<figure class="story-figure" style="margin:0" data-src="diagrams/3-solution.svg"><svg viewBox="0 0 640 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="d3-title d3-desc" style="display:block;width:100%;height:auto"><title id="d3-title">Solution: Solar package feeds one generator that replaces the tab-only extract</title><desc id="d3-desc">New: @iconify-json/solar dev dependency, scripts/build-icons.mjs, src/lib/assets/icons.svg. Changed: TabBar.svelte import, pnpm icons now means the sprite, logo script renamed pnpm brand. Deleted: tab-icons.svg, build-tab-icons.mjs.</desc><defs><marker id="d3-a" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#bfc0c0"/></marker></defs><rect width="100%" height="100%" fill="#2d3142"/><rect x="20" y="20" width="250" height="48" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="40.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">@iconify-json/solar</text><text x="145.0" y="56.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">dev dependency · NEW</text><rect x="20" y="110" width="250" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="134.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">scripts/build-icons.mjs</text><text x="145.0" y="150.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">58 ids → Solar bodies · NEW</text><rect x="20" y="208" width="250" height="56" rx="6" fill="#363a4d" stroke="#f08a59" stroke-width="1.8"/><text x="145.0" y="232.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">src/lib/assets/icons.svg</text><text x="145.0" y="248.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">generated, committed · NEW</text><rect x="20" y="306" width="250" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="145.0" y="330.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">(app)/+layout.svelte</text><text x="145.0" y="346.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">mounts sprite once · CHANGED</text><rect x="350" y="20" width="270" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="40.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">pnpm icons</text><text x="485.0" y="56.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">now = the sprite · CHANGED</text><rect x="350" y="110" width="270" height="48" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="130.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">pnpm brand</text><text x="485.0" y="146.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">logo PNGs, was pnpm icons · RENAMED</text><rect x="350" y="208" width="270" height="56" rx="6" fill="#363a4d" stroke="#7a7d8c" stroke-width="1" stroke-dasharray="5 4"/><text x="485.0" y="232.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">tab-icons.svg</text><text x="485.0" y="248.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">build-tab-icons.mjs · DELETED</text><rect x="350" y="306" width="270" height="56" rx="6" fill="#363a4d" stroke="#bfc0c0" stroke-width="1"/><text x="485.0" y="330.0" text-anchor="middle" font-size="13" fill="#f5f5f5" font-family="Geist, system-ui, sans-serif">Duotone layer style</text><text x="485.0" y="346.0" text-anchor="middle" font-size="11" fill="#bfc0c0" font-family="Geist, system-ui, sans-serif">var(--duo,.5) / var(--duo-c) · KEPT</text><path d="M145 68 L145 110" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M145 166 L145 208" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/><path d="M145 264 L145 306" fill="none" stroke="#bfc0c0" stroke-width="1.5" marker-end="url(#d3-a)"/></svg></figure>

*Notice: three new boxes replace the dashed ones; the layout owns the sprite and TabBar keeps only its ids.*

## Settled

| Decision | Why / source |
|---|---|
| `pnpm icons` = sprite → `src/lib/assets/icons.svg`; logo script becomes `pnpm brand` | DISCUSSION.md Q1 → A · `package.json:18` |
| Ship only ids screens use (58 of 71), tab symbols folded in, old extract deleted | DISCUSSION.md Q2 → A · count corrected after the answer, see below |
| Keep ids `i-regular-*` / `i-fill-*` / `i-bold-check`; map to Solar weights once in the script | DISCUSSION.md Q3 → A · `TabBar.svelte:30-31` |
| Secondary layer = `opacity:var(--duo,.5);color:var(--duo-c,currentColor)` already works in the extract | `tab-icons.svg` · `TabBar.svelte:120-127` |
| Sprite mounted once in `(app)/+layout.svelte`, hidden, before children; TabBar keeps only `<use href>` | Loc 2026-10-29 "go + mount" · PLAN Task 7b |
| Anything that moves animates — nothing in S1 moves, so no motion work | Loc, CHY-3 → STORY.md Locked |
| Solar names are found by matching path data; no match → generator fails, never substitutes | SPEC.md Open assumptions |

## Carried elsewhere

| Item | Home |
|---|---|
| (nothing parked) — the sprite-mount finding was unparked and built as Task 7b | Loc 2026-10-29 |
| Solar CC BY 4.0 credit line | About screen (`DESIGN.md:134`), not an AC of CHY-4 |

## Plan

| # | Task | AC | Anchor | Test |
|---|---|---|---|---|
| 1 | Add `@iconify-json/solar` dev dependency | CHORE | `package.json:24` | node import prints icon count |
| 2 | Rename logo script to `pnpm brand` | AC1 | `package.json:18`, `scripts/build-icons.sh:3`, `README.md:54,69` | `rg build-icons.sh` empty; same `static/brand` files |
| 3 | Write the sprite generator, `pnpm icons` | AC1 | `scripts/build-icons.mjs` (new), `package.json:18` | `icons.test.ts` (task 4) |
| 4 | Sprite tests: bytes identical, ids = list, generated header, no hand edits | AC1 | `src/lib/shell/icons.test.ts` (new) | `vitest --run src/lib/shell/icons.test.ts` |
| 5 | Duotone layer test + browser computed-style check | AC2 | `src/lib/shell/icons.test.ts` · verify stage | `-t duotone`; computed `1` / `rgb(198, 48, 29)` |
| 6 | Generate and commit `icons.svg` | AC1 | `src/lib/assets/icons.svg` (new) | `shasum` equal across two runs |
| 7 | Strip the inline sprite from TabBar; point tab test at `icons.svg` | AC1 | `TabBar.svelte:5,24-25` · `tabs.test.ts:21` | `vitest --run src/lib/shell/tabs.test.ts` |
| 7b | Mount the sprite once in the (app) layout, before children | AC1 | `src/routes/(app)/+layout.svelte:1-9` | `icons.test.ts` layout test · 1 sprite in DOM on tab root and pushed screen |
| 8 | Delete tab-icons.svg, build-tab-icons.mjs, old test, `tab-icons` script | AC1 | `package.json:19`, `tab-icons.test.ts` | `rg tab-icons` empty · `pnpm check` |

Mutation paths: generator is the only writer; a "committed file equals `buildSprite()`" test catches hand edits. Rollback: `git revert` + `pnpm remove -D @iconify-json/solar`.

## Today → after

| | Today | After |
|---|---|---|
| `pnpm icons` writes | 8 logo/PWA files in `static/brand` | `src/lib/assets/icons.svg` |
| Sprite source | hand-built `prototype/icons.svg`, 71 symbols, no script | Solar JSON via script, 58 symbols |
| Sprite in the DOM | inlined by TabBar, tab roots only | mounted once by the layout, tab roots and pushed screens |
| Re-run diff | no generator | byte-identical |
| Duotone test | none | markup test + browser computed-style check |

**Correction to Q2:** the round-1 gap said 21 ids used / 50 unshipped. Screens build ids through `ic()` (`prototype/step.js:5`), so the real count is 58 used / 13 unshipped. Same pick (A); a smaller saving. Say "B" and the list gains 13 lines, nothing else moves.

## Out of frame
- Button, Sheet, Dialog, Chip, Section, Toast and any `<Icon>` component → S3
- Fonts and the hex-literal audit → S2
- Solar attribution in About → no CHY-4 slice
