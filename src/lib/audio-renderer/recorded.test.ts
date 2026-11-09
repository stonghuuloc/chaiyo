import { describe, expect, it } from 'vitest';
import type { AudioEntry } from '../content/import/audio';
import { noClipReason, recordedOnly, toneNumber } from './recorded';

describe('toneNumber', () => {
	it('maps a marked syllable to the Tone Perfect name', () => {
		expect(toneNumber('bǎ')).toBe('ba3');
		expect(toneNumber('lǚ')).toBe('lv3');
		expect(toneNumber('lüè')).toBe('lve4');
		expect(toneNumber('nǚ')).toBe('nv3');
		expect(toneNumber('zhōng')).toBe('zhong1');
		expect(toneNumber('liú')).toBe('liu2');
		expect(toneNumber('ān')).toBe('an1');
	});

	it('returns nothing for a chip, a neutral syllable or non-pinyin', () => {
		expect(toneNumber('nǐ hǎo')).toBeUndefined();
		expect(toneNumber('ba')).toBeUndefined();
		expect(toneNumber('你好')).toBeUndefined();
		expect(toneNumber('')).toBeUndefined();
	});
});

describe('noClipReason', () => {
	it('lists the three non-standard syllables for every tone', () => {
		for (const s of ['bia', 'fiao', 'tei'])
			for (const t of [1, 2, 3, 4]) expect(noClipReason(s + t)).toContain('not a standard');
	});

	it('is silent for a syllable with a recording', () => {
		expect(noClipReason('ba3')).toBeUndefined();
		expect(noClipReason('biao3')).toBeUndefined();
		expect(noClipReason('bi3')).toBeUndefined();
	});
});

describe('recordedOnly', () => {
	const e = (kind: AudioEntry['kind'], key: string): AudioEntry => ({
		key,
		kind,
		ref: key,
		voice: 'redpanda',
		hanzi: key
	});
	const all = [e('sentence', 's'), e('word', 'w'), e('syllable', 'a'), e('syllable', 'b')];

	it('keeps syllable entries away from the engine without a staged directory', () => {
		expect(recordedOnly(all).map((x) => x.key)).toEqual(['s', 'w']);
	});

	it('keeps only entries that have a staged file when a directory is given', () => {
		expect(recordedOnly(all, (key) => key === 'a').map((x) => x.key)).toEqual(['a']);
	});
});
