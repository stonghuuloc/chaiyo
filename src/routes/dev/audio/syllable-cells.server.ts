import { parse } from 'yaml';
import { audioKey, addTone } from '#lib/content/import/audio.js';
import { noClipReason } from '#lib/audio-renderer/carriers.js';
import { NO_CLIP } from '#lib/audio-renderer/recorded.js';

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

export type ContentSource = { syllables: string; lessons: string[] };

const lessonFiles = import.meta.glob('/content/lessons/**/*.yaml', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

export const bundledSource: ContentSource = {
	syllables: (
		import.meta.glob('/content/syllables.yaml', {
			query: '?raw',
			import: 'default',
			eager: true
		}) as Record<string, string>
	)['/content/syllables.yaml'],
	lessons: Object.values(lessonFiles)
};

export function loadSyllableClips(source: ContentSource = bundledSource) {
	const rows = parse(source.syllables) as {
		syllable: string;
		initial: string;
	}[];
	// bia, fiao and tei are not standard Mandarin syllables, so they get no grid cell.
	const cells: SyllableCell[] = rows
		.filter(({ syllable }) => !NO_CLIP[syllable])
		.map(({ syllable, initial }) => ({
			syllable,
			initial,
			clips: [1, 2, 3, 4].map((tone) => {
				const text = addTone(syllable, tone);
				const label = `${syllable}${tone}`;
				return { label, text, key: audioKey(text, 'redpanda'), disabled: noClipReason(label) };
			})
		}));

	const texts = new Set<string>();
	for (const raw of source.lessons) {
		const lesson = parse(raw);
		if (lesson?.kind === 'primer') chipTexts(lesson.sections, texts);
	}
	const chips: ChipClip[] = [...texts]
		.filter((t) => t.includes(' '))
		.map((text) => ({ text, key: audioKey(text, 'redpanda') }));
	return { cells, chips };
}
