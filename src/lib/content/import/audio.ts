import { createHash } from 'node:crypto';
import type { Question } from '../schemas';
import type { ImportedContent } from './sink';

export type AudioEntry = {
	key: string;
	kind: 'sentence' | 'word' | 'syllable';
	ref: string;
	voice: string;
	hanzi: string;
	style?: string;
	reading?: string;
	split?: true;
};

export const audioKey = (text: string, voice: string, style?: string): string =>
	createHash('sha256')
		.update(text + '|' + voice + (style ? '/' + style : ''))
		.digest('hex');

export const WORD_STYLE = 'poetry-reading';
export const CHIP_STYLE = 'poetry-reading';
export const READING_STYLE = 'newscast';
export const DIALOGUE_STYLE: Record<string, string> = { redpanda: 'chat-casual', takin: 'default' };

export const sentenceVoice = (s: { speaker?: string; style?: string }) =>
	s.speaker === undefined
		? { voice: 'redpanda', style: READING_STYLE }
		: { voice: s.speaker, style: s.style ?? DIALOGUE_STYLE[s.speaker] ?? 'default' };

const MARKS: Record<string, string> = {
	a: 'āáǎà',
	e: 'ēéěè',
	i: 'īíǐì',
	o: 'ōóǒò',
	u: 'ūúǔù',
	ü: 'ǖǘǚǜ'
};

export function addTone(syllable: string, tone: number): string {
	const at =
		['a', 'e'].map((v) => syllable.indexOf(v)).find((i) => i >= 0) ??
		(syllable.includes('ou')
			? syllable.indexOf('o')
			: /iu|ui/.test(syllable)
				? syllable.search(/iu|ui/) + 1
				: Math.max(...[...'iouü'].map((v) => syllable.lastIndexOf(v))));
	if (at < 0) return syllable;
	return syllable.slice(0, at) + MARKS[syllable[at]][tone - 1] + syllable.slice(at + 1);
}

const chipText = (c: string | { say: string }) => (typeof c === 'string' ? c : c.say);

const promptTexts = (q: Question): string[] =>
	'prompt' in q && q.prompt.kind === 'syllable' ? [q.prompt.spoken ?? q.prompt.text] : [];

export function audioManifest(content: Omit<ImportedContent, 'sha' | 'audio'>): AudioEntry[] {
	const entries: AudioEntry[] = [];
	for (const s of content.sentences) {
		const { voice, style } = sentenceVoice(s);
		entries.push({
			key: audioKey(s.hanzi, voice, style),
			kind: 'sentence',
			ref: s.id,
			voice,
			style,
			hanzi: s.hanzi
		});
	}
	for (const w of content.words) {
		const split = w.id !== w.hanzi;
		const entry: AudioEntry = {
			key: audioKey(split ? w.id : w.hanzi, 'redpanda', WORD_STYLE),
			kind: 'word',
			ref: w.id,
			voice: 'redpanda',
			style: WORD_STYLE,
			hanzi: w.hanzi
		};
		if (split) Object.assign(entry, { reading: w.spoken, split: true });
		entries.push(entry);
	}
	const syllables = new Set<string>();
	for (const row of content.syllables)
		for (const tone of [1, 2, 3, 4]) syllables.add(addTone(row.syllable, tone));
	for (const lesson of content.lessons) {
		if (!('kind' in lesson && lesson.kind === 'primer')) continue;
		for (const section of Object.values(lesson.sections))
			for (const card of section.cards) {
				for (const c of card.syllables) syllables.add(chipText(c));
				for (const pair of card.pairs ?? []) for (const c of pair) syllables.add(chipText(c));
			}
	}
	for (const q of content.questions) for (const t of promptTexts(q.body)) syllables.add(t);
	for (const text of syllables) {
		const style = /\s/.test(text) ? CHIP_STYLE : undefined;
		entries.push({
			key: audioKey(text, 'redpanda', style),
			kind: 'syllable',
			ref: text,
			voice: 'redpanda',
			...(style && { style }),
			hanzi: text
		});
	}

	const kept = new Map<string, AudioEntry>();
	for (const e of entries) {
		const cur = kept.get(e.key);
		if (!cur || e.kind < cur.kind || (e.kind === cur.kind && e.ref < cur.ref)) kept.set(e.key, e);
	}
	return [...kept.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}
