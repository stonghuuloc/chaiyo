import type { AudioEntry } from '../content/import/audio';

const MARKS: Record<string, [string, number]> = {};
for (const [base, marks] of Object.entries({
	a: 'āáǎà',
	e: 'ēéěè',
	i: 'īíǐì',
	o: 'ōóǒò',
	u: 'ūúǔù',
	v: 'ǖǘǚǜ'
}))
	[...marks].forEach((mark, i) => (MARKS[mark] = [base, i + 1]));

export function toneNumber(text: string): string | undefined {
	if (!/^\p{L}+$/u.test(text.normalize('NFC')) || /[\u4e00-\u9fff]/.test(text)) return undefined;
	let tone = 0;
	const base = [...text.normalize('NFC')]
		.map((c) => {
			const hit = MARKS[c];
			if (!hit) return c === 'ü' ? 'v' : c;
			tone = hit[1];
			return hit[0];
		})
		.join('');
	return tone ? base + tone : undefined;
}

export const NO_CLIP: Record<string, string> = Object.fromEntries(
	['bia', 'fiao', 'tei'].map((s) => [
		s,
		'not a standard Mandarin syllable: Tone Perfect has no recording'
	])
);

export function noClipReason(label: string): string | undefined {
	return NO_CLIP[label.replace(/[1-4]$/, '')];
}

export const recordedOnly = (entries: AudioEntry[], staged?: (key: string) => boolean) =>
	entries.filter((e) => (staged ? staged(e.key) : e.kind !== 'syllable'));
