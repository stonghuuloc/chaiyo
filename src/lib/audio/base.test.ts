import { describe, expect, it } from 'vitest';
import { AUDIO_CACHE } from '../../service-worker/audio';
import { AUDIO_BASE, SYLLABLE_BASE } from './base';
import { AUDIO_VERSION, SYLLABLE_VERSION } from './version';

describe('audio base', () => {
	it('reads clips under the versioned prefix and caches them under its own name', () => {
		expect(AUDIO_VERSION).toBe('lessons-1');
		expect(AUDIO_BASE.endsWith('/lessons-1')).toBe(true);
		expect(AUDIO_CACHE).toBe('audio-lessons-1');
	});

	it('reads syllable clips (Yoyo Chinese recordings) under their own prefix', () => {
		expect(SYLLABLE_VERSION).toBe('pinyin-chart');
		expect(SYLLABLE_BASE).toBe(`${AUDIO_BASE.slice(0, -AUDIO_VERSION.length)}pinyin-chart`);
	});
});
