# CHY-5 S1 — plan
ACs: AC4  ·  Spec rev 1  ·  Repo: chaiyo  ·  Branch: CHY-5

## Anchors (verified 2026-10-30)
- `prototype/step.js:3-6` `$`, `$$`, `ic`, `go`; `:26` `bar(lit,total)`; `:36` `cta(label,{disabled,caret,hint,onClick})`; `:58-89` `choice(q,done)` — `q.feedback:false` = no right/wrong (Exam), default shows it (Practice); `:64` `q.optHtml` custom option markup; `:79` `q.explain(ans)`; `:104` `shuffle`; `:167` `celebrate`
- `prototype/l8-gate.html:80-204` gate runner: imports, `show()` `:176`, `choice({...,feedback:false})` `:182`, `submit()` → localStorage best `:193` → `l9-result.html` `:195`, ✕ `:204`
- `prototype/l9-result.html:19-21` `.score` styles; `:53` ✕; `:58` foot CTA + link; `:61` imports
- `prototype/p2-skill.html:29` ✕ → `t3-practice.html`; `:33` foot; `:53-63` `thi` card (`note` "Chưa có đề trong bản demo" `:61-62`); `:65-74` render + `cta('Về Luyện tập')`
- `prototype/t3-practice.html:80` `LEVEL = 1`; `:119` lock reason `why`, `:120` `open = mockLv < LEVEL`; `:123` mock row → `p2-skill.html?k=thi&m=${k}&lv=${mockLv}`
- `prototype/data/lexicon.js:27-29` `SEED_ADDED` 熊猫, 奶茶 (saved words); `:89` `inLexicon(hz)`; `:90` `addWord(row)` (dict row → localStorage `lexicon-added`); `:96` `loadDict()`; `:50` taught rows carry `taught`
- `prototype/data/dict.json` rows `[hz, py, key, hv, short, level, senses[], others[]]`; 505 rows with level 1
- `prototype/data/h1-01.js:12` `WORDS`, `:34` `word(hz)`, `:37` `SENTENCES`, `:49` `DIALOGUE`, `:54` `GRAMMAR`
- `prototype/w1-word.html:116-119` `.toast`; `:174-180` `zh()` + `say(text,btn,rate)` speechSynthesis; `:285` add → `toast('Đã thêm …')`
- `prototype/onboard.css:33-41` `.scrim` / `.sheet` (+ reduced motion)
- `prototype/p2-login.html:12-13` stylesheets; `:14-39` hero/foot styles; `:40` foot
- `scripts/gen-image.py OUT.png "prompt" [ref]` — gpt-image-2, ref default `assets/ref/cast.png` (old); current art uses `assets/ref/cast-v2.png` (`scripts/gen-result-art.sh:3,78`); `scripts/assets_push.py` uploads `assets/**` to R2 (needs `.env` R2 vars)
- Art on disk for P1: `assets/cast/{redpanda,takin,panda,fawn}.png`, `assets/onboard/welcome.png`
- `.gitignore:28` `assets/**/*.png` → new art is not committed; it goes to R2

All code is an **unexecuted draft**; a fixture that contradicts itself gets reported, not hacked around.
Prototype has no test runner: "test first" = write the node check / browser check, see it fail (file missing), then build.

## Task 1 [AC4] Mock paper data
File: `prototype/data/mock-h1.js` (new)
- Export `MOCK = { id:'h1-mock-1', level:1, sections:[listening, reading] }`; `listening = { key:'nghe', title:'Nghe', minutes:12, plays:2, parts:[p1..p4] }`, `reading = { key:'doc', title:'Đọc', minutes:20, parts:[p1..p4] }`.
- Part `{ type, ask, opts?, items[5] }`; types: `pic3` (say → pick picture A/B/C), `ans3` (say question → pick text A/B/C), `pic6` (say dialogue → pick picture from shared A–F), `qa3` (say statement + question → A/B/C), `rpic6` (read sentence → picture A–F), `reply6` (question → reply A–F), `gap6` (sentence with ( ) → word bank A–F), `star3` (sentence + ★ question → A/B/C). Item `{ say?|text, q?, opts?, ans, why }` (`why` = Vietnamese one-liner for Practice/review). Picture opts are keys into `assets/words/mock-h1/<key>.png`.
- Words: only level-1 rows of `dict.json`. Picture set (20, all level 1 in `dict.json`, checked 2026-10-30): shu 书, yiyuan 医院, xuexiao 学校, beizi 杯子, mifan 米饭, cha 茶, feiji 飞机, diannao 电脑, dianshi 电视, yifu 衣服, yisheng 医生, xiayu 下雨, shuijiao 睡觉, chifan 吃饭, dadianhua 打电话, jidan 鸡蛋, huoche 火车, shouji 手机, zhuozi 桌子, daqiu 打球.
- Test first: `scripts/check-mock.mjs` (new) imports `MOCK` + reads `dict.json`; asserts 2 sections × 4 parts × 5 items = 40, each `ans` ∈ its opts (or the part's shared opts), every hanzi token in say/text/opts is a level-1 dict word (segment by longest match), every picture key has `assets/words/mock-h1/<key>.png`. Fails now (file missing).
- Verify: `node scripts/check-mock.mjs` → `ok 40 questions`.

## Task 2 [AC4] Pictures in the Cast style
Files: `assets/words/mock-h1/<key>.png` (new, ~20, git-ignored)
- One call per picture, run 4 in parallel: `python3 scripts/gen-image.py assets/words/mock-h1/<key>.png "<object/scene>, one clear subject, Chaiyo Cast storybook style, warm paper background, no text" assets/ref/cast-v2.png` (ref passed explicitly — the default is the old lineup; animals/people scenes may show a Cast member).
- Review each against `assets/words/h2-01/w01.png` style; regenerate misses (max 2 tries each, then report).
- Push: `python3 scripts/assets_push.py` (no `--delete`).
- Verify: `node scripts/check-mock.mjs` picture assertion passes; `python3 scripts/assets_push.py` prints the new keys uploaded.

## Task 3 [AC4] Mode choice on the mock intro card
Files: `prototype/p2-skill.html:53-74`, `prototype/t3-practice.html:119-123`
- `t3-practice.html`: HSK 1 row (`mockLv === LEVEL`) keeps `why` and appends " · làm thử bản demo" so the row and the card agree.
- `thi` card for `lv === 1 && m !== 'noi'`: keep the lock line ("Mở khi bạn qua bài cuối của HSK 1"), replace "Chưa có đề trong bản demo" with a 2-option segmented choice **Thi thật** (Exam, default) / **Luyện** (Practice), one line each ("Có giờ, nghe 2 lần, xem đáp án cuối bài" / "Không giờ, xem đáp án từng câu"); show best Exam score from `localStorage['mock-h1-best']` if any; CTA "Bắt đầu" → `m2-mock.html?mode=exam|practice`. Other levels and Nói keep today's note and "Về Luyện tập".
- Test first (browser): `p2-skill.html?k=thi&m=viet&lv=1` has 2 mode options and CTA href `m2-mock.html?mode=exam`; `lv=2` still shows "Mở khi bạn đỗ thi thử HSK 1".

## Task 4 [AC4] M2 runner
File: `prototype/m2-mock.html` (new) — head/CSS from `l8-gate.html:1-79`, imports `step.js` + `data/mock-h1.js`.
- State `{ mode, si, pi, ii, answers:[] }`; top bar: ✕, section title, `bar()` progress over 40, Exam timer `mm:ss` from `section.minutes`.
- Render every part type through `choice()` with `feedback: mode==='practice'`, `explain: () => item.why`; picture parts pass `optHtml` = `<img src="../assets/words/mock-h1/<key>.png">` + A–F label, so Practice grades pictures too; `pic6`/`rpic6`/`reply6`/`gap6` show the shared A–F bank above the 5 items one at a time.
- Listening: play button speaks `item.say` (and `q`) via `speechSynthesis` zh-CN (copy `zh()`/`say()` from `w1-word.html:174-180`); Exam counts plays per item and disables the button at 2; Practice no limit.
- Exam timer: `setInterval` 1s; at 0 → record unanswered as wrong, jump to next section (reading) or `finish()`. Section start shows a short intro ("Phần nghe · 20 câu · 12 phút").
- ✕: Exam → `confirm('Bỏ bài thi? Bài làm sẽ không được lưu.')` → `t3-practice.html`; Practice → leave directly.
- `finish()`: per section correct/20 → score `round(correct*5)` /100; save `sessionStorage['mock-h1-last'] = {mode, answers, scores}`; Exam → `localStorage['mock-h1-best'] = max`; go `m3-result.html`.
- Test hook for the browser check: `?t=<seconds>` overrides section minutes (prototype-only, like `?retry` in `l8-gate.html:84`).
- Test first (browser): Exam start shows `12:00`; after 2 plays the play button is disabled; choosing an answer shows no right/wrong; `?t=3` auto-advances to "Phần đọc"; Practice shows "Đúng rồi"/"Chưa đúng" and no timer.

## Task 5 [AC4] M3 result + review
File: `prototype/m3-result.html` (new) — head/score styles from `l9-result.html:1-61`.
- Read `sessionStorage['mock-h1-last']`; none → "Chưa có bài làm" + link to `t3-practice.html`.
- Show total `/200`, "Đỗ" when ≥120 else "Chưa đỗ" (no shame copy), two section bars (`Nghe 85/100`, `Đọc 70/100`), mode label; Exam pass → `celebrate()`.
- "Xem lại đáp án" expands 40 rows: number, prompt (hanzi + pinyin), your answer vs right answer, `why`; wrong rows first-class red mark, right rows quiet.
- Foot: "Làm lại" → `p2-skill.html?k=thi&m=viet&lv=1`, link "Về Luyện tập".
- Test first (browser): after a Practice run, total and both bars present, 40 review rows, sum of section scores = total.

## Task 6 [AC4] X1 Tra nhanh
File: `prototype/x1-lookup.html` (new) — `lesson.css` + `onboard.css`; imports `step.js`, `data/h1-01.js`, `data/lexicon.js`.
- Body: header "Tra nhanh · Bài 1"; blocks: dialogue lines (`DIALOGUE` → `SENTENCES` hanzi, includes 谢谢), one `GRAMMAR` example, one word card (`WORDS[0]`), plus "Đọc thêm": 爸爸坐飞机去北京。 (untaught level-1 words) and 我喝奶茶。 (奶茶 seeded saved, `lexicon.js:28`); long enough that some lines sit in the lower half of a 844px viewport. Each hanzi wrapped in `<span class="h" data-i>` per line.
- Tap: `loadDict()`; over every window of length 4→1 that **contains** the tapped index, take the longest present in dict (ties → leftmost); highlight matched spans.
- Sheet (`.scrim`/`.sheet` look, but positioned): if tapped line `getBoundingClientRect().bottom < innerHeight/2` → sheet `top = rect.bottom + 8px`; else sheet `top = safe-area + 8px` and `max-height = rect.top - 16px`. Scrim stays; the tapped span gets `position:relative; z-index` above it so it stays visible.
- Sheet content: hanzi (big), pinyin, Hán Việt, short meaning, play (`say()`), chip row of the match plus its shorter sub-words at any position that have a dict row (飞机 · 飞; 北京 · 北; 爸爸 · 爸); hidden when there are none (谢谢 — no 谢 row).
- Actions: taught (`word(hz)` from `h1-01.js`) → "Xem chi tiết" `w1-word.html?w=`; else `inLexicon(hz)` → "Đã có trong Từ của tôi" (no button); else "Thêm vào từ của tôi" → `addWord(row)` + toast (`w1-word.html:116-119` style) and button swaps to the saved line.
- Esc / scrim tap closes; focus returns to the tapped span.
- Test first (browser): tap 2nd 谢 → title 谢谢, no chip row; tap 机 → 飞机, chip 飞 → title 飞; 爸爸 → "Thêm vào từ của tôi"; 奶茶 → "Đã có trong Từ của tôi"; tap a word on line 1 and on the last line → `rect(span)` ∩ `rect(sheet)` = ∅; untaught word add → toast text, then `t3-words.html` lists it; taught 你好 → "Xem chi tiết" href.

## Task 7 [AC4] P1 Landing
File: `prototype/p1-landing.html` (new) — stylesheets as `p2-login.html:12-13`, hero pattern `:14-39`.
- Hero: `assets/onboard/welcome.png` (Cast) masked like login; logo; h1 "Học tiếng Trung bằng tiếng Việt"; 3 short points with Cast art (`assets/cast/redpanda.png` — "Mỗi chữ có Hán Việt", `takin.png` — "Nghe giọng thật từ các bạn thú", `panda.png` — "Mỗi ngày một chút, có lộ trình HSK"); no lesson content, no dictionary, no audio.
- Foot: primary "Bắt đầu học" → `p2-login.html`; link "Đã có tài khoản? Đăng nhập" → `p2-login.html`.
- Test first (browser): CTA href `p2-login.html`; page has no `<audio>`, no `.hz` lesson text, no `dict.json` request.

## Task 8 [AC4] Browser pass + check
- Serve repo root in a split Orca pane: `orca terminal split --terminal $ORCA_TERMINAL_HANDLE --command "cd ~/Documents/Projects/chaiyo && python3 -m http.server 5180"`.
- agent-browser at 390×844 runs every browser check from Tasks 3–7; 0 console errors per page; screenshots to `.stories/M-0-epic/CHY-5/slices/S1-prototype-gaps/screens/`.
- `node scripts/check-mock.mjs` → ok.
- Hand each finished task to story-tester if team mode is chosen at execute.

## Mutation paths covered
- Mock: Exam vs Practice (feedback, timer, play limit, leave confirm); time-out mid-section with unanswered items; finish with 0 answered; M3 with no stored attempt.
- X1: taught / untaught / already-saved; shrink and re-grow; top vs bottom anchoring; add twice (`addWord` dedupes `lexicon.js:90`).
- Intro card: lv 1 viet (new), lv 1 noi, lv 2+ (unchanged).

## Rollback
`git revert` the slice commits; art stays in R2 under `assets/words/mock-h1/` (harmless; remove with `assets_push.py --delete` after deleting locally).
