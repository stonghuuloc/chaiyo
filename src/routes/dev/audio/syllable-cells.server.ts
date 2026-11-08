import { readFileSync, readdirSync } from 'node:fs';
import { parse } from 'yaml';
import { audioKey, addTone } from '#lib/content/import/audio.js';
import { noClipReason } from '#lib/audio-renderer/recorded.js';

export type Clip = { label: string; text: string; key: string; disabled?: string };
export type SyllableCell = { syllable: string; initial: string; clips: Clip[] };
export type ChipClip = { text: string; key: string };

const chipTexts = (node: unknown, out: Set<string>) => {
	if (!node || typeof node !== 'object') return;
	const { syllables, pairs } = node as { syllables?: unknown; pairs?: unknown };
	const add = (c: unknown) => {
		const say = typeof c === 'string' ? c : (c as { say?: unknown } | null)?.say;
		if (typeof say === 'string') out.add(say);
	};
	for (const c of Array.isArray(syllables) ? syllables : []) add(c);
	for (const pair of Array.isArray(pairs) ? pairs : []) if (Array.isArray(pair)) pair.forEach(add);
	for (const v of Object.values(node)) chipTexts(v, out);
};

export function loadSyllableClips(root = 'content') {
	const rows = parse(readFileSync(`${root}/syllables.yaml`, 'utf8')) as {
		syllable: string;
		initial: string;
	}[];
	const cells: SyllableCell[] = rows.map(({ syllable, initial }) => ({
		syllable,
		initial,
		clips: [1, 2, 3, 4].map((tone) => {
			const text = addTone(syllable, tone);
			const label = `${syllable}${tone}`;
			return { label, text, key: audioKey(text, 'narrator'), disabled: noClipReason(label) };
		})
	}));

	const texts = new Set<string>();
	for (const dir of readdirSync(`${root}/lessons`))
		for (const file of readdirSync(`${root}/lessons/${dir}`)) {
			const lesson = parse(readFileSync(`${root}/lessons/${dir}/${file}`, 'utf8'));
			if (lesson?.kind === 'primer') chipTexts(lesson.sections, texts);
		}
	const chips: ChipClip[] = [...texts]
		.filter((t) => t.includes(' '))
		.map((text) => ({ text, key: audioKey(text, 'narrator') }));
	return { cells, chips };
}
