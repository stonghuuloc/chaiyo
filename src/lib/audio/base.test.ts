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

	it('reads syllable clips (Tone Perfect FV3 recordings) under their own prefix', () => {
		expect(SYLLABLE_VERSION).toBe('az5');
		expect(SYLLABLE_BASE.endsWith('/az5')).toBe(true);
		expect(SYLLABLE_BASE.slice(0, -SYLLABLE_VERSION.length)).toBe(
			AUDIO_BASE.slice(0, -AUDIO_VERSION.length)
		);
	});
});
