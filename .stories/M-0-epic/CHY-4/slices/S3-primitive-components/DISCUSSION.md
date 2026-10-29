# CHY-4 S3 — discussion
ACs: AC3

## Current behaviour (verified, with anchors)
- [AC3] No primitive exists: `src/lib/` holds `shell/` (TabBar, motion), `styles/`, `assets/` only; no `src/lib/ui/`. Screens are `<h1>` skeletons. **AC3 fails for all 6 → TASK.**
- [AC3] Button: prototype `.cta` 62px, radius 18px, red fill, white Literata 21px label, lift shadow, press `scale(.985)` + Press red over .12s, disabled Shaded Paper (`prototype/lesson.css:27-31`); outline = `.ghost` 56px, 1px Ruled Line, 50% white fill, press Shaded Paper (`prototype/onboard.css:11-13`). DESIGN.md:204-208: primary has icon left + caret right, focus 2.5px red outline. **No ink button is specified anywhere.**
- [AC3] Sheet: scrim `rgba(29,24,20,.5)` fade .15s, sheet `min(430px,100%)`, Paper, 1px Ruled top border, top radius 18px, padding 24/20/(20+inset) (`prototype/onboard.css:33-40`); slide-up .28s (`streak.js:44,78`).
- [AC3] Dialog: centered card `min(340px, 100% - 40px)`, radius 24px, padding 20/16/16, shadow `0 20px 60px rgba(29,24,20,.3)`, enter `translateY(24px) scale(.96)` fade, .42s overshoot (`streak.js:34-35,77`), `@media (prefers-reduced-motion)` removes it (`:89`). Locked: max width 340px.
- [AC3] Chip: 40px pill, 600 15px Ink, 1px×18px divider `rgba(40,25,15,.18)`, frost tint/blur/rim/shadow (`prototype/home.html:59-66`, DESIGN.md:211-214). Frost tokens exist: `tokens.css:72-82`.
- [AC3] Section: `border-top: 1px solid Ruled Line`, `margin-top: 20px`, `padding-top: 16px` (`prototype/lesson.css:54`); DESIGN.md:187 says 24px top padding, 20px above the line.
- [AC3] Toast: Ink pill, Paper 14px/500 text, 44px underlined action, fixed bottom 20px + inset, fade+translate 8px .18s, `role="status"` (`prototype/a1-reports.html:61-64,70`).
- [AC3] Tokens missing for: scrim, dialog/lift shadows, chip divider, press/sheet/dialog/toast durations, column 430px, dialog 340px. Existing: `--radius-action` 18px, `--spacing-s*`, `--frost-*`, `--motion-fade` 260ms / `--motion-fade-reduced` 150ms.
- [AC3] `guard.test.ts` bans `#hex`/`rgb()`/`hsl()` in `src/**/*.svelte|css`, so every value above becomes a token or a `color-mix()` of one.

## Answered here (no human needed)
| Q | A | Source |
|---|---|---|
| Where do primitives live? | `src/lib/ui/` (new), imported by path | `src/lib/shell/` pattern |
| Dialog max width? | 340px | STORY.md Locked |
| Reduced motion? | transforms cut, fades shortened to 150ms | Loc, CHY-3 → STORY.md Locked |
| Colours? | tokens only | `guard.test.ts` |
| Chip variants? | `default` only; chips are status, not buttons | AC3 table, DESIGN.md:213 |
| Primary icon + caret? | yes, left icon / right caret | DESIGN.md:205 |

## Resolved in grilling
| Round | Q | Decision | Answer | Source |
|---|---|---|---|---|
| 1 | Q1 [AC3] | ink Button look | A — Ink fill, Paper label, same 62px/18px geometry, press Graphite, no lift | auto-accepted recommendation, Loc to review |
| 1 | Q2 [AC3] | Section top padding | A — 24px (DESIGN.md:187), not the prototype's 16px | auto-accepted recommendation, Loc to review |
| 1 | Q3 [AC3] | Dialog entrance | A — 280ms ease-out translate 24px + scale .96 + fade, no overshoot; reduced = 150ms fade | auto-accepted recommendation, Loc to review |
| 1 | Q4 [AC3] | Sheet top radius | A — 18px (`--radius-action`) | auto-accepted recommendation, Loc to review |
| 1 | Q5 [AC3] | Toast position | A — prototype: 20px + safe-area inset, no tab-bar lift | auto-accepted recommendation, Loc to review |
| 1 | Q6 [AC3] | Sheet/Dialog dismissal | A — Esc and scrim tap close; focus moves in and is restored; no focus trap | auto-accepted recommendation, Loc to review |

### Q1 [AC3] Owner: Loc — What does the ink Button look like? (RESOLVED A)
Setup: AC3 lists "primary red, ink, outline"; only red and outline exist in the prototype.

| | A — Ink fill | B — Ink outline |
|---|---|---|
| fill / label | #1d1814 / Paper | none / Ink |
| lift shadow | none | none |
| pressed | Graphite fill | Shaded Paper fill |

**Gap: 1 fill colour (Ink vs none), and B would duplicate outline.**
➡️ A — Ink fill with Paper text is the pairing the prototype already uses (`.play`, `.toast`).

### Q2 [AC3] Owner: Loc — Section: 16px or 24px above the content? (RESOLVED A)
| | Prototype `lesson.css:54` | DESIGN.md:187 |
|---|---|---|
| space above divider | 20px | 20px |
| padding below divider | 16px | 24px |

**Gap: 8px.**
➡️ A — DESIGN.md is the spec; the prototype predates it.

### Q3 [AC3] Owner: Loc — Dialog enters with the prototype's overshoot or without? (RESOLVED A)
| | A — no overshoot | B — prototype |
|---|---|---|
| duration | 280ms | 420ms |
| curve | ease-out | cubic-bezier(.2,.9,.3,1.2) |
| reduced motion | 150ms fade | 0 |

**Gap: 140ms and an overshoot.**
➡️ A — DESIGN.md: "no bouncy cartoon buttons"; 280ms matches the sheet.

### Q4 [AC3] Owner: Loc — Sheet top corners 18px or 24px? (RESOLVED A)
| | `onboard.css:36` | `streak.js:44` |
|---|---|---|
| radius | 18px | 24px |

**Gap: 6px.**
➡️ A — the plain Sheet in the prototype; 24px belongs to the streak celebration card.

### Q5 [AC3] Owner: Loc — Does the Toast sit above the tab bar? (RESOLVED A)
| | A — prototype | B — lifted |
|---|---|---|
| bottom offset | 20px + inset | 80px + inset (66px bar + 14px) |

**Gap: 60px.**
➡️ A — no screen shows a toast yet and AC3 only asks that it exists; a lift is a consumer decision.

### Q6 [AC3] Owner: Loc — How do Sheet and Dialog close? (RESOLVED A)
**No numeric gap** — behaviour: A closes on Esc and scrim tap and restores focus; B adds a full focus trap.
➡️ A — nothing in AC3 or the prototype asks for a trap.

## Open — needs an answer before spec
(none)

## Locked (do not re-open)
- Dialog max width 340px; one red primary per screen; no emoji (STORY.md).
- Anything that moves animates; reduced motion shortens or cuts it (Loc, CHY-3). Colours come from tokens only (`guard.test.ts`).
