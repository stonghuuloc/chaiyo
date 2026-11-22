import type { Char, GrammarPoint, Question } from '../schemas';
import type { ThinEntry } from '../derive';
import { bundleSentences } from './assemble';
import type { ImportedContent, ImportedLesson, ImportedSentence, ImportedWord } from './sink';

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type Bundle = {
	sha: string;
	lesson: DistributiveOmit<ImportedLesson, 'gateCoverage' | 'thin'>;
	sentences: ImportedSentence[];
	questions: Question[];
	grammar: GrammarPoint[];
	words: ImportedWord[];
	chars: Char[];
	gateCoverage: Record<string, string[]>;
	thin: ThinEntry[];
};

export function buildBundle(content: ImportedContent, id: string): Bundle {
	const found = content.lessons.find((l) => l.id === id);
	if (!found) throw new Error(`no lesson ${id}`);
	const { gateCoverage, thin, ...lesson } = found;
	const questions = content.questions.filter((q) => q.lessonId === id).map((q) => q.body);
	if ('kind' in found)
		return {
			sha: content.sha,
			lesson,
			sentences: [],
			questions,
			grammar: [],
			words: [],
			chars: [],
			gateCoverage,
			thin
		};
	const wordIds = new Set(found.sections.words.ids);
	const grammarIds = new Set(found.sections.grammar.ids);
	const words = content.words.filter((w) => wordIds.has(w.id));
	const grammar = content.grammar.filter((g) => grammarIds.has(g.id));
	const picked = new Set(
		bundleSentences(
			words,
			grammar,
			content.sentences.filter((s) => !s.lessonId)
		).map((s) => s.id)
	);
	const hanzi = new Set(words.flatMap((w) => [...w.hanzi]));
	const clip = new Map(
		content.audio.filter((a) => a.kind === 'sentence').map((a) => [a.ref, a.key])
	);
	const wordClip = new Map(
		content.audio.filter((a) => a.kind === 'word').map((a) => [a.ref, a.key])
	);
	return {
		sha: content.sha,
		lesson,
		sentences: content.sentences
			.filter((s) => s.lessonId === id || picked.has(s.id))
			.map((s) => ({ ...s, audio: clip.get(s.id) })),
		questions,
		grammar,
		words: words.map((w) => ({ ...w, audio: wordClip.get(w.id) })),
		chars: content.chars.filter((c) => hanzi.has(c.hanzi)),
		gateCoverage,
		thin
	};
}
