# CHY-24 S3 — spec
ACs: AC1  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 90fbe31; **builds on CHY-24 S2, CHY-20 S1, CHY-21 S1**)

## Behaviour
- [AC1] New dev-only route `/dev/ledger`: `src/routes/dev/ledger/+page.server.ts` returns 404 unless `dev` or `VERCEL_ENV === 'preview'` (as src/routes/dev/audio/+page.server.ts:9); `export const prerender = false`. Not linked from any nav.
- [AC1] `src/routes/dev/ledger/curriculum.ts`: `DEV_CURRICULUM` = Bài 0 (`h0-00`, level 1, sections tones finals initials spelling sandhi, words [], `testOut: true`) and Bài 1 (`h1-01`, level 1, `words grammar dialogue listenSpeak writing`, the 10 word ids of content/lessons/hsk1/h1-01.yaml:36). The real curriculum comes from Catalog (CHY-25).
- [AC1] `+page.svelte` on mount: `openLedger({ initial: initialState({ curriculum: DEV_CURRICULUM, tz: 'Asia/Ho_Chi_Minh' }), store: supabaseStore(supabase), db: 'chaiyo-ledger-dev' })` and `syncWhenOnline(ledger)`; it re-renders on `subscribe`.
- [AC1] Button "Hoàn thành Từ mới" records 10 Attempts in one Từ mới run: `id` and `run` from `crypto.randomUUID()`, `at` = now (1 ms apart), `questionId` `q-h1-01-words-<word>`, `contentSha` `dev`, `card { word, skill: 'the' }`, `correct: true`, `ms` 1000, `step { kind: 'section', lesson: 'h1-01', section: 'words', run, of: 10 }`.
- [AC1] The page shows three lines with test ids: `tu-moi` = "Từ mới: xong" when `state().lessons['h1-01'].done` has `words`, else "Từ mới: chưa xong"; `streak` = "Chuỗi: hôm nay đã tính (<count>)" when `state().streak.last` equals today's date in `state().tz`, else "Chuỗi: hôm nay chưa tính"; `pending` = "Chưa đồng bộ: <pending()>". Before mount (SSR) the three lines render from `initial` with pending 0.
- [AC1] Offline: the first visit is not controlled (no `skipWaiting`/`clients.claim`, src/service-worker/index.ts:15-29); after a second online load, the page sits in `shell-<version>` (network-first with cache fallback, index.ts:42-52, network.ts:9-20); IndexedDB keeps the 10 Attempts across a close and reopen.
- [CHORE] `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build` exit 0.

## Not this slice
- AC2-AC7 (store, sync, fold, subscribe) → S1, S2. Real lesson screens (M-5); login (CHY-26).

## Seam
`src/routes/dev/ledger/+page.svelte` → `#lib/ledger/index.js` → `#lib/study/index.js`.

## Test contract
- [AC1] Unit (`src/routes/dev/ledger/ledger-page.test.ts`, server project, fake IndexedDB, memory store): the button's 10 Attempts on a fresh ledger → `done` has `words`, `streak.last` = today (Asia/Ho_Chi_Minh), `pending()` 10; a second `openLedger` on the same `idb` → the same three lines' values. Negative control: 9 Attempts → "Từ mới: chưa xong", "Chuỗi: hôm nay chưa tính".
- [AC1] Vercel preview of the head (CREW.md): `npx vercel curl /dev/ledger --deployment <url>` → 200 with "Từ mới". Playwright (Chromium, tester's scratch under ~/.capy/work, not committed): open `/dev/ledger` online, `await page.evaluate(() => navigator.serviceWorker.ready)`, `page.reload()`, assert `controller` is not null, then `context.setOffline(true)`; reload → the page renders; click the button → `tu-moi` "Từ mới: xong", `streak` "Chuỗi: hôm nay đã tính (1)", `pending` "Chưa đồng bộ: 10"; close the page; open a new page in the same context, still offline, `goto('/dev/ledger')` → the same three texts. If the preview sits behind Vercel SSO for the browser, the tester runs the Playwright part on `VERCEL_ENV=preview pnpm build && pnpm preview` on the Mac (`VERCEL_ENV` is a static public env, src/env.ts:14; without it the gate returns 404) and says so.
- [AC1] iPhone, iOS Safari, airplane mode (WAVE-PLAN Q8 A): Loc opens `/dev/ledger` on the preview online, reloads once, turns on airplane mode, taps the button, swipes the tab closed, reopens it → "Từ mới: xong" and "Chuỗi: hôm nay đã tính (1)". The tester writes the steps into VERIFY.md; Loc's result closes AC1.

## Open assumptions
- None: Q8 is decided (A).
