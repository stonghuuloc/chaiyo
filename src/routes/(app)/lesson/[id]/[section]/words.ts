import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';

const GROUP = 3;

const shuffle = <T>(items: T[], random: () => number): T[] => {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[out[i], out[j]] = [out[j], out[i]];
	}
	return out;
};

const card = (w: ImportedWord, content: LessonContent): LessonStep => {
	const byId = new Map(content.sentences.map((s) => [s.id, s]));
	return {
		kind: 'word',
		id: w.id,
		hanzi: w.hanzi,
		pinyin: w.pinyin,
		hanviet: w.hanviet,
		meaning: w.senses[0]?.vi ?? '',
		audio: w.audio,
		parts: (w.parts ?? []).map(({ hanzi, pinyin, hanviet }) => ({ hanzi, pinyin, hanviet })),
		components: (w.components ?? []).map((c) => `${c.hanzi} ${c.name} · ${c.vi}`),
		examples: w.examples
			.flatMap((id) => {
				const s = byId.get(id);
				return s ? [{ hanzi: s.hanzi, pinyin: s.pinyin, vi: s.vi }] : [];
			})
			.slice(0, 2)
	};
};

// The tested word is fixed per group so step ids stay stable across reloads (resume).
const check = (group: ImportedWord[], all: ImportedWord[], random: () => number) => {
	const w = group.findLast((x) => x.audio);
	if (!w?.audio) return null;
	const decoys = shuffle(
		[...new Set(all.map((x) => x.hanzi))].filter((h) => h !== w.hanzi),
		random
	).slice(0, 3);
	return {
		kind: 'choice',
		id: `chk-${w.id}`,
		ask: m.listen_word_ask(),
		title: m.words_check(),
		options: shuffle([w.hanzi, ...decoys], random),
		answer: w.hanzi,
		script: 'hanzi',
		audio: w.audio,
		card: { word: w.id, skill: 'nghe' }
	} satisfies LessonStep;
};

export function wordSteps(content: LessonContent, random = Math.random): LessonStep[] {
	const { lesson } = content;
	if ('kind' in lesson) return [];
	const words = lesson.sections.words.ids.flatMap((id) => {
		const w = content.words.find((x) => x.id === id);
		return w ? [w] : [];
	});
	const steps: LessonStep[] = [];
	let group: ImportedWord[] = [];
	words.forEach((w, i) => {
		steps.push(card(w, content));
		group.push(w);
		if (group.length < GROUP && i < words.length - 1) return;
		const c = check(group, words, random);
		if (c) steps.push(c);
		group = [];
	});
	return steps;
}
