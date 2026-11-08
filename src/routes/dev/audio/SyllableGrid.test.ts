import { render } from 'svelte/server';
import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '#lib/audio/player.js';
import SyllableGrid from './SyllableGrid.svelte';
import { loadSyllableClips } from './syllable-cells.server';

const { cells, chips } = loadSyllableClips();
const BASE = 'https://clips.test';

const setup = () => {
	const el = { src: '', play: vi.fn(() => Promise.resolve()) };
	const { play } = createPlayer({ base: BASE, createAudio: () => el as never });
	return { el, play };
};

const sample = cells
	.flatMap((c) => c.clips)
	.filter((c) => !c.disabled)
	.filter((_, i, all) => i % Math.floor(all.length / 20) === 0)
	.slice(0, 20);

describe('tap resolves the clip URL and plays it', () => {
	it('samples 20 cells', () => expect(sample).toHaveLength(20));

	it('20 cells', async () => {
		const { el, play } = setup();
		for (const clip of sample) {
			await play(clip.key);
			expect(el.src).toBe(`${BASE}/${clip.key}.mp3`);
		}
		expect(el.play).toHaveBeenCalledTimes(20);
	});

	it('a second tap replaces the first on the one element', async () => {
		const { el, play } = setup();
		await play(sample[0].key);
		await play(sample[1].key);
		expect(el.src).toBe(`${BASE}/${sample[1].key}.mp3`);
	});
});

describe('SyllableGrid', () => {
	const html = render(SyllableGrid, { props: { cells, chips } }).body;

	it('renders a cell per syllable under initial headings, disables no-clip cells', () => {
		expect(
			html.match(/aria-pressed="false"[^>]*>\s*[a-zü]+\s*<\/button>/g)?.length
		).toBeGreaterThan(300);
		for (const s of ['bia', 'fiao', 'tei'])
			expect(html).toMatch(new RegExp(`<button[^>]*disabled[^>]*>${s}</button>`));
		expect(html).not.toMatch(/<button[^>]*disabled[^>]*>ba</);
	});

	it('shows no speaker toggle and a chip per word', () => {
		expect(html).not.toContain('aria-label="Speaker"');
		expect(html).not.toContain('>MV1<');
		expect(html).toContain('data-clip="nǐ hǎo"');
		expect(html.match(/data-clip="[^"]* [^"]*"/g)).toHaveLength(chips.length);
	});
});
