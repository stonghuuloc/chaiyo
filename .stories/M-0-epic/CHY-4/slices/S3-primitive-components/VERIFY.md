# CHY-4 S3 — verify
Commit `0938b54` (PR #12 head) · `pnpm dev` on 5199 · headless Chromium (agent-browser) at 390, 1280 and 300px wide · temporary harness `src/routes/dev-ui` (uncommitted, deleted) · shots `/private/tmp/claude-501/-Users-loctong-Documents-Projects-chaiyo/8e32079d-7d83-4492-8084-0661d4cc5fcf/scratchpad/s3-verify/` · 2026-10-29

| AC | Clause | Verdict | Evidence |
|---|---|---|---|
| AC3 | Button `primary` | ✅ | 62px, radius 18, `rgb(198,48,29)`, Literata 21px white, lift shadow; pressed `rgb(167,38,20)` + `scale(.985)` over 120ms (`390-buttons.jpg`) |
| AC3 | Button `ink` | ✅ | 62px, `rgb(29,24,20)`, no shadow; pressed Graphite `rgb(74,66,58)` + scale |
| AC3 | Button `outline` | ✅ | 56px, 1px `rgb(221,213,200)`, 50% white; pressed `rgb(239,233,220)`, no transform, `outline-style: none` (Tailwind `.outline` clash fixed in `dc152a0`) |
| AC3 | Button `disabled` / `href` | ✅ | fill `rgb(239,233,220)`, label `rgb(101,92,81)`, no shadow; `href` renders `<a>` |
| AC3 | Button focus ring | ⚠️ | colour Lantern Red, offset 3px ✅; width computes 2px in Chromium (source 2.5px) — see Δ AC3 focus ring |
| AC3 | Sheet | ✅ | 430px at 1280, full width at 390/300; radius 18/18/0; 1px top rule; padding-bottom 20; scrim `rgba(29,24,20,.5)`; `aria-modal`; slide 280ms; Esc and scrim close; focus back on "Open sheet" (`390-sheet.jpg`) |
| AC3 | Dialog | ✅ | 340px at 1280/390, 260px at 300; radius 24; padding 20/16/16; title 21px; overlay shadow; enter translateY + scale over 280ms; Esc and scrim close; focus back on opener (`390-dialog.jpg`) |
| AC3 | Chip | ✅ | 40px, radius 999, 15px/600, divider 1×18px |
| AC3 | Section | ✅ | first: no line; next: 1px line, margin-top 20, padding-top 24 |
| AC3 | Toast | ✅ | `role="status"`, Ink fill, 14px/500, 44px underlined action, 20px from bottom (`390-toast.jpg`) |
| AC3 | Toast auto-dismiss 4,500ms | ✅ | no swap: close @4511, @4502. Swap A→B @3005 → close @7511 (+4506); @3003 → @7507. Exit +≈182ms, then node gone |
| LOCK | reduced motion: ≤150ms fade, no transform, exits too | ✅ | Toast exit 150ms opacity-only, `transform: none`; swap @3001 → close @7503; Sheet/Dialog 150ms fade; `motion.test.ts` covers all 4 helpers |
| LOCK | no colour literal in components | ✅ | `guard.test.ts` green in `pnpm vitest --run src/lib` → 86 passed |
| AC3 | iOS Safari | ⚠️ | not checked — see Δ AC3 iOS |

Console across the session: 0 errors, 0 warnings.

### Δ AC3 — focus ring: Chromium paints 2px, spec says 2.5px

**Setup** — `/dev-ui` at 390px, Tab to the primary Button, read `getComputedStyle(btn).outlineWidth`.

| | Code today (`Button.svelte:112`) | AC-3 / SPEC says |
|---|---|---|
| declared width | `2.5px solid var(--color-primary)` | 2.5px |
| computed at DPR 1 | 2px | 2.5px |
| computed at DPR 2 | not proven (scale did not persist on reload) | 2.5px |
| offset | 3px | 3px |

**Gap: 0.5px.** Chromium snaps outline widths to whole device pixels, so at DPR 1 it paints 2px.
**The ⚠️ is scoped:** proven: declared 2.5px, colour and offset / not proven: a 2.5px paint on a DPR 2+ screen.

### Δ AC3 — iOS: Safari focus return not proven

**Setup** — no iOS Simulator booted on 2026-10-29; the brief forbade booting one.

| | Chromium (proven) | iOS Safari (not run) |
|---|---|---|
| tap "Open sheet" → focused element | the button | unknown (Safari is known not to focus tapped buttons; not observed here) |
| close via scrim → focus lands on | "Open sheet" | unknown — `modal.ts:3` captures `document.activeElement`, which may be `<body>` |

**No numeric gap** — at stake: keyboard/VoiceOver users on iOS may lose their place after closing a Sheet or Dialog.
**The ⚠️ is scoped:** proven: Chromium at 390/1280/300 / not proven: Mobile Safari.

## Residual risk
- Review nits not fixed: Esc closes a Dialog and the Sheet under it together (`modal.ts:5-8`); the Toast live region mounts already filled, so some screen readers may not announce it.
- Toast timer unit test reads the source; there is no mounted test (vitest has no DOM env). Live timing above is the proof.
- Frost Chip not pixel-compared to the prototype's WebGL chip.
