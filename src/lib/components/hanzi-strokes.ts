import type { CharacterJson, HanziWriterOptions } from 'hanzi-writer';

export type StrokeMode = 'animate' | 'quiz';
export type StrokeProgress = { done: number; total: number; mistakes: number };

export const STROKE_DATA = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/';
export const PEN_WIDTH = 48;
export const STROKE_COLORS = { ink: '#1d1814', radical: '#c6301d', outline: '#ddd5c8' };
export const RADICALS: Readonly<Record<string, readonly number[]>> = {
	再: [1, 2],
	见: [0, 1, 2, 3],
	气: [0, 1, 2, 3]
};

export const withRadicals = (char: string, data: CharacterJson): CharacterJson =>
	data.radStrokes || !RADICALS[char] ? data : { ...data, radStrokes: [...RADICALS[char]] };

export async function loadStrokes(
	char: string,
	fetchFn: typeof fetch = fetch
): Promise<CharacterJson> {
	const res = await fetchFn(`${STROKE_DATA}${char}.json`);
	if (!res.ok) throw new Error(`stroke data ${res.status}`);
	return withRadicals(char, (await res.json()) as CharacterJson);
}

export const writerOptions = (
	outline: boolean,
	size: number,
	load: (char: string) => Promise<CharacterJson>
): Partial<HanziWriterOptions> => ({
	width: size,
	height: size,
	padding: Math.round(size * 0.08),
	showCharacter: false,
	showOutline: outline,
	strokeColor: STROKE_COLORS.ink,
	radicalColor: STROKE_COLORS.radical,
	highlightColor: STROKE_COLORS.radical,
	outlineColor: STROKE_COLORS.outline,
	drawingColor: STROKE_COLORS.ink,
	drawingWidth: PEN_WIDTH,
	strokeAnimationSpeed: 1.4,
	delayBetweenStrokes: 120,
	leniency: 1.2,
	highlightOnComplete: false,
	charDataLoader: (char) => load(char)
});
