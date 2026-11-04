import type { Char, GrammarPoint, Lesson, Question, Word } from '../schemas';
import type { ThinEntry } from './dictionary';
import { deriveHanViet } from './hanviet';
import { segment } from './seg';

const CJK = /[\u3400-\u9fff]/u;

const questionHanzi = (question: Question): string[] => {
	if (question.type === 'choice') return question.optionKind === 'hanzi' ? question.options : [];
	if (question.type === 'order') return question.tiles;
	if (question.type === 'fill') return question.options;
	return [];
};

export function bundleHanzi(
	lesson: Lesson,
	grammar: GrammarPoint[],
	sentences: { seg: string[] }[]
): string[] {
	const { sections, gate } = lesson;
	const questions = [
		...sections.grammar.drills,
		...sections.dialogue.questions,
		...sections.listenSpeak.items,
		...gate.pool
	];
	return [
		...sentences.flatMap((s) => s.seg),
		...questions.flatMap(questionHanzi),
		...grammar.flatMap((g) => [
			g.title,
			g.pattern,
			g.explain,
			...(g.pitfalls ?? []).flatMap((p) => [p.wrong, p.right])
		]),
		lesson.titleHanzi
	];
}

export function thinEntries(
	texts: string[],
	ctx: { lessonEntries: ReadonlyMap<string, ThinEntry>; dict: ReadonlyMap<string, ThinEntry> }
): ThinEntry[] {
	const { lessonEntries, dict } = ctx;
	const lessonWords = new Set(lessonEntries.keys());
	const found = new Map<string, ThinEntry>();
	const add = (hanzi: string) => {
		const hit = lessonEntries.get(hanzi) ?? dict.get(hanzi);
		if (hit) found.set(hanzi, hit);
	};
	for (const text of texts) {
		for (const token of segment(text, lessonWords, dict)) {
			if (!CJK.test(token)) continue;
			add(token);
			for (const char of token) add(char);
		}
	}
	return [...found.values()].sort((a, b) => (a.hanzi < b.hanzi ? -1 : a.hanzi > b.hanzi ? 1 : 0));
}

export function lessonWordEntries(
	lesson: Lesson,
	words: ReadonlyMap<string, Word>,
	chars: Record<string, Char>
): Map<string, ThinEntry> {
	const out = new Map<string, ThinEntry>();
	for (const id of lesson.sections.words.ids) {
		const word = words.get(id);
		if (!word || out.has(word.hanzi)) continue;
		const derived = deriveHanViet(word, chars);
		out.set(word.hanzi, {
			hanzi: word.hanzi,
			pinyin: word.pinyin,
			hanviet: 'hanviet' in derived ? derived.hanviet : '',
			meaning: word.senses[0]?.vi ?? ''
		});
	}
	return out;
}
