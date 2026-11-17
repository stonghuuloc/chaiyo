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
	const json: unknown = await res.json();
	if (!isCharacterJson(json)) throw new Error('stroke data shape');
	return withRadicals(char, json);
}

const isNumbers = (v: unknown): v is number[] =>
	Array.isArray(v) && v.every((n) => typeof n === 'number');

const isPoint = (v: unknown): v is [number, number] => isNumbers(v) && v.length === 2;

export const isCharacterJson = (v: unknown): v is CharacterJson => {
	if (typeof v !== 'object' || v === null) return false;
	const { strokes, medians, radStrokes } = v as Record<string, unknown>;
	return (
		Array.isArray(strokes) &&
		strokes.every((s) => typeof s === 'string') &&
		Array.isArray(medians) &&
		medians.length === strokes.length &&
		medians.every((m) => Array.isArray(m) && m.length > 0 && m.every(isPoint)) &&
		(radStrokes === undefined || isNumbers(radStrokes))
	);
};

export const dimensions = (size: number) => ({
	width: size,
	height: size,
	padding: Math.round(size * 0.08)
});

type DocListener = Parameters<typeof document.addEventListener>;

// hanzi-writer adds document mouseup/touchend listeners in its constructor and never removes them
export function withDocumentListeners<T>(create: () => T): { value: T; release: () => void } {
	const added: DocListener[] = [];
	const add = document.addEventListener;
	const own = Object.getOwnPropertyDescriptor(document, 'addEventListener');
	document.addEventListener = function (this: Document, ...args: DocListener) {
		added.push(args);
		add.apply(this, args);
	};
	try {
		const value = create();
		return {
			value,
			release: () =>
				added.forEach(([type, fn, opts]) => document.removeEventListener(type, fn, opts))
		};
	} finally {
		if (own) Object.defineProperty(document, 'addEventListener', own);
		else delete (document as Partial<Document>).addEventListener;
	}
}

export const writerOptions = (
	outline: boolean,
	size: number,
	load: (char: string) => Promise<CharacterJson>
): Partial<HanziWriterOptions> => ({
	...dimensions(size),
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
