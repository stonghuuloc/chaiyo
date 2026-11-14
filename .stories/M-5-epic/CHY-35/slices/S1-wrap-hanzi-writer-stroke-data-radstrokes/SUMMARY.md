# CHY-35 S1 — summary
ACs: AC2, AC6  ·  Branch: CHY-35-S1 (local, unpushed)  ·  PR: none yet

## Shipped
- [CHORE] `hanzi-writer@^3.7.3` in `dependencies` (`package.json:71`); lockfile holds only its 3 entries (pnpm 10.24 churn on unrelated lines dropped by hand).
- [AC2][AC6] `src/lib/components/hanzi-strokes.ts`: `withRadicals`, `loadStrokes` (CDN URL, rejects on fetch error / non-2xx), `writerOptions`. Test: `hanzi-strokes.test.ts` (16 cases incl. token-colour parity, AC6 copy).
- [AC2][AC6] `HanziStrokes.svelte`: quiz/animate, counter `nét d/t`, Xem mẫu / Gợi ý / Viết lại, error state. Test: `HanziStrokes.test.ts` (server render).
- [AC2][AC6] `/dev/strokes` proof page (`+page.server.ts` 404s outside dev/preview).
- [AC2][AC6] `messages/vi.json`: 5 `strokes_*` keys, one block after `screen_word`.

## Browser proof (Chrome, `pnpm dev` :5391, real mouse events)
- AC2: 你 `nét 0/7` → drag 0 `1/7`; off-target drag `1/7`, mistakes 1; strokes 1-6 → `7/7`, `complete 1`, Gợi ý disabled.
- AC2: Gợi ý paints a `#c6301d` highlight; Viết lại → `0/7`; Xem mẫu disables all 3 tools + `pointer-events-none`, ends `0/7`.
- AC2: outline checkbox off/on (no reload) → `0/7`, `loads` stays 1 (no re-fetch), outline hidden.
- AC2: user stroke `stroke-width` 48. Visible strokes: 再 2 red/4 ink, 见 4 red, 气 4 red, 你 2 red/5 ink.
- AC6: CDN blocked → copy visible in both modes, 3 tools disabled, `error true`; unroute + switch char to 好 → `nét 0/6`, 1 svg, tools enabled.
- AC6: `hanzi-writer` module request aborted → same error copy, `loads 0`.
- Review R1 fix: outline flipped while the data was loading was lost (writer kept the outline, quiz never restarted). `onLoadCharDataSuccess` now re-reads `outline`. Browser: flip during load of 我 → 0 visible outline paths with the box unchecked; committed code (control) → 6 visible.
- Round-2 fixes: slowed the import by 5 s (scratch edit, reverted). Switching char mid-import: with the `me !== gen` check `loads 1`, 1 svg; check removed (control) `loads 2` (stale 你 writer built). Switching char mid-Xem-mẫu: new char `nét 0/6`, tools enabled, 1 svg.

## Deviated from plan
- `writerOptions(outline, size, load)`: `mode` parameter dropped (unused; plan allowed it). SPEC seam text still shows `mode`.
- Round-2 outline-toggle and import-generation behaviour are proved in the browser only: `$effect` code does not run in the Node vitest project, and the plan forbids a fake DOM. The generation check has no unit test.
- `docs/copy-voice.md` rule 8 says append new keys; the plan's block after `screen_word` kept (lane merge conflicts).
- Prettier reformatted my three new files; no other file touched.

## Not done / follow-up
- Screenshots in `/tmp/chy35/*.png` not copied into the slice dir (VERIFY stage).

## Verification run (final tree, `PUBLIC_SUPABASE_URL`/`KEY` placeholders)
- `pnpm lint` (raw) → exit 0, prettier clean, eslint clean
- `pnpm check` → 0 errors, 0 warnings
- `pnpm test` → 100 files passed, 1 skipped; 2941 tests passed, 2 skipped (first run). Re-run after the R1 fix: 2 load-noise failures (`content/import/cli.test.ts` exit 143, `content/lint/cli.test.ts` 20 s timeout); both pass alone (20 tests, load ~290, `--testTimeout=120000`)
- `pnpm build` → exit 0
- `pnpm audit --prod --audit-level=high` → 1 low, exit 0
