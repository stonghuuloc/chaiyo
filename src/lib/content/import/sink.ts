import type { ThinEntry } from '../derive';
import type { AudioEntry } from './audio';
import type {
	Char,
	GrammarPoint,
	Lesson,
	Primer,
	Question,
	Sentence,
	Syllables,
	Word
} from '../schemas';

export type ImportedLesson = (Lesson | Primer) & {
	gateCoverage: Record<string, string[]>;
	thin: ThinEntry[];
};

export type ImportedWord = Word & { taughtIn?: string; listedIn: string[]; audio?: string };

export type ImportedSentence = Sentence & { lessonId?: string; seg: string[]; audio?: string };

export type ImportedQuestion = {
	id: string;
	lessonId: string;
	role: 'drill' | 'dialogue' | 'listen' | 'gate';
	body: Question;
};

export type ImportedContent = {
	sha: string;
	lessons: ImportedLesson[];
	words: ImportedWord[];
	sentences: ImportedSentence[];
	chars: Char[];
	grammar: GrammarPoint[];
	questions: ImportedQuestion[];
	syllables: Syllables;
	audio: AudioEntry[];
};

export type Sink = {
	has(sha: string): Promise<boolean>;
	write(content: ImportedContent): Promise<void>;
};

export type MemorySink = Sink & {
	readonly versions: { sha: string; createdAt: Date }[];
	readonly content: ImportedContent | undefined;
};

export function createMemorySink(): MemorySink {
	let content: ImportedContent | undefined;
	let versions: { sha: string; createdAt: Date }[] = [];
	return {
		get versions() {
			return versions;
		},
		get content() {
			return content;
		},
		has: async (sha) => content?.sha === sha,
		write: async (next) => {
			const cloned = structuredClone(next);
			const row = { sha: cloned.sha, createdAt: new Date() };
			versions = [...versions.filter((v) => v.sha !== cloned.sha), row];
			content = cloned;
		}
	};
}
