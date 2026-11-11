import { describe, expect, it } from 'vitest';
import { audioKey } from '#lib/content/import/audio.js';
import { clips } from './clips.server';

describe('dev audio clips', () => {
	it('uses folder-prefixed Azure request keys', () => {
		expect(clips.every((c) => /^(words|examples|dialogue)\/[0-9a-f]{64}$/.test(c.key))).toBe(true);
		expect(clips.find((c) => c.hanzi === '你' && c.voice === 'redpanda')!.key).toBe(
			audioKey('你', 'redpanda', 'poetry-reading', 'words')
		);
		expect(new Set(clips.map((c) => c.key)).size).toBe(clips.length);
	});
});
