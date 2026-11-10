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
		prefix = ''
	}: {
		engine: Engine;
		bucket: Bucket;
		recorded?: (key: string) => Bytes | undefined;
		prefix?: string;
	}
): Promise<RenderResult> {
	for (const e of entries)
		if (e.key !== audioKey(e.split ? e.ref : e.hanzi, e.voice, e.style))
			throw new Error(`key mismatch: ${e.ref}`);

	let uploaded = 0;
	let skipped = 0;
	const failures: RenderFailure[] = [];
	const seen = new Set<string>();
	for (const e of entries) {
		if (seen.has(e.key)) continue;
		seen.add(e.key);
		const name = `${prefix}${e.key}.mp3`;
		try {
			if (await bucket.has(name)) {
				skipped++;
				continue;
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
	}
	if (failures.length) throw new RenderError(uploaded, skipped, failures);
	return { uploaded, skipped };
}
