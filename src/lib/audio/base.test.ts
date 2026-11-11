import { describe, expect, it } from 'vitest';
import { AUDIO_CACHE } from '../../service-worker/audio';
import { AUDIO_BASE, SYLLABLE_BASE } from './base';
import { SYLLABLE_VERSION } from './version';

describe('audio base', () => {
	it('reads lesson clips from the bucket root, where each key starts with its folder', () => {
		expect(AUDIO_BASE.endsWith('/')).toBe(false);
		expect(AUDIO_CACHE).toBe('audio');
	});

	it('reads syllable clips (Yoyo Chinese recordings) under their own prefix', () => {
		expect(SYLLABLE_VERSION).toBe('pinyin-chart');
		expect(SYLLABLE_BASE).toBe(`${AUDIO_BASE}/pinyin-chart`);
	});
});
