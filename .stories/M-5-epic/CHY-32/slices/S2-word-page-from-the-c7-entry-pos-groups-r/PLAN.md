# CHY-32 S2 — plan
ACs: AC5, AC6  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-32-S2 (Orca lane branch)
Base: .@a65f4297

Landing order: rebase onto CHY-25.S2's tip first (it adds `catalog` in `src/lib/catalog/index.ts`);
land before CHY-39.S1 (it adds Báo lỗi to `+page.svelte`). Run `pnpm install` first.
Lint drift note: `origin/main` has 84504bbf (squash of CHY-25.S1 #155; `git diff a65f4297 84504bbf -- src/lib/catalog` is
empty) then 560783de (revert of #154/#155/#156). The lane builds on the CHY-40-S1 stack, so the anchors hold there.

## Files touched
- create `src/routes/(app)/word/[id]/word-view.ts`, `word-view.test.ts`
- create `src/routes/(app)/word/[id]/WordEntry.svelte`, `WordEntry.svelte.test.ts`, `+page.svelte.test.ts`
- edit `src/routes/(app)/word/[id]/+page.ts`, `+page.svelte`
- edit `messages/vi.json` (outside the lane, keys after `screen_word`, `:13`)

## Anchors (verified 2026-11-16 on a65f4297)
- `src/routes/(app)/word/[id]/+page.ts:1-3` — `load = () => ({ shell: { template: 'pushed', section: 'practice' } satisfies Shell })`.
- `src/routes/(app)/word/[id]/+page.svelte:1-5` — `<h1>{m.screen_word()}</h1>` only.
- `src/routes/(app)/pinyin/+page.ts:3-6` — sibling load reading `url.searchParams` (`{ url }: { url: URL }`).
- `src/routes/+layout.ts:8` — `ssr = false`: the load runs in the browser.
- `src/lib/catalog/index.ts:13-20` `CatalogError(code, id)`, codes `'not-found' | 'offline' | 'malformed'`;
  `:22-32` `LessonContent.sentences: ImportedSentence[]`; `:35` `CatalogWord = ImportedWord & { contentSha? }`;
  `:38-43` `Catalog`; `:87-95` `lesson(id)` (cache hit `:90`); `:96-99` `word(id)` searches loaded bundles.
- After CHY-25.S2 Task 2 (`CHY-25 S2 PLAN.md:59-61`): `export const catalog = createCatalog(httpSource())` in
  `src/lib/catalog/index.ts`. If the name differs on CHY-25.S2's tip, use that name; report a missing export.
- `src/lib/content/import/sink.ts:19` `ImportedWord = Word & { taughtIn?: string; listedIn: string[] }`; `:21` `ImportedSentence = Sentence & { lessonId?; seg }`.
- `src/lib/content/schemas.ts:5-19` `Pos` (13 values); `:50-60` sense `{ vi, note?, pos?, rare?: true, example? }`; `:88` `source: 'ai' | /^tatoeba:\d+$/`, optional.
- `src/lib/catalog/fixtures/source.ts:8` `fixtureSource()`; fixture lesson `h1-01` holds `你好` (`pos: [phrase]`, one untagged sense, `examples: [s-h1-01-14, s-w-1]`).
- `src/lib/lesson/steps/Choice.svelte.test.ts:1-5` — jsdom pattern `mount`/`flushSync`/`unmount` + `m` from `#lib/paraglide/messages.js`.
- `messages/vi.json:13` `"screen_word": "Từ"`; params use `{name}` (`:36` `"login_restore_days": "{days} ngày"`).

## Task 1 [AC5] [AC6] Pure view builder
File: create `src/routes/(app)/word/[id]/word-view.ts`
- Test first `word-view.test.ts` (server project), inline word/sentence objects with real values:
  - `Given_HaoShape_When_View_Then_FiveGroupsInFirstSeenOrder_UntaggedHidden_RareCountOne` —
    `好`: senses [untagged "tốt, khỏe, hay"; adj ×3 (3rd rare); adv ×4; comp; interj; phrase] →
    `groups.map(g => g.pos)` = `['adj','adv','comp','interj','phrase']`, `rare` = 1, no sense `vi` "tốt, khỏe, hay".
  - `Given_NiShape_When_View_Then_OnePronSense` — `你` → 1 group `pron`, 1 sense, example `你是谁？`.
  - `Given_AllUntagged_When_View_Then_GroupByWordPos_WithWordExample` — `你好` → group `phrase`, sense
    "xin chào", example id `s-h1-01-14`.
  - `Given_TatoebaSource_When_View_Then_TatoebaUrl` — `tatoeba:785298` → `{ kind: 'tatoeba', url: 'https://tatoeba.org/vi/sentences/show/785298' }`; `'ai'` → `{ kind: 'ai' }`; absent → `null`.
  - `Given_ExampleIdNotInBundle_When_View_Then_ExampleNull`.
- Change: export `type WordView = { hanzi; pinyin; hanviet?; groups: { pos: Pos; senses: { vi; rare: boolean; example: { hanzi; pinyin; vi; source: Source } | null }[] }[]; rare: number }`
  (no `hasAi`: the disclaimer depends on which senses are shown, so `WordEntry` derives it)
  and `wordView(word: ImportedWord, sentences: ImportedSentence[]): WordView`; `type Pos = Word['pos'][number]`
  derived locally (no `schemas.ts` edit).
- Verify: `pnpm test -- "src/routes/(app)/word/[id]/word-view.test.ts"`

## Task 2 [AC5] Load with `?lesson=` and not-found fallback
File: `word-view.ts` (add `loadWord`), `src/routes/(app)/word/[id]/+page.ts:3`
- Test first (same file, server project, `createCatalog(await fixtureSource())` per test):
  - `Given_FreshCatalog_And_LessonParam_When_Load_Then_View` — `loadWord(c, '你好', 'h1-01')` → `hanzi` `你好`.
  - `Given_FreshCatalog_NoParam_When_Load_Then_NotFound` — `loadWord(c, '你好', null)` → `{ notFound: true }`.
  - `Given_UnknownLesson_When_Load_Then_NotFound` — `'h9-99'` → `{ notFound: true }`.
  - `Given_ParamLessonWithoutWord_LoadedEarlier_When_Load_Then_ExamplesResolved` — fixture has one lesson, so build a
    two-lesson `CatalogSource` in the test (second bundle = h1-01 bundle with `lesson.id` `h1-02`, `words: []`):
    `c.lesson('h1-01')` then `loadWord(c, '你好', 'h1-02')` → example `s-h1-01-14` resolved, not null.
  - `Given_LessonLoadedEarlier_UnknownParam_When_Load_Then_View` — `await c.lesson('h1-01')` then `loadWord(c, '你好', 'h9-99')` → view.
  - `Given_LessonLoadedEarlier_NoParam_When_Load_Then_View` — `await c.lesson('h1-01')` then `loadWord(c, '你好', null)` → view.
  - `Given_OfflineSource_When_Load_Then_Throws` — source whose `bundle` throws `CatalogError('offline', 'h1-01')` → rejects with code `offline`.
- Change: `loadWord(catalog: Catalog, id: string, lesson: string | null): Promise<WordView | { notFound: true }>`:
  `lesson` set → `await catalog.lesson(lesson)`, swallowing only `CatalogError` codes `not-found`/`malformed`;
  `catalog.word(id)` → `not-found` → `{ notFound: true }`. Sentences: from the `LessonContent` the `lesson` param
  resolved to, only when `content.words.some((w) => w.id === id)` (the word's examples ship in its own bundle,
  `bundle.ts:41-48`); when the param is null, did not resolve, or does not hold the word, `const from = word.taughtIn; if (!from) return { notFound: true }` then `catalog.lesson(from)` (cache
  hit `index.ts:90`, same not-found/malformed swallow → `{ notFound: true }`). `wordView(word, sentences)`. Other errors rethrow.
- `+page.ts` (`import type { PageLoad } from './$types'`): `export const load: PageLoad = async ({ params, url }) =>
  ({ shell: …same…, word: await loadWord(catalog, params.id, url.searchParams.get('lesson')) })`.
- Verify: `pnpm test -- "src/routes/(app)/word/[id]"`; `pnpm check`.

## Task 3 [AC5] [AC6] `WordEntry.svelte` + page
Files: create `WordEntry.svelte`; edit `+page.svelte:1-5`; edit `messages/vi.json:13`
- Test first `WordEntry.svelte.test.ts` (client project, jsdom, `mount(WordEntry, { target, props: { view } })`):
  - `Given_ThreeRare_When_Render_Then_MoreButton_RareHidden` — text "Xem thêm 3 nghĩa ít gặp", none of the 3 rare `vi`.
  - `Given_ThreeRare_When_ClickMore_Then_RareShown_ButtonThuGon` — click + `flushSync` → 3 rare `vi` present, button "Thu gọn"; click again → hidden.
  - `Given_NoRare_When_Render_Then_NoButton`.
  - `Given_GroupOnlyRare_When_Render_Then_GroupHidden_UntilOpened`.
  - `Given_PosAdj_When_Render_Then_HeadingTinhTu` — group heading text = `m.word_pos_adj()`.
  - `Given_TatoebaExample_When_Render_Then_LinkLabelled` — `a[href="https://tatoeba.org/vi/sentences/show/785298"]` text "Tatoeba", `target="_blank"`, `rel="noopener"`.
  - `Given_AiExample_When_Render_Then_DisclaimerOnce` / `Given_OnlyTatoeba_When_Render_Then_NoDisclaimer`.
  - `Given_OnlyAiOnRareSense_When_Render_Then_NoDisclaimer_UntilOpened`.
  - `Given_DataWordChanges_When_Rerender_Then_ToggleReset` — `+page.svelte.test.ts`: mount the page with `$state` `data`
    (word with 1 rare sense), click the toggle, set `data.word` to another word with 1 rare sense, `flushSync` →
    button reads "Xem thêm 1 nghĩa ít gặp" (proves `{#key}`).
  - `Given_Sense_When_Render_Then_ExampleHanziUnderIt` — `我好累。` inside the `<li>` holding "quá, thật là".
- Change `WordEntry.svelte` (`<script lang="ts">`, Svelte 5 runes, `let { view } = $props()`,
  `let open = $state(false)`): header (hanzi, pinyin, Hán Việt) · `<div class="report-slot"></div>` (empty, for
  CHY-39.S1) · groups (`<h2>` POS label, `<ol>` senses with example block + source label) · rare toggle button ·
  disclaimer `<p>` when `$derived` any shown sense has `example?.source?.kind === 'ai'`.
- `+page.svelte`: `let { data }: PageProps = $props()` (`pinyin/+page.svelte:10`);
  `{#if 'notFound' in data.word}<p>{m.word_not_found()}</p>{:else}{#key data.word.hanzi}<WordEntry view={data.word} />{/key}{/if}`
  (`{#key}` resets the rare toggle when SvelteKit reuses the page for `/word/A` → `/word/B`); `<h1>` keeps `m.screen_word()` for the shell title.
- `messages/vi.json` after `:13` (one block): `word_pos_n` "Danh từ", `word_pos_v` "Động từ", `word_pos_adj` "Tính từ",
  `word_pos_adv` "Phó từ", `word_pos_pron` "Đại từ", `word_pos_num` "Số từ", `word_pos_mw` "Lượng từ", `word_pos_prep`
  "Giới từ", `word_pos_conj` "Liên từ", `word_pos_part` "Trợ từ", `word_pos_interj` "Thán từ", `word_pos_phrase` "Cụm từ",
  `word_pos_comp` "Bổ ngữ", `word_rare_more` "Xem thêm {count} nghĩa ít gặp", `word_rare_less` "Thu gọn",
  `word_source_tatoeba` "Tatoeba", `word_ai_disclaimer` "Ví dụ: Tatoeba hoặc AI · AI biên tập, chưa được giáo viên duyệt",
  `word_not_found` "Không tìm thấy từ này.". `messages/en.json` holds 1 key and no `screen_word`: not edited.
- Verify: `pnpm test -- "src/routes/(app)/word"`; `pnpm check`; `pnpm lint` run raw (not under rtk).

## Task 4 [AC5] [AC6] Browser check
- `bash scripts/build-content.sh` (CHY-25 STORY: writes `static/content/<sha>/h1-01.json`), dev on port 5414 `--strictPort`.
- Open `/word/好?lesson=h1-01` cold (new tab): 5 group headings Tính từ, Phó từ, Bổ ngữ, Thán từ, Cụm từ;
  "Xem thêm 1 nghĩa ít gặp" → tap → "thân, thân thiết (hai người)" shown, button "Thu gọn".
  `好` is in h1-01 only if the bundle holds it (`h1-01.yaml:967`) — yes.
- Example "我好累。" carries "Tatoeba" → `…/show/785298`; disclaimer line present (`好` has AI examples).
- `/word/好` cold → "Không tìm thấy từ này."; `/word/好?lesson=h9-99` → same.
- Screenshot both into the slice dir for VERIFY.

## Mutation paths covered
- Read-only screen; the only inputs are `params.id` and `?lesson`. Covered: param present/absent/unknown,
  lesson loaded earlier vs cold, Source `offline` (rethrown), word with tagged/untagged/rare senses, example with
  tatoeba/ai/no source, sense example id missing from `sentences` (→ `example: null`, Task 1), `/word/A` → `/word/B` toggle reset (Task 3).

## Draft code (UNEXECUTED — adapt to disk; a self-contradicting fixture is reported, not hacked around)
```ts
const TATOEBA = /^tatoeba:(\d+)$/;
export function wordView(word: ImportedWord, sentences: ImportedSentence[]): WordView {
	const byId = new Map(sentences.map((s) => [s.id, s]));
	const tagged = word.senses.some((s) => s.pos);
	const shown = tagged ? word.senses.filter((s) => s.pos) : word.senses;
	const groups: WordView['groups'] = [];
	for (const s of shown) {
		const pos = s.pos ?? word.pos[0];
		let g = groups.find((x) => x.pos === pos);
		if (!g) groups.push((g = { pos, senses: [] }));
		const ex = byId.get(s.example ?? (tagged ? '' : word.examples[0]));
		g.senses.push({ vi: s.vi, rare: s.rare === true, example: ex ? { hanzi: ex.hanzi, pinyin: ex.pinyin, vi: ex.vi, source: src(ex.source) } : null });
	}
	const all = groups.flatMap((g) => g.senses);
	return { hanzi: word.hanzi, pinyin: word.pinyin, hanviet: word.hanviet, groups,
		rare: all.filter((s) => s.rare).length };
}
```

## Rollback
`git revert` this slice's commits; no migration, no data.
