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
	arrivedInApp,
	backTarget,
	cellAt,
	findCell,
	FINALS,
	INITIALS,
	playTone,
	type ChartCell,
	type Tone
} from './chart';

const cells: ChartCell[] = chart;
const cellOf = (syllable: string): ChartCell => {
	const cell = findCell(cells, syllable);
	if (!cell) throw new Error(`no chart cell ${syllable}`);
	return cell;
};
const syllablesOf = (rows: unknown): string[] => {
	if (!Array.isArray(rows)) throw new Error('syllables.yaml is not a list');
	return rows.map((r: unknown) => {
		const s = typeof r === 'object' && r !== null && 'syllable' in r ? r.syllable : undefined;
		if (typeof s !== 'string') throw new Error('syllables.yaml row without a syllable');
		return s;
	});
};

describe('chart.json', () => {
	it('Given_ChartJson_Then_KeysMatchAudioKey', () => {
		// Arrange
		const rows = syllablesOf(parse(readFileSync('content/syllables.yaml', 'utf8')));
		const expected = rows.filter((s) => !NO_CLIP[s]);
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

describe('arrivedInApp', () => {
	it.each([
		['link', {}, 'link', true],
		['goto', {}, 'goto', true],
		['popstate', {}, 'popstate', false],
		['first load', null, 'enter', false]
	])('Given_%s_When_ArrivedInApp_Then_Matches', (_name, from, type, expected) => {
		// Arrange
		// Act
		const got = arrivedInApp(from, type);
		// Assert
		expect(got).toBe(expected);
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
		const tone = cellOf('ba').tones[1];
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

describe('history snapshot', () => {
	it('Given_PageSource_Then_ExportsSnapshotOfHasPrevious_SoBackIntoPinyinKeepsTheFlag', () => {
		// Arrange
		const src = readFileSync('src/routes/(app)/pinyin/+page.svelte', 'utf8');
		// Act
		// Assert
		expect(src).toContain('snapshot({');
		expect(src).toContain('capture: () => hasPrevious');
		expect(src).toContain('hasPrevious = value');
	});
});

describe('page sources', () => {
	it('Given_RouteSources_Then_NoLedgerOrStudyImport', () => {
		// Arrange
		const files = ['+page.svelte', '+page.ts', 'PinyinChart.svelte', 'chart.ts'];
		// Act
		const hits = files.filter((f) =>
			/#lib\/(ledger|study)/.test(readFileSync(`src/routes/(app)/pinyin/${f}`, 'utf8'))
		);
		// Assert
		expect(hits).toEqual([]);
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
