# DESKTOP R1 — plan
Spec: SPEC.md  ·  Branch: desktop-r1-shell  ·  Worktree: .worktrees/desktop-r1-shell

1. Tokens [AC2b]: add the six container tokens and `sidebar` to `design.tokens.json`; `pnpm tokens`; `tokens.test.ts` rows.
2. Template logic [AC2]: `src/lib/shell/template.ts` (`Shell`, `navFor`) + `template.test.ts`; `PageData.shell` in `app.d.ts`.
3. Route loads [AC2, AC7]: `(tabs)/+layout.ts`, and `+page.ts` for the two pushed and three focus routes.
4. AppNav [AC1]: `git mv TabBar.svelte AppNav.svelte`; bar styles unchanged, sidebar under `min-width: 64rem`; `barSlide` skips the slide when `--nav-mode` is `sidebar`.
5. Layouts and CSS [AC3–AC5, AC8]: `(app)/+layout.svelte` (`.shell[data-nav]`, skip link, `<main id="main">`), `(tabs)/+layout.svelte` (`.page-split`, `lg:pb-16`), `layout.css` (`--nav-inset`, `.page-col`, aside grid, cursor base); `shell_skip` in `messages/vi.json`.
6. Tests [AC6]: `layout.test.ts` (declarations, padding, nav-inset, hover audit); fix `icons.test.ts` path.
7. Docs: ADR 0008 accepted + nits, `docs/responsive.md`, DESIGN.md.
8. Proof: pnpm check, lint, test, build once on the head; Playwright rows; 390 screenshot diff vs main; Vercel preview curl.
