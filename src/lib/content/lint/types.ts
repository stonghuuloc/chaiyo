import type { Char, GrammarPoint, Lesson, Primer, Sentence, Syllables, Word } from '../schemas';

export type LintCheck = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type LintError = {
	file: string;
	path: string;
	check: LintCheck;
	name: string;
	message: string;
	line?: number;
	col?: number;
};

export type ContentSet = {
	lessons: { file: string; value: Lesson | Primer }[];
	words: { file: string; value: Word }[];
	chars: { file: string; value: Char }[];
	grammar: { file: string; value: GrammarPoint }[];
	sentences: { file: string; value: Sentence[] }[];
	syllables: Syllables;
};

export type Mnemonic = Omit<NonNullable<Char['mnemonic']>, 'kind'>;

export type LintRefs = {
	polyphones: Map<string, string[]>;
	syllabus: Map<number, number>;
	mnemonics?: Map<string, Mnemonic>;
};

export const CHECK_NAMES = [
	'schema',
	'Hán Việt',
	'Polyphones',
	'Tone marks',
	'Sandhi',
	'80% known chars',
	'Real glyphs',
	'Mnemonic reuse',
	'References',
	'Audio',
	'Derive'
] as const;

export const CAST = ['panda', 'redpanda', 'fawn', 'takin'];

export const SPEAKERS = ['redpanda', 'takin'];
