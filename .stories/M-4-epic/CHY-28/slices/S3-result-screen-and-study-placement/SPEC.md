# CHY-28 S3 — spec
ACs: AC4, AC5  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb; **builds on CHY-28 S1-S2, CHY-26 S1**)

## Behaviour
- [AC5] `src/lib/learner/index.ts` (new) `learnerLedger(session, { client = supabase, idb = indexedDB } = {})`: one Ledger per signed-in learner, opened once and cached by `session.user.id`: `openLedger({ initial: initialState({ curriculum: CURRICULUM, tz }), store: supabaseStore(client), db: 'chaiyo-ledger-' + uid, idb })` plus `syncWhenOnline`. `tz` = `settings.tz` read with `.eq('learner_id', uid).maybeSingle()`, else the device zone `Intl.DateTimeFormat().resolvedOptions().timeZone`. A `SIGNED_OUT` auth event drops the cache and stops the sync listener.
- [AC5] `/placement/result` (`src/routes/(onboard)/placement/result/+page.svelte`, replaces S2's stub): reads `sessionStorage[HANDOFF]`; missing → `goto(resolve('/(app)/(tabs)/today'), { replace: true })`. Otherwise it records every Attempt with `ledger.record` in order, removes the key, then calls `void ledger.sync().catch(() => undefined)`. A sync already in flight from `syncWhenOnline` also covers these records (CHY-26 S3). A reload before the removal records the same ids again, which the Ledger ignores (CHY-24 AC3).
- [AC5] Study does the rest (progress.ts:49-66): each level run that closed at 10 answers with ≥ 8 right raises `placed`, marks lessons of that level and below passed + unlocked, adds their words to the Lexicon with no cards, unlocks the first lesson of the next level. The stopped level's open run changes nothing.
- [AC4] `resultView(cleared, LESSONS)` (`src/lib/placement/result.ts`, new, pure) → `{ eyebrow, title, lead, rows, cta, href, confetti }`, from `prototype/o3-result.html:57-82`:
  - `cleared = 0`: "Bạn bắt đầu ở", "Bài 0 · Nhập môn 拼音", lead "Làm quen pinyin trước: thanh điệu, vận mẫu, thanh mẫu. 5 phần ngắn, nghe là chính. Nền chắc thì các bài sau nhanh hơn.", row "Tiếp theo" = "HSK 1 · {HSK 1 lessons after Bài 0} bài" / "Bắt đầu từ Bài 1 · {its title}"; CTA "Bắt đầu Bài 0"; confetti none.
  - `1 ≤ cleared ≤ 4`: "Bạn bắt đầu ở", "HSK {cleared + 1} · Bài {n}" (n of the first lesson of that level), lead "{title} {titleHanzi}"; rows "Đã mở" = "{HSK 1 | HSK 1–cleared} · Bài 0–{n of the last lesson of level cleared}" / "Đánh dấu “qua bằng kiểm tra” trong lộ trình, học lại được", "Từ của tôi" = "+{words of levels ≤ cleared} từ, chưa ôn" / "Có trong Luyện tập → Từ của tôi", "Ôn dần" = "~20 từ mỗi ngày" / "Xen với bài mới, không dồn ôn hết trong hôm nay"; CTA "Bắt đầu Bài {n}"; confetti none at 1, `normal` at 2-3, `big` at 4.
  - `cleared = 5`: "Bạn đã qua", "Cả 5 cấp HSK", lead "Mọi bài đã mở. Thử Chuyên đề, hoặc làm thi thử để giữ phong độ."; rows as above with "HSK 1–5"; CTA "Xem Chuyên đề"; confetti `big`.
  - `href`: `/today` (Home shows the current lesson, CHY-45) for 0-4, `/roadmap` for 5. The page maps `/today` → `resolve('/(app)/(tabs)/today')` and `/roadmap` → `resolve('/(app)/(tabs)/roadmap')` (both exist on main, src/lib/shell/tabs.ts:5-6); the CTA is an `<a>`. No copy in the 0 case says the learner failed (no "trượt", "chưa đạt", "tiếc").
- [AC4] Art: `static/onboard/start-b0.webp` for 0, `static/onboard/placed.webp` otherwise (both committed by CHY-26 S1).
- [AC4] `src/lib/ui/celebrate.ts` (new): the prototype's confetti (prototype/step.js:106-180) as `celebrate({ big })`: one fixed canvas, side cannons then a shower, removed when the last bit falls; with `prefers-reduced-motion: reduce` it draws nothing. The page calls it 250 ms after mount when `confetti !== 'none'`.
- [CHORE] Copy in messages/vi.json (`placement_result_*`). `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- Retake from T4, the "qua bằng kiểm tra" label on the Roadmap (CHY-49), Home's lesson card (CHY-45).

## Seam
`learnerLedger` is the one place the app opens a learner's Ledger; its Store stays Supabase in the app and memory in tests.

## Test contract
CI (vitest, node), with WAVE-PLAN Q3 A's curriculum (6 lessons, words 0/10/12/13/15/15):
- [AC4] `result.test.ts` `resultView`:
  - 0 → title "Bài 0 · Nhập môn 拼音", row "HSK 1 · 1 bài" / "Bắt đầu từ Bài 1 · Xin chào", CTA "Bắt đầu Bài 0", href /today, confetti none; `JSON.stringify(view)` matches none of `/trượt|chưa đạt|tiếc/i`.
  - 1 → "HSK 2 · Bài 2", lead "Mấy giờ bạn dậy? 你几点起床", "HSK 1 · Bài 0–1", "+10 từ, chưa ôn", CTA "Bắt đầu Bài 2", none.
  - 2 → "HSK 3 · Bài 3", lead "Kỳ thi sắp đến 考试就要到了", "HSK 1–2 · Bài 0–2", "+22 từ, chưa ôn", "~20 từ mỗi ngày", CTA "Bắt đầu Bài 3", normal.
  - 4 → "HSK 5 · Bài 5", "HSK 1–4 · Bài 0–4", "+50 từ, chưa ôn", CTA "Bắt đầu Bài 5", big.
  - 5 → eyebrow "Bạn đã qua", "Cả 5 cấp HSK", lead starts "Mọi bài đã mở.", "HSK 1–5 · Bài 0–5", "+65 từ, chưa ôn", CTA "Xem Chuyên đề", href /roadmap, big.
- [AC5] `placement-study.test.ts`: S1's 25-answer run (L1 R×10; L2 W W R×8; L3 R W R W W) recorded into `openLedger({ initial: initialState({ curriculum: CURRICULUM }), store: memoryStore(), idb: new IDBFactory() })` → `state().placed` 2; h0-00, h1-01, h2-01 `passed` and `unlocked`; h3-01 `unlocked`, not passed; h4-01 locked; 22 Lexicon entries, each `saved: false`, `cards: {}`; every recorded input has `step.kind 'placement'`. Recording the same 25 again → `pending()` and `state()` unchanged. Negative control: drop the L2 run's 9th and 10th answers → `placed` 1, 10 Lexicon entries.
- [AC5] `learner.test.ts` (`vi.stubGlobal('window', new EventTarget())`, because `syncWhenOnline` defaults to `window`, online.ts:3): with a stub client (settings read → `{ tz: 'Asia/Tokyo' }`, `auth.onAuthStateChange` → `{ data: { subscription: { unsubscribe() {} } } }`) and `new IDBFactory()`, two calls with one uid return the same Ledger, another uid gets a different one, the database is named `chaiyo-ledger-<uid>`, and `state().tz` is `'Asia/Tokyo'`.
Local proof (tester, Mac, as CHY-28 S2): run the 25-answer path → result shows the cleared-2 texts and a confetti canvas; psql `select count(*) from attempts where step->>'kind' = 'placement'` for the learner → 25 within 10 s, with no reload and no network change. Seed `sessionStorage` for 0, 1, 4 and 5 (Attempts built from the bank) → each row's texts; canvas present for 4 and 5, absent for 0 and 1; with `emulateMedia({ reducedMotion: 'reduce' })` no canvas for 5.

## Open assumptions
- WAVE-PLAN Q3 assumed A; with B the CI values change to the prototype outline's numbers.
