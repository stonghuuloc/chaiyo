import { audioKey, type AudioEntry } from '../content/import/audio';
import {
	type Bytes,
	RenderError,
	type Bucket,
	type Engine,
	type RenderFailure,
	type RenderResult
} from './types';

export async function render(
	entries: AudioEntry[],
	{
		engine,
		bucket,
		recorded,
		prefix = '',
		concurrency = 1
	}: {
		engine: Engine;
		bucket: Bucket;
		recorded?: (key: string) => Bytes | undefined;
		prefix?: string;
		concurrency?: number;
	}
): Promise<RenderResult> {
	for (const e of entries)
		if (e.key !== audioKey(e.split ? e.ref : e.hanzi, e.voice, e.style, e.folder))
			throw new Error(`key mismatch: ${e.ref}`);

	let uploaded = 0;
	let skipped = 0;
	const failures: RenderFailure[] = [];
	const unique = [...new Map(entries.map((e) => [e.key, e])).values()];
	const one = async (e: AudioEntry) => {
		const name = `${prefix}${e.key}.mp3`;
		try {
			if (await bucket.has(name)) {
				skipped++;
				return;
			}
			const body =
				recorded?.(e.key) ??
				(await engine.synthesize({
					text: e.reading ?? e.hanzi,
					voice: e.voice,
					style: e.style,
					key: e.key,
					kind: e.kind,
					hanzi: e.hanzi
				}));
			if (!body.byteLength) throw new Error('engine returned 0 bytes');
			await bucket.put(name, body, 'audio/mpeg');
			uploaded++;
		} catch (err) {
			failures.push({
				key: e.key,
				ref: e.ref,
				message: err instanceof Error ? err.message : String(err)
			});
		}
	};
	let next = 0;
	const worker = async () => {
		while (next < unique.length) await one(unique[next++]);
	};
	await Promise.all(Array.from({ length: Math.max(1, concurrency) }, worker));
	if (failures.length) throw new RenderError(uploaded, skipped, failures);
	return { uploaded, skipped };
}
