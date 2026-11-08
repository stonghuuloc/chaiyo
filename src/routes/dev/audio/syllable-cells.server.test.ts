import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { audioKey } from '#lib/content/import/audio.js';
import { bundledSource, loadSyllableClips } from './syllable-cells.server';

const { cells, chips } = loadSyllableClips();

const diskSource = {
	syllables: readFileSync('content/syllables.yaml', 'utf8'),
	lessons: readdirSync('content/lessons', { recursive: true })
		.map(String)
		.filter((f) => f.endsWith('.yaml'))
		.map((f) => readFileSync(`content/lessons/${f}`, 'utf8'))
};

describe('loadSyllableClips', () => {
	it('bundled source (import.meta.glob) matches the files on disk', () => {
		expect(bundledSource.lessons.length).toBeGreaterThan(0);
		expect([...bundledSource.lessons].sort()).toEqual([...diskSource.lessons].sort());
		expect(loadSyllableClips(diskSource)).toEqual({ cells, chips });
	});

	it('has 405 cells with four distinct keys each', () => {
		expect(cells).toHaveLength(405);
		expect(new Set(cells.flatMap((c) => c.clips.map((k) => k.key))).size).toBe(1620);
	});

	it('keys are audioKey of the marked syllable, narrator', () => {
		const ba = cells.find((c) => c.syllable === 'ba')!;
		expect(ba.clips[2]).toMatchObject({
			label: 'ba3',
			text: 'bǎ',
			key: audioKey('bǎ', 'narrator')
		});
		expect(cells.find((c) => c.syllable === 'lü')!.clips[0].key).toBe(audioKey('lǖ', 'narrator'));
	});

	it('disables exactly bia, fiao and tei', () => {
		const off = cells.flatMap((c) => c.clips).filter((c) => c.disabled);
		expect(off.map((c) => c.label)).toEqual(
			['bia', 'fiao', 'tei'].flatMap((s) => [1, 2, 3, 4].map((t) => `${s}${t}`))
		);
	});

	it('lists multi-syllable chips with manifest keys', () => {
		expect(chips.length).toBeGreaterThanOrEqual(20);
		expect(chips.find((c) => c.text === 'nǐ hǎo')?.key).toBe(audioKey('nǐ hǎo', 'narrator'));
		expect(chips.find((c) => c.text === 'duì bu qǐ')).toBeTruthy();
	});
});
