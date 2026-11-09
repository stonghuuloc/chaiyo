import { describe, expect, it } from 'vitest';
import { AUDIO_CACHE } from '../../service-worker/audio';
import { AUDIO_BASE } from './base';
import { AUDIO_VERSION } from './version';

describe('audio base', () => {
	it('reads clips under the versioned prefix and caches them under its own name', () => {
		expect(AUDIO_VERSION).toBe('az2');
		expect(AUDIO_BASE.endsWith('/az2')).toBe(true);
		expect(AUDIO_CACHE).toBe('audio-az2');
	});
});
