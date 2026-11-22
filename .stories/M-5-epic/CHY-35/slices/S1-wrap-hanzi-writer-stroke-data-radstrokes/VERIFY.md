# CHY-35 S1 — verify
Run: PR head 8adc63ef, `pnpm dev` :5402 (placeholder Supabase env), headless Chrome 156 via agent-browser, real mouse events on `/dev/strokes`. Screenshots: `/tmp/claude-501/verify-CHY-35/*.png`.

| AC | Verdict | Evidence |
|---|---|---|
| AC2 | ✅ | 你: `nét 0/7` -> drag stroke 1 `nét 1/7` -> off-target drag `1/7`, mistakes 1 -> strokes 2-7 `nét 7/7`, `complete 1`, Gợi ý disabled (`d7.png`). User stroke `stroke-width` 48. Radical stroke 1-2 red `rgb(198,48,29)`, rest ink `rgb(29,24,20)`, outline `rgb(221,213,200)`. 再 (no `radStrokes` in data): 2 red / 4 ink visible after 6/6 (`zai.png`). Gợi ý paints next stroke (`goiy.png`); Viết lại from `1/7` -> `0/7`, mistakes 0; Xem mẫu: 3 tools disabled + pad `pointer-events:none`, then enabled, `0/7`; outline toggle off/on -> `0/7`, `loads` stays 1. Unit: `pnpm vitest run src/lib/components/hanzi-strokes src/lib/components/HanziStrokes` -> 23 passed, 0 failed. |
| AC6 | ✅ | `network route "https://cdn.jsdelivr.net/**" --abort`, reload: quiz pad shows "Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại." (`ac6-blocked.png`), counter `nét 0/–`, Xem mẫu / Gợi ý / Viết lại all `disabled`, `error true`; animate pad shows the same copy. Unroute + change char to 好 without reload: `nét 0/6`, tools enabled (`ac6-recovered.png`). |

## Not proven
- `onerror()` fires exactly once: the page only exposes a boolean (`error true`), not a count.
- Highlight colour of Gợi ý: it rendered pale red on stroke 3 of 你 (a non-radical stroke); AC2 names no hint colour, so not verdicted.
- Review R1/R2 fixes (outline flip during load, char switch mid-import, mid-Xem-mẫu) were proved by SUMMARY's own run, not re-run here.
- 见 and 气 radical patch `[0,1,2,3]` not re-driven here; covered by unit test only.
- `agent-browser` default engine was Lightpanda (no layout); switched to `--engine chrome`.

## Residual risk
- Stroke data comes from the public jsDelivr CDN at runtime (locked Q3 = A); no offline path by design.
