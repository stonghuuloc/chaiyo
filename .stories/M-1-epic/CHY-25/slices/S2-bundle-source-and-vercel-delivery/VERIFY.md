# CHY-25 S2 — verify
Env: `vite dev` on :5199 from the M-5 stack tip (CHY-39 branch, contains CHY-25), local Supabase, signed in with a fresh OTP learner (Mailpit). Bundle built by `pnpm import:content content --sink bundle --out static/content --only lessons/hsk1` → sha `867bbad8…cef1`. Browser: agent-browser, headless Chrome 156. Screenshots: `scratchpad/verify-b/`.

| AC | Verdict | Evidence |
|---|---|---|
| AC1 | ✅ | Runtime proven below; `bash scripts/build-content.sh` exits 0 on the CHY-39 tip (6 lesson fonts written) |

**Runtime (proven):**
- `/lesson/h1-01` shows the heading `你好 Xin chào` and 10 rows in order: `你 nǐ — nhĩ`, `好`, `您`, `你们`, `你好`, `对不起`, `没关系`, `谢谢`, `不客气`, `再见 zàijiàn — tái kiến` (`ac1-hub.png`).
- Network shows exactly 2 content requests: `GET /content/current.json` 200, then `GET /content/867bbad8…cef1/h1-01.json` 200.
- The bundle carries `lesson.title = "Xin chào"`, `level = 1`, 10 words.
- `data-content-sha` = `867bbad8…cef1` = the `sha` in `/content/current.json`.
- Negative control: `/content/<sha>/h9-99.json` returns 404. `/lesson/h9-99` renders SvelteKit's generic `500 Internal Error`; the spec parks the not-found screen.

**Build chain (proven):** `bash scripts/build-content.sh` on the CHY-39 tip (fix in CHY-25, decided by Loc: skip `ids` strings + warn): exit 0, writes `ukai-h0-00` … `ukai-h1-05.woff2` (6 fonts). One warning: `h1-03: U+200A4 𠂤 is not in ukai.ttc face 0; it falls back to the system font` (h1-03 `chars[].mnemonic` prose). The 5 IDS-only glyphs (`帀 𠔼 𢎨 𭕄 𫝀`) are skipped as `ids` data. `pnpm build` after it: exit 0.

## Residual risk
- Not proven: the `vercel.json` Cache-Control headers and `python3 -m pip` in the Vercel build image; both need a team-authored Vercel deploy plus `curl -sI`.
- `𠂤` in the h1-03 mnemonic renders in the system font, not Kaishu.
- `/lesson/<unknown id>` shows a generic 500 page until the parked not-found screen lands.
- `+layout.ts` loads `/content/current.json` with `window.fetch`. Vite logs SvelteKit warning `window_fetch_in_load` on every lesson load; this is harmless but noisy.
