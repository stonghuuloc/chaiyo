# DESKTOP R2 — plan
Spec: SPEC.md  ·  Branch: desktop-r2-dialog-focus-keys (on desktop-r1-shell)  ·  Worktree: .worktrees/desktop-r2-dialog-focus-keys

1. modal.ts [AC4]: `hasOpenModal()`, Esc `preventDefault`; tests.
2. keys.ts [AC3]: pure `keyIntent` + `keys` action on window; tests (table, non-QWERTY).
3. Motion + Sheet [AC1]: `panelEnter` in motion.ts (matchMedia at intro); Sheet classes `lg:`; tests.
4. Kbd [AC5], Button hover, Toast `--nav-inset` [AC6]; tests.
5. FocusFrame [AC2]: top bar, column, action bar, step focus; tests.
6. Proof: throwaway route `src/routes/r2-proof` (untracked, deleted before commit); Playwright at 390/768/1024/1280/1440; screenshots.
7. pnpm check, lint, test, build once on the head; push; Vercel preview curl; reports/<code>.md.
