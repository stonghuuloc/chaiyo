# CHY-28 S1 — plan
ACs: AC1, AC2  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-28  ·  Lane L3 Placement (WAVE-PLAN)

## Depends on (execution order)
- main 18af4bb only. No route, no Supabase.

## Anchors (verified 2026-11-11 on main 18af4bb)
- `prototype/data/placement.js:5-71` bank, `:74-83` `questions()` order; `prototype/o2-placement.html:49` `MAX_MISS = 10 − PASS + 1`, `:65-72` `answer()`.
- `src/lib/content/import/audio.ts:21-34` `audioKey`, `:36` `WORD_STYLE`, `:94-105` lesson word entry (`kind: 'word'`, `voice: 'redpanda'`, `folder: 'words'`).
- `scripts/render-audio.ts:32, 65` kinds and usage (`<audio-manifest.json> --kind word`).
- `src/lib/study/types.ts:5-14` `Curriculum`, `Step`; `src/lib/study/fixtures/curriculum.ts:18-24` (Primer shape: `testOut`, 5 sections, no words).
- `content/lessons/hsk1/h0-00.yaml:1-5` (`kind: primer`, `order: 0`), `content/lessons/hsk1/h1-01.yaml:2-7, 33-36`; `package.json:62` `yaml` devDependency; `package.json:6-31` scripts.

## Task 1 [AC1] bank
Files: `src/lib/placement/bank.ts`, `src/lib/placement/bank.test.ts` (new)
- Verify: `pnpm vitest run src/lib/placement/bank` → pass. Negative control: duplicate one distractor → the distinct-options row fails; revert.

## Task 2 [AC1] clip keys + manifest
Files: `scripts/placement-clips.ts`, `src/lib/placement/clips.json`, `src/lib/placement/clips.test.ts` (new), `package.json` (+1 script)
- Verify: `pnpm placement:clips ~/.capy/work/m4/placement-manifest.json` writes 20 entries; `pnpm vitest run src/lib/placement/clips` → pass.
- Render: `pnpm render:audio ~/.capy/work/m4/placement-manifest.json --kind word` on the Mac with the Azure + R2 env (implementer if the shell has them, else hand to the lead for Loc); then `curl -sI <PUBLIC_AUDIO_BASE_URL>/<key>.mp3` → 200 for all 20.

## Task 3 [AC1] [AC2] run rules
Files: `src/lib/placement/run.ts`, `src/lib/placement/run.test.ts`, `src/lib/placement/index.ts` (new; exports `items`, `startRun`, `answer`, `PLACEMENT_SHA`, `HANDOFF = 'chaiyo.placement'`)
- Verify: `pnpm vitest run src/lib/placement/run` → pass; negative control per SPEC.

## Task 4 [CHORE] curriculum
Files: `scripts/build-curriculum.ts`, `src/lib/curriculum/curriculum.json`, `src/lib/curriculum/index.ts`, `src/lib/curriculum/curriculum.test.ts` (new), `package.json` (+1 script)
- Verify: `pnpm curriculum` then `git diff --exit-code src/lib/curriculum/curriculum.json`; `pnpm vitest run src/lib/curriculum` → pass.

## Task 5 [CHORE] gates
- `pnpm check`, `pnpm lint`, `pnpm test:coverage`, `pnpm build` exit 0.

## Mutation paths covered
- Run: miss in level 1, clear with 2 misses, stop in a later level, all 5 cleared, "Không biết". Bank: shape, order, uniqueness, clip keys. Curriculum: order, numbering, words, sections without warmup, Primer.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
// src/lib/placement/run.ts
export function answer(r: Run, a: { ok: boolean; pick?: string; ms: number; at: string }, uuid: () => string): Run {
	const item = items(r.level)[r.index];
	const attempt: Attempt = { id: uuid(), at: a.at, questionId: item.id, contentSha: PLACEMENT_SHA, correct: a.ok, ms: a.ms,
		...(a.pick === undefined ? {} : { answer: a.pick }), step: { kind: 'placement', level: r.level, run: r.runId, of: 10 } };
	const attempts = [...r.attempts, attempt];
	const miss = r.miss + (a.ok ? 0 : 1);
	if (miss >= 10 - PASS + 1) return { ...r, attempts, miss, done: true };
	if (r.index + 1 < 10) return { ...r, attempts, miss, index: r.index + 1 };
	if (r.level === 5) return { ...r, attempts, miss, cleared: 5, done: true };
	return { ...r, attempts, cleared: r.level, level: r.level + 1, index: 0, miss: 0, runId: uuid() };
}
```
Report any difference from SPEC to the lead; do not change an expected value.

## Rollback
`git revert`; rendered clips stay in R2 (immutable keys, harmless).
