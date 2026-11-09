import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { audioKey } from '#lib/content/import/audio.js';
import { carrierOf } from '#lib/audio-renderer/carriers.js';
import carriers from '#lib/audio-renderer/syllable-carriers.json';
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

	it('has 402 cells with four distinct keys each', () => {
		expect(cells).toHaveLength(402);
		expect(new Set(cells.flatMap((c) => c.clips.map((k) => k.key))).size).toBe(1608);
	});

	it('keys are audioKey of the marked syllable, redpanda', () => {
		const ba = cells.find((c) => c.syllable === 'ba')!;
		expect(ba.clips[2]).toMatchObject({
			label: 'ba3',
			text: 'bǎ',
			key: audioKey('bǎ', 'redpanda')
		});
		expect(cells.find((c) => c.syllable === 'lü')!.clips[0].key).toBe(audioKey('lǖ', 'redpanda'));
	});

	it('drops the non-standard syllables bia, fiao and tei', () => {
		const syllables = cells.map((c) => c.syllable);
		for (const s of ['bia', 'fiao', 'tei']) expect(syllables).not.toContain(s);
	});

	it('disables exactly the cells no hanzi or word carries', () => {
		const off = cells
			.flatMap((c) => c.clips)
			.filter((c) => c.disabled)
			.map((c) => c.label);
		expect(off).toHaveLength(1608 - Object.keys(carriers.cells).length);
		for (const s of ['ei', 'zhei']) for (const t of [1, 2, 3, 4]) expect(off).toContain(s + t);
		expect(off).not.toContain('ba3');
		expect(off).not.toContain('lü3');
	});

	it('gives every chip an Azure carrier', () => {
		for (const chip of chips) expect(carrierOf(chip.text), chip.text).toBeDefined();
	});

	it('lists multi-syllable chips with manifest keys', () => {
		expect(chips.length).toBeGreaterThanOrEqual(20);
		expect(chips.find((c) => c.text === 'nǐ hǎo')?.key).toBe(audioKey('nǐ hǎo', 'redpanda'));
		expect(chips.find((c) => c.text === 'duì bu qǐ')).toBeTruthy();
	});
});
