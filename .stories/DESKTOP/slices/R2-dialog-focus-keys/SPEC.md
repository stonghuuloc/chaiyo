# DESKTOP R2 — spec: sheet as dialog, focus frame, keys, Kbd
Repo: stonghuuloc/chaiyo  ·  stacked on R1 (desktop-r1-shell, PR #112, 98be7684)  ·  ADR 0008 accepted (Q1–Q3 = A)

R1 (shell, sidebar) is the base. Login, Welcome and every M-4 screen are not part of this slice; they consume these primitives later.

## Behaviour (Gherkin)

**AC1 — Sheet: bottom sheet below 1024px, centred dialog from 1024px**
- Given a Sheet open at < 1024px, Then it is a bottom sheet (max 430px, rounded top, safe-area padding) and slides up (`sheetSlide`).
- Given the same Sheet at >= 1024px, Then it is a centred dialog (`--container-sheet` 480px, 24px radius, overlay shadow) and enters with `dialogPop`. Same component, same DOM, CSS decides the shape; the transition is picked by `matchMedia('(min-width: 64rem)')` at intro (ADR 0008 §1 exception).
- Given reduced motion, Then both use the `--motion-fade-reduced` fade.
- Given an open Sheet, Then focus moves into it, Tab and Shift+Tab stay inside, Esc closes it, a click on the scrim closes it, and focus returns to the opener (existing `modal.ts` behaviour, now proved at both widths).

**AC2 — FocusFrame**
- Given a focus flow, Then FocusFrame renders: sticky top bar (slot), one centred column (430 / 600 from 768 / 640 from 1024; `narrow` = 560 from 768), and a sticky action bar (slot).
- Given short content, Then below 1024px the action bar sits at the bottom edge of the viewport and from 1024px it follows the content; given long content, then it sticks to the bottom edge at every width (A7).
- Given the `step` prop changes, Then focus moves to the new step heading (`h1`, `h2` or `[data-step-heading]` inside the column, `tabindex=-1`), never `<body>`. The first render does not steal focus.

**AC3 — `keys` action**
- Given a handler set `{ digit, enter, space, escape }`, Then `use:keys` calls `digit(n)` on `Digit1`–`Digit9` and `Numpad1`–`Numpad9` (matched by `event.code`, so a layout whose digit row types ă â ê ô still gives 1–9), `enter` on `Enter`/`NumpadEnter`, `space` on `Space`, `escape` on `Escape`; it calls `preventDefault` only for a key it handled.
- Given `isComposing`, focus in an input, textarea, select or contenteditable, Cmd/Ctrl/Alt held, a held-down repeat, Space or Enter on a focused button or link, or a key already `defaultPrevented`, Then it does nothing.
- Given no `space` handler, Then Space is left alone (the page scrolls).
- Given the action is not mounted (tab roots, public pages), Then no key is bound.

**AC4 — modal ownership** `modal.ts` exports `hasOpenModal()` (true from the overlay's mount until its action is destroyed, i.e. through its outro). While true, `keys` ignores every key. The modal's Esc handler also calls `preventDefault`, so a zero-duration outro (token set to 0) cannot let the same Esc reach the ✕ handler. Test: open a Sheet or Dialog over a keys flow, press Esc once → overlay closed, the flow's `escape` handler was not called.

**AC5 — Kbd** `Kbd` renders a `<kbd>` hint, hidden by default and shown only under `(hover: hover) and (pointer: fine)`; `aria-hidden` because the real control is named already.

**AC6 — Toast** Toast centres on the content area: it reads `--nav-inset` (set by R1 on `.shell[data-nav]`), so at 1440px with the sidebar it centres in the area right of it, and in a focus flow (inset 0) on the window. Button gets a hover fill under `hover:` (feedback only).

## Scope
- Lane files: `src/lib/ui/**` (Sheet, Toast, Button, modal, motion, FocusFrame, Kbd, keys + tests), this slice folder. `src/lib/shell/**` untouched (R1 already provides `--nav-inset`).
- No new message strings. No tokens added (`--container-sheet` and the others came with R1).

## Test contract
- `keys.test.ts`: the intent table (every row of AC3, incl. a non-QWERTY case: `key: 'ă'`, `code: 'Digit1'` → `digit(1)`), and the mount/unmount listener.
- `modal.test.ts`: `hasOpenModal`, Esc `preventDefault`, Esc with the modal open does not reach `keys`.
- `ui.test.ts`: Sheet classes (`lg:max-w-sheet`, `lg:items-center`, `lg:rounded`), Toast `--nav-inset`, Button hover, Kbd media query, FocusFrame render. `motion.test.ts`: `panelEnter` picks by media query.
- Playwright (channel chromium, ~/.capy/work/r2/proof.mjs) at 390, 768, 1024, 1280, 1440 on a throwaway proof route: Sheet geometry and the full overlay interaction set, keys, Kbd visibility, FocusFrame, Toast centring, no horizontal scroll, 390 unchanged.

## DISCUSSION (decisions, confidence)
- Action bar follows the prototype (`d-shell.html`): pinned to the viewport bottom below 1024, right after the content from 1024 (85%; ADR text says "short content keeps the button next to it" for desktop).
- `FocusFrame` carries its own column widths (own scoped CSS, same values as `.page-col`) instead of reading `.shell` variables, because Welcome and Placement live under `(onboard)`, outside `.shell` (90%).
- `keys` listens on `window` and skips `defaultPrevented`; modal Esc `preventDefault`s (90%): resolves the R1 advisor nit on the zero-duration case.
- Shift is not a blocker for digits (80%): on AZERTY the digit row needs Shift, and `event.code` is the point of A5.
- Sheet and Dialog stay separate components (85%): the checklist says "Sheet turns into a centred dialog"; Dialog (340px, centred text, confirm) is a different job.
- Key repeat ignored (90%): holding Enter must not skip five steps.
