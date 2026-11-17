import { readFileSync } from 'node:fs';
import type { CharacterJson } from 'hanzi-writer';
import { describe, expect, it } from 'vitest';
import messages from '../../../messages/vi.json';
import {
	STROKE_COLORS,
	STROKE_DATA,
	isCharacterJson,
	loadStrokes,
	withRadicals,
	writerOptions
} from './hanzi-strokes';

const data = (radStrokes?: number[]): CharacterJson => ({
	strokes: ['M0 0'],
	medians: [[[0, 0]]],
	...(radStrokes && { radStrokes })
});
const ok = (d: CharacterJson) => new Response(JSON.stringify(d));

describe('withRadicals', () => {
	it('Given_Zai_When_WithRadicals_Then_PatchesOneTwo', () => {
		// Arrange
		const d = data();
		// Act
		const out = withRadicals('再', d);
		// Assert
		expect(out.radStrokes).toEqual([1, 2]);
		expect(d.radStrokes).toBeUndefined();
	});

	it.each(['见', '气'])('Given_%s_When_WithRadicals_Then_PatchesAllFour', (c) => {
		// Arrange
		const d = data();
		// Act
		const out = withRadicals(c, d);
		// Assert
		expect(out.radStrokes).toEqual([0, 1, 2, 3]);
	});

	it('Given_NiWithRadStrokes_When_WithRadicals_Then_Unchanged', () => {
		// Arrange
		const d = data([0, 1]);
		// Act
		const out = withRadicals('你', d);
		// Assert
		expect(out).toBe(d);
		expect(out.radStrokes).toEqual([0, 1]);
	});

	it('Given_UnknownCharNoRad_When_WithRadicals_Then_NoRadStrokes', () => {
		// Arrange
		const d = data();
		// Act
		const out = withRadicals('好', d);
		// Assert
		expect(out.radStrokes).toBeUndefined();
	});
});

describe('loadStrokes', () => {
	it('Given_FetchOk_When_LoadStrokes_Then_RequestsCdnUrlAndPatches', async () => {
		// Arrange
		const urls: string[] = [];
		const fakeFetch: typeof fetch = async (url) => {
			urls.push(String(url));
			return ok(data());
		};
		// Act
		const out = await loadStrokes('再', fakeFetch);
		// Assert
		expect(urls).toEqual([`${STROKE_DATA}再.json`]);
		expect(out.radStrokes).toEqual([1, 2]);
	});

	it('Given_FetchRejects_When_LoadStrokes_Then_Rejects', async () => {
		// Arrange
		const fakeFetch: typeof fetch = async () => {
			throw new TypeError('Failed to fetch');
		};
		// Act
		const run = loadStrokes('你', fakeFetch);
		// Assert
		await expect(run).rejects.toThrow('Failed to fetch');
	});

	it('Given_404_When_LoadStrokes_Then_Rejects', async () => {
		// Arrange
		const fakeFetch: typeof fetch = async () => new Response('', { status: 404 });
		// Act
		const run = loadStrokes('你', fakeFetch);
		// Assert
		await expect(run).rejects.toThrow('404');
	});
});

describe('isCharacterJson', () => {
	it.each([
		['missing medians', { strokes: ['M0 0'] }],
		['non-string stroke', { strokes: [1], medians: [] }],
		['non-number median', { strokes: ['M0 0'], medians: [[['x', 1]]] }],
		['bad radStrokes', { strokes: ['M0 0'], medians: [[[1, 2]]], radStrokes: ['0'] }],
		['null', null],
		['empty median', { strokes: ['M0 0'], medians: [[]] }],
		['median point without two numbers', { strokes: ['M0 0'], medians: [[[1]]] }],
		['fewer medians than strokes', { strokes: ['M0 0', 'M1 1'], medians: [[[1, 2]]] }]
	])('Given_%s_When_Checked_Then_Rejected', (_, v) => {
		// Arrange / Act / Assert
		expect(isCharacterJson(v)).toBe(false);
	});

	it('Given_ValidShape_When_Checked_Then_Accepted', () => {
		// Arrange
		const v = { strokes: ['M0 0'], medians: [[[1, 2]]], radStrokes: [0] };

		// Act / Assert
		expect(isCharacterJson(v)).toBe(true);
	});

	it('Given_BadShapeFromCdn_When_LoadStrokes_Then_Rejects', async () => {
		// Arrange
		const fakeFetch: typeof fetch = () =>
			Promise.resolve(new Response(JSON.stringify({ strokes: 'x' })));

		// Act
		const run = loadStrokes('你', fakeFetch);

		// Assert
		await expect(run).rejects.toThrow('stroke data shape');
	});
});

describe('writerOptions', () => {
	const load = async () => data();

	it('Given_QuizOutline_When_WriterOptions_Then_Pen48AndTokenColours', () => {
		// Arrange / Act
		const o = writerOptions(true, 280, load);
		// Assert
		expect(o).toMatchObject({
			drawingWidth: 48,
			radicalColor: '#c6301d',
			strokeColor: '#1d1814',
			drawingColor: '#1d1814',
			outlineColor: '#ddd5c8',
			showOutline: true,
			showCharacter: false,
			width: 280,
			height: 280,
			padding: 22
		});
	});

	it('Given_OutlineFalse_When_WriterOptions_Then_NoOutline', () => {
		// Arrange / Act
		const o = writerOptions(false, 280, load);
		// Assert
		expect(o.showOutline).toBe(false);
	});

	it('Given_WriterOptions_When_CharDataLoader_Then_ReturnsLoadPromise', async () => {
		// Arrange
		const failing = () => Promise.reject(new Error('boom'));
		const o = writerOptions(true, 280, failing);
		// Act
		const loader = o.charDataLoader;
		if (!loader) throw new Error('no charDataLoader');
		const p = loader(
			'再',
			() => {},
			() => {}
		);
		// Assert
		await expect(p).rejects.toThrow('boom');
	});
});

describe('tokens', () => {
	it('Given_TokensCss_When_Compare_Then_StrokeColoursMatch', () => {
		// Arrange
		const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
		const token = (n: string) => new RegExp(`--color-${n}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1];
		// Act / Assert
		expect(STROKE_COLORS).toEqual({
			ink: token('ink'),
			radical: token('lantern-red'),
			outline: token('ruled-line')
		});
	});
});

describe('copy', () => {
	it('Given_ViMessages_When_Read_Then_LoadErrorIsAc6Copy', () => {
		// Arrange / Act / Assert
		expect(messages.strokes_load_error).toBe('Chưa tải được nét chữ. Kiểm tra mạng rồi thử lại.');
	});
});
