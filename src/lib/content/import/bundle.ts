import { SYLLABLE_VERSION } from '../../audio/version';
import type { Char, GrammarPoint, Question } from '../schemas';
import type { ThinEntry } from '../derive';
import { bundleSentences } from './assemble';
import type { ImportedContent, ImportedLesson, ImportedSentence, ImportedWord } from './sink';

export const BUNDLE_FORMAT = 3;

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
	clips?: Record<string, string>;
};

const chipText = (c: string | { say: string }) => (typeof c === 'string' ? c : c.say);

export function buildBundle(content: ImportedContent, id: string): Bundle {
	const found = content.lessons.find((l) => l.id === id);
	if (!found) throw new Error(`no lesson ${id}`);
	const { gateCoverage, thin, ...lesson } = found;
	const questions = content.questions.filter((q) => q.lessonId === id).map((q) => q.body);
	if ('kind' in found) {
		const sections = Object.values(found.sections);
		const texts = [
			...sections.flatMap((s) =>
				s.cards.flatMap((c) => [...c.syllables, ...(c.pairs ?? []).flat()].map(chipText))
			),
			...sections.flatMap((s) =>
				s.drills.flatMap((d) =>
					'prompt' in d && d.prompt.kind === 'syllable' ? [d.prompt.spoken ?? d.prompt.text] : []
				)
			)
		];
		const keyOf = new Map(
			content.audio.filter((a) => a.kind === 'syllable').map((a) => [a.ref, a.key])
		);
		const clips = Object.fromEntries(
			texts.flatMap((t) => {
				const key = keyOf.get(t);
				return key ? [[t, key.includes('/') ? key : `${SYLLABLE_VERSION}/${key}`]] : [];
			})
		);
		return {
			sha: content.sha,
			lesson,
			sentences: [],
			questions,
			grammar: [],
			words: [],
			chars: [],
			gateCoverage,
			thin,
			clips
		};
	}
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
