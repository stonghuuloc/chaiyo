import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { describe, expect, it, vi } from 'vitest';
import { createPlayer } from '#lib/audio/player.js';
import { SYLLABLE_BASE } from '#lib/audio/base.js';
import { NO_CLIP } from '#lib/audio-renderer/recorded.js';
import { addTone, audioKey } from '#lib/content/import/audio.js';
import chart from './chart.json';
import { load } from './+page';
import {
	backTarget,
	cellAt,
	findCell,
	FINALS,
	INITIALS,
	playTone,
	type ChartCell,
	type Tone
} from './chart';

const cells = chart as ChartCell[];

describe('chart.json', () => {
	it('Given_ChartJson_Then_KeysMatchAudioKey', () => {
		// Arrange
		const rows = parse(readFileSync('content/syllables.yaml', 'utf8')) as { syllable: string }[];
		const expected = rows.map((r) => r.syllable).filter((s) => !NO_CLIP[s]);
		// Act
		const got = cells.map((c) => c.syllable);
		// Assert
		expect(cells).toHaveLength(402);
		expect(got).toEqual(expected);
		for (const c of cells)
			c.tones.forEach((t, i) => {
				const text = addTone(c.syllable, i + 1);
				expect(t.text).toBe(text);
				expect(t.key).toBe(audioKey(text, 'redpanda'));
			});
	});

	it('Given_ChartJson_Then_1248Hanzi_And_ba_Is_八拔把爸', () => {
		// Arrange
		// Act
		const hanzi = cells.flatMap((c) => c.tones).filter((t) => t.hanzi);
		// Assert
		expect(hanzi).toHaveLength(1248);
		expect(findCell(cells, 'ba')?.tones.map((t) => t.hanzi)).toEqual(['八', '拔', '把', '爸']);
	});
});

describe('grid lookup', () => {
	it('Given_Grid_Then_22x36_With402Cells', () => {
		// Arrange
		// Act
		const filled = INITIALS.flatMap((i) => FINALS.map((f) => cellAt(cells, i, f))).filter(Boolean);
		// Assert
		expect(INITIALS).toHaveLength(22);
		expect(FINALS).toHaveLength(36);
		expect(INITIALS[0]).toBe('');
		expect(filled).toHaveLength(402);
		expect(cellAt(cells, '', 'i')?.syllable).toBe('yi');
		expect(cellAt(cells, 'l', 'ü')?.syllable).toBe('lü');
		expect(cellAt(cells, 'b', 'ia')).toBeNull();
	});
});

describe('findCell', () => {
	it('Given_Open_When_FindCell_Then_ExactMatchOnly', () => {
		// Arrange
		// Act
		// Assert
		expect(findCell(cells, 'ba')?.syllable).toBe('ba');
		for (const open of ['xyz', 'bia', 'BA', '', null]) expect(findCell(cells, open)).toBeNull();
	});
});

describe('backTarget', () => {
	it('Given_HasPrevious_When_BackTarget_Then_BackElseH000', () => {
		// Arrange
		// Act
		// Assert
		expect(backTarget(true)).toBe('back');
		expect(backTarget(false)).toBe('h0-00');
	});
});

describe('playTone', () => {
	const setup = () => {
		const el = { src: '', playbackRate: 1, play: vi.fn(() => Promise.resolve()) };
		const { play } = createPlayer({ base: 'https://clips.test', createAudio: () => el as never });
		return { el, play };
	};

	it('Given_StubPlayer_When_PlayToneTwice_Then_SrcUnderSyllableBase_Rate1Then05', async () => {
		// Arrange
		const { el, play } = setup();
		const tone = findCell(cells, 'ba')!.tones[1];
		const spy = vi.fn(play);
		// Act
		await playTone(tone, spy);
		const first = el.playbackRate;
		await playTone(tone, spy);
		// Assert
		expect(spy).toHaveBeenCalledWith(tone.key, { base: SYLLABLE_BASE });
		expect(el.src).toBe(`${SYLLABLE_BASE}/${tone.key}.mp3`);
		expect([first, el.playbackRate]).toEqual([1, 0.5]);
	});

	it('Given_KeyNull_When_PlayTone_Then_PlayerNotCalled', async () => {
		// Arrange
		const player = vi.fn(() => Promise.resolve(true));
		const tone: Tone = { text: 'bǎ', key: null, hanzi: null };
		// Act
		const played = await playTone(tone, player);
		// Assert
		expect(played).toBe(false);
		expect(player).not.toHaveBeenCalled();
	});
});

describe('load', () => {
	it('Given_Url_open_ba_When_Load_Then_open_ba_And_PushedRoadmap', () => {
		// Arrange
		const url = new URL('http://x/pinyin?open=ba');
		// Act
		const data = load({ url });
		// Assert
		expect(data.open).toBe('ba');
		expect(data.shell).toEqual({ template: 'pushed', section: 'roadmap' });
		expect(load({ url: new URL('http://x/pinyin') }).open).toBeNull();
	});
});
