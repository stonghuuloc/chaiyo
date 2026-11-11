# CHY-28 S2 — spec
ACs: AC1 (screen), AC3  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main 18af4bb; **builds on CHY-28 S1 and CHY-26 S1**)

## Behaviour
- [AC1] Route `src/routes/(onboard)/placement/+page.svelte` (new; the `(onboard)` guard from CHY-26 S1 requires a session). Top bar: ✕ button (`aria-label="Thoát bài kiểm tra"`) and the title "Kiểm tra trình độ". The page shows no level label, no "HSK", no counter and no progress bar (prototype/o2-placement.html:24-29).
- [AC1] Read item: eyebrow "Chọn nghĩa", heading "Từ này nghĩa là gì?", the hanzi alone in a card (no pinyin), 4 options. Listen item: eyebrow "Nghe và chọn chữ", heading "Bạn nghe được từ nào?", a play button that plays `item.clip` once on show and again on tap (`#lib/audio` `play`; the 2nd play of one key is 0.5×, the player's rule, player.ts:19-25), 4 hanzi options. Options are shuffled per item with `shuffle(options, Math.random)`.
- [AC1] Under the options a dashed button "Không biết" calls `answer(run, { ok: false, ms, at }, uuid)` at once. Tapping an option selects it (`aria-pressed`); the bottom button "Câu tiếp" is disabled until a pick, then calls `answer(run, { ok: pick === item.answer, pick, ms, at }, uuid)`. `ms` = time since the item showed; `at` = `new Date().toISOString()`.
- [AC1] No answer shows right or wrong: no colour, mark or text changes after a pick beyond the selection; a cleared level moves to the next item of the next level with no message.
- [AC1] When `run.done`: `sessionStorage[HANDOFF] = JSON.stringify({ cleared: run.cleared, attempts: run.attempts })`, then `goto(resolve('/(onboard)/placement/result'), { replace: true })`. Nothing is written to the Ledger in this slice. S2 adds a one-line stub `src/routes/(onboard)/placement/result/+page.svelte` so the route id exists on S2's base (C-M4-3); S3 replaces it.
- [AC3] ✕ opens `Sheet` "Thoát bài kiểm tra?" with "Kết quả sẽ không được lưu.", "Làm tiếp" (primary; closes the sheet, same item and pick still shown) and "Thoát" (outline; removes `sessionStorage[HANDOFF]`, `goto(resolve('/(app)/(tabs)/today'))`). Scrim tap and Escape = "Làm tiếp" (Sheet `onclose`, src/lib/ui/modal.ts:20; the prototype closes the sheet on Escape too, o2-placement.html:84).
- [CHORE] Copy in messages/vi.json (`placement_*`). `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Not this slice
- Bank, run rules → S1. `/placement/result`, recording Attempts → S3. The Welcome button that opens this route → CHY-27 S2.

## Seam
None new. `shuffle` lives in `src/lib/placement/shuffle.ts` with an injected `random`.

## Test contract
CI (vitest, node, `src/lib/placement/shuffle.test.ts`):
- [AC1] `shuffle(['a','b','c','d'], seq(0.9, 0.1, 0.5))` returns `['c','b','a','d']` (j = 3, 0, 1 from the end); the input is unchanged. Negative control: `return [...xs]` → fails; revert.
Local proof (tester, Mac, `supabase start`, `pnpm dev --host 127.0.0.1`, an onboarded learner signed in by S1's link, Playwright Chromium, answers chosen from `src/lib/placement/bank.ts`):
- [AC1] `/placement`: body text matches none of `/HSK/`, `/Cấp/`, `/\d+\s*\/\s*10/`, `/Câu \d/`; first item is "Chọn nghĩa" with 朋友 and 4 options; "Câu tiếp" disabled until a tap.
- [AC1] Answer L1 right ×10 and L2 W W R×8, L3 R W R W, then "Không biết" → the URL becomes `/placement/result` (S3's page, or S2's stub before S3), and `sessionStorage` holds `cleared: 2` and 25 Attempts whose 25th has `correct: false` and no `answer`. At no step does an option carry a "right"/"wrong" class or a check/cross icon.
- [AC1] A listen item: `page.waitForRequest` sees a GET ending in `/<clip>.mp3` for that item's `clip` when it shows (the player's `Audio` is not in the DOM, src/lib/audio/player.ts:12, :22).
- [AC3] after 3 answers tap ✕ → sheet texts; "Làm tiếp" → sheet gone, same item; ✕ → "Thoát" → URL `/today`, `sessionStorage` has no `chaiyo.placement`, and IndexedDB has no `chaiyo-ledger-*` input with `step.kind = 'placement'`; ✕ → tap the scrim → sheet gone, same item; ✕ → Escape → sheet gone, same item.

## Open assumptions
- None.
