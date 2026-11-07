# CHY-15 S1 — plan
ACs: AC1, AC2, AC3, AC4  ·  Spec rev 1  ·  Repo: stonghuuloc/chaiyo  ·  Branch: CHY-15

## Anchors (verified 2026-11-07 on main fd2b67a)
- `src/lib/content/import/audio.ts:5-13` — `AudioEntry` type; `:15-18` `audioKey`; `:59-61` split word keys on `w.id`.
- `src/lib/content/import/bundle-sink.ts:44-45` — `audio-manifest.json` = `{ sha, entries }`.
- `vite.config.ts:56` — vitest server project includes `src/**/*.test.ts`, node environment.
- `docs/content-schema.md:29` — the stale `|rate` key.

## Task 1 [AC1] Types, fakes, happy path
Files: `src/lib/audio-renderer/types.ts`, `fakes.ts`, `render.ts`, `index.ts`, `render.test.ts` (new)
- Test first: the AC1 test from the contract; run, see it fail on the missing module.
- `types.ts`: `Engine`, `Bucket`, `RenderResult`, `RenderError extends Error { uploaded; skipped; failures }`.
- `fakes.ts`: `fakeEngine(impl?)` records `calls`, returns `impl(req)` when given (tests throw or return 0 bytes through it), else `new TextEncoder().encode('mp3:' + text + '|' + voice)`; `fakeBucket()` backs a `Map<string, { body, contentType }>`.
- `render.ts`: loop, skip via `bucket.has`, put with `audio/mpeg`.
- Verify: `pnpm test --maxWorkers=2 src/lib/audio-renderer` green.

## Task 2 [AC2, AC4] Skip and incremental
File: `render.test.ts`
- [AC2] Add the AC2 and AC4 tests; they should pass on Task 1's code (skip is already in the loop). If either fails, fix `render.ts`.
- [AC4] Verify: same command.

## Task 3 [AC3] Key rule, dedupe, tamper check
Files: `render.ts`, `render.test.ts`
- Tests: independent sha256 names, bucket key set equals exactly the expected names (no slow variant), distinct voices, duplicate, split Word, tampered key (0 engine calls).
- `render.ts`: before the loop compare each `entry.key` with `audioKey(entry.split ? entry.ref : entry.hanzi, entry.voice)`; throw `key mismatch: <ref>`; dedupe keeping the first per key with a `Set`; engine text `entry.reading ?? entry.hanzi`.
- Verify: same command.

## Task 4 [AC1] Failure policy
Files: `render.ts`, `render.test.ts`
- Tests: engine throws on one entry, 0-byte result, re-run after failure.
- `render.ts`: try/catch per entry, collect failures, throw `RenderError` after the loop.
- Verify: same command.

## Task 5 [CHORE] Docs and gates
Files: `docs/content-schema.md:29`
- Replace `sha256(text|voice|rate)` with `sha256(text|voice)`.
- Verify: `pnpm check && pnpm lint && pnpm test --maxWorkers=2` green on the final tree (one expensive suite at a time).

## Mutation paths covered
- First render, re-render, incremental add, partial failure then re-run, tampered manifest, duplicate keys.

## Draft code (UNEXECUTED — expect it to be wrong; adapt to what's on disk)
```ts
export async function render(entries: AudioEntry[], { engine, bucket }: Deps): Promise<RenderResult> {
	for (const e of entries)
		if (e.key !== audioKey(e.split ? e.ref : e.hanzi, e.voice)) throw new Error(`key mismatch: ${e.ref}`);
	let uploaded = 0, skipped = 0;
	const failures: Failure[] = [];
	const seen = new Set<string>();
	for (const e of entries) {
		if (seen.has(e.key)) continue;
		seen.add(e.key);
		const name = `${e.key}.mp3`;
		try {
			if (await bucket.has(name)) { skipped++; continue; }
			const body = await engine.synthesize({ text: e.reading ?? e.hanzi, voice: e.voice });
			if (!body.byteLength) throw new Error('engine returned 0 bytes');
			await bucket.put(name, body, 'audio/mpeg');
			uploaded++;
		} catch (err) { failures.push({ key: e.key, ref: e.ref, message: (err as Error).message }); }
	}
	if (failures.length) throw new RenderError(uploaded, skipped, failures);
	return { uploaded, skipped };
}
```
