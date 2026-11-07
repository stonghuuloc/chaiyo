# CHY-15 S1 — spec
ACs: AC1, AC2, AC3, AC4  ·  Repo: stonghuuloc/chaiyo  ·  rev 1 (vs main fd2b67a)

## Behaviour
- [AC1] `render(entries, { engine, bucket })` resolves `{ uploaded, skipped }`. For each entry whose object `<key>.mp3` is not in the bucket it calls the engine once with `{ text: reading ?? hanzi, voice }`, puts the returned bytes under `<key>.mp3` with content type `audio/mpeg`, and counts `uploaded`. With 3 entries on an empty bucket the result is `{ uploaded: 3, skipped: 0 }` and the bucket holds 3 objects.
- [AC2] An entry whose object already exists is not sent to the engine and counts `skipped`. Second run on the same 3 entries: `{ uploaded: 0, skipped: 3 }`, 0 engine calls in that run.
- [AC3] The object name is `<key>.mp3` where `key` = `audioKey(text, voice)` from `src/lib/content/import/audio.ts` (sha256 of `text|voice`; `voice` = Cast id; `text` = `hanzi`, or `ref` when `split`). `你好！` by redpanda and by takin get two different keys; the same text by the same voice twice in one manifest gets one object.
- [AC3] Before any engine call, every entry's `key` is checked against that rule. A mismatch throws `Error('key mismatch: <ref>')` with 0 engine calls and 0 puts, so a hand-edited manifest cannot write clips under keys the app will not compute.
- [AC3] One object per key is ever written: no slow variant, no rate in the name.
- [AC4] Entries are deduped by key, first one wins, in manifest order. Adding a 4th entry `再见` by narrator to the 3 already rendered gives `{ uploaded: 1, skipped: 3 }` and 1 engine call.
- [NFR] Failure policy: an engine or bucket error on one entry does not stop the others. After the last entry `render` throws `RenderError` with `uploaded`, `skipped` and `failures: { key, ref, message }[]`. An engine result of 0 bytes counts as a failure and nothing is put. A re-run renders only what failed (AC2 behaviour).
- [CHORE] Seam: `Engine = { synthesize(req: { text: string; voice: string }): Promise<Uint8Array> }` and `Bucket = { has(name: string): Promise<boolean>; put(name: string, body: Uint8Array, contentType: string): Promise<void> }`, in `src/lib/audio-renderer/types.ts`. In-memory `fakeEngine` and `fakeBucket` live in `src/lib/audio-renderer/fakes.ts` for tests.
- [CHORE] `docs/content-schema.md:29` says `sha256(text|voice|rate)`; it becomes `sha256(text|voice)` (WAVE-PLAN P2).

## Not this slice
- [CHORE] Real OmniVoice engine (AC5), R2 bucket adapter, CLI `scripts/render-audio.ts`, `package.json` script, `.env.example` R2 public block, public URL → S2.

## Seam
`render` in `src/lib/audio-renderer/render.ts`, re-exported by `index.ts`. `node:crypto` only through `audioKey`. No CLI in this slice.

## Test contract (vitest, `src/lib/audio-renderer/render.test.ts`, run with `pnpm test --maxWorkers=2 src/lib/audio-renderer`)
- [AC1] 3 entries (你好！|redpanda, 你好！|takin, 谢谢|narrator), empty fake bucket → `{ uploaded: 3, skipped: 0 }`, 3 objects, each content type `audio/mpeg`, engine saw `{text:'你好！',voice:'redpanda'}`, `{text:'你好！',voice:'takin'}`, `{text:'谢谢',voice:'narrator'}`.
- [AC2] second run → `{ uploaded: 0, skipped: 3 }`, engine call count unchanged.
- [AC3] object names are `sha256('你好！|redpanda').mp3` etc. computed in the test with `node:crypto`, independent of `audioKey`; the bucket's key set equals exactly the expected names (no slow variant); the two 你好！ names differ; a duplicate entry makes 1 object; a split Word entry (`ref:'打-da2', hanzi:'打', reading:'dá', split:true`) is keyed `sha256('打-da2|narrator')` and sends `text:'dá'`; a tampered `key` throws `key mismatch: <ref>` with 0 engine calls.
- [AC4] 4th entry 再见|narrator → `{ uploaded: 1, skipped: 3 }`, 1 engine call.
- [AC1] engine throws on 谢谢 → `RenderError` with `uploaded: 2`, `failures` = 1 entry naming that key; bucket holds 2 objects; re-run with a working engine → `{ uploaded: 1, skipped: 2 }`. An engine returning 0 bytes → failure, nothing put.

## Open assumptions
- [AC3] Dedupe keeps the first entry per key; the importer already dedupes (audio.ts:91-95, keeping the lowest kind then ref), so the renderer's simpler first-wins rule only matters for hand-built manifests.
