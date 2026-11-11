import { describe, expect, it } from 'vitest';
import { audioKey, WORD_STYLE } from '#lib/content/import/audio.js';
import { BLOCKS } from './bank';
import clips from './clips.json';

describe('placement clips', () => {
	it('maps each listen answer to the lesson word key', () => {
		const hanzis = BLOCKS.flatMap((b) => b.listen.map(([h]) => h));
		expect(hanzis).toHaveLength(20);
		for (const h of hanzis)
			expect((clips as Record<string, string>)[h]).toBe(
				audioKey(h, 'redpanda', WORD_STYLE, 'words')
			);
		expect(Object.keys(clips)).toHaveLength(20);
	});
});
