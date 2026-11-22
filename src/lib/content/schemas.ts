import { z } from 'zod';

const Level = z.literal([1, 2, 3, 4, 5]);
const Id = z.string();
const Pos = z.enum([
	'n',
	'v',
	'adj',
	'adv',
	'pron',
	'num',
	'mw',
	'prep',
	'conj',
	'part',
	'interj',
	'phrase',
	'comp'
]);
const Gloss = z.strictObject({ hanzi: z.string(), pinyin: z.string(), vi: z.string() });
const Scene = z.strictObject({ file: z.string(), cast: z.array(z.string()), prompt: z.string() });

export const Char = z.strictObject({
	hanzi: z.string(),
	readings: z.array(
		z.strictObject({ pinyin: z.string(), hanviet: z.string(), rare: z.boolean().optional() })
	),
	radical: z.string(),
	ids: z.string(),
	strokes: z.number(),
	mnemonic: z
		.strictObject({
			hinh: z.string(),
			am: z.string(),
			doiThat: z.string(),
			tuongPhan: z.string(),
			kind: z.enum(['etymology', 'invented'])
		})
		.optional(),
	traditional: z.string().optional()
});

export const Word = z.strictObject({
	id: Id,
	hanzi: z.string(),
	pinyin: z.string(),
	spoken: z.string().optional(),
	hanviet: z.string().optional(),
	level: Level,
	pos: z.array(Pos),
	senses: z.array(
		z.strictObject({
			vi: z.string(),
			note: z.string().optional(),
			pos: Pos.optional(),
			rare: z.literal(true).optional(),
			example: Id.optional()
		})
	),
	collocations: z.array(Gloss).optional(),
	examples: z.array(Id),
	image: z
		.strictObject({
			file: z.string(),
			cast: z.array(z.string()).optional(),
			prompt: z.string().optional()
		})
		.optional(),
	parts: z
		.array(
			z.strictObject({ hanzi: z.string(), pinyin: z.string(), hanviet: z.string(), vi: z.string() })
		)
		.optional(),
	components: z
		.array(z.strictObject({ hanzi: z.string(), name: z.string(), vi: z.string() }))
		.optional()
});

export const Sentence = z.strictObject({
	id: Id,
	hanzi: z.string(),
	pinyin: z.string(),
	spoken: z.string().optional(),
	vi: z.string(),
	speaker: z.string().optional(),
	style: z.string().optional(),
	seg: z.array(z.string()).optional(),
	source: z.union([z.literal('ai'), z.string().regex(/^tatoeba:\d+$/)]).optional(),
	unknown: z.array(Gloss).optional()
});

export const GrammarPoint = z.strictObject({
	id: Id,
	level: Level,
	std: z.array(z.number()),
	title: z.string(),
	pattern: z.string(),
	labels: z.array(z.string()).optional(),
	explain: z.string(),
	examples: z.array(Id),
	pitfalls: z
		.array(z.strictObject({ wrong: z.string(), right: z.string(), why: z.string().optional() }))
		.optional()
});

const Prompt = z.discriminatedUnion('kind', [
	z.strictObject({ kind: z.literal('hanzi'), ref: z.string() }),
	z.strictObject({ kind: z.literal('audio'), ref: z.string() }),
	z.strictObject({ kind: z.literal('image'), ref: z.string() }),
	z.strictObject({ kind: z.literal('vi'), text: z.string() }),
	z.strictObject({ kind: z.literal('syllable'), text: z.string(), spoken: z.string().optional() })
]);

const QuestionBase = {
	id: Id,
	why: z.string().optional(),
	ask: z.string().optional(),
	section: z.enum(['tones', 'finals', 'initials', 'spelling', 'sandhi']).optional(),
	tests: z.strictObject({
		words: z.array(z.string()).optional(),
		grammar: z.array(z.string()).optional(),
		tone: z.boolean().optional()
	})
};

const answerIndex = { error: 'answer must be an index into options' };
const answerInOptions = ({ answer, options }: { answer: number; options: string[] }) =>
	answer < options.length;

export const Question = z.discriminatedUnion('type', [
	z
		.strictObject({
			...QuestionBase,
			type: z.literal('choice'),
			prompt: Prompt,
			options: z.array(z.string()),
			answer: z.number().int().min(0),
			optionKind: z.enum(['hanzi', 'pinyin', 'vi', 'hanviet', 'image'])
		})
		.refine(answerInOptions, { ...answerIndex, path: ['answer'] }),
	z.strictObject({
		...QuestionBase,
		type: z.literal('tone'),
		prompt: Prompt,
		syllable: z.number(),
		answer: z.literal([1, 2, 3, 4, 5])
	}),
	z.strictObject({
		...QuestionBase,
		type: z.literal('typePinyin'),
		prompt: Prompt,
		answer: z.string()
	}),
	z.strictObject({
		...QuestionBase,
		type: z.literal('order'),
		tiles: z.array(z.string()),
		answer: Id
	}),
	z
		.strictObject({
			...QuestionBase,
			type: z.literal('fill'),
			sentence: Id,
			blank: z.number(),
			options: z.array(z.string()),
			answer: z.number().int().min(0)
		})
		.refine(answerInOptions, { ...answerIndex, path: ['answer'] }),
	z.strictObject({
		...QuestionBase,
		type: z.literal('trueFalse'),
		prompt: Prompt,
		statement: z.string(),
		answer: z.boolean()
	}),
	z.strictObject({ ...QuestionBase, type: z.literal('readAloud'), sentence: Id }),
	z.strictObject({
		...QuestionBase,
		type: z.literal('freeAnswer'),
		prompt: Prompt,
		rubric: z.array(z.string()),
		minChars: z.number().optional(),
		answer: Id.optional()
	})
]);

export const Lesson = z.strictObject({
	id: Id,
	level: Level,
	topic: z.string(),
	order: z.number(),
	title: z.string(),
	titleHanzi: z.string(),
	goal: z.string(),
	scene: Scene,
	sentences: z.array(Sentence),
	sections: z.strictObject({
		warmup: z.strictObject({ extra: z.array(Id).optional() }),
		words: z.strictObject({ ids: z.array(z.string()) }),
		grammar: z.strictObject({
			ids: z.array(z.string()),
			drills: z.array(Question),
			done: z.string().optional()
		}),
		dialogue: z.strictObject({
			parts: z.array(z.strictObject({ title: z.string().optional(), lines: z.array(Id) })),
			questions: z.array(Question)
		}),
		listenSpeak: z.strictObject({ items: z.array(Question) }),
		writing: z.strictObject({ chars: z.array(z.string()) }),
		reading: z.strictObject({ title: z.string(), lines: z.array(Id) }).optional()
	}),
	gate: z.strictObject({ pool: z.array(Question), draw: z.number() })
});

const Chip = z.union([
	z.string(),
	z.strictObject({ say: z.string(), label: z.string().optional(), hanzi: z.string().optional() })
]);

const PrimerSection = z.strictObject({
	cards: z.array(
		z.strictObject({
			title: z.string(),
			explain: z.string(),
			syllables: z.array(Chip),
			pairs: z.array(z.tuple([Chip, Chip])).optional()
		})
	),
	drills: z.array(Question)
});

export const Primer = z.strictObject({
	kind: z.literal('primer'),
	id: Id,
	level: z.literal(1),
	order: z.literal(0),
	title: z.string(),
	titleHanzi: z.string(),
	scene: Scene,
	sections: z.strictObject({
		tones: PrimerSection,
		finals: PrimerSection,
		initials: PrimerSection,
		spelling: PrimerSection,
		sandhi: PrimerSection
	}),
	gate: z.strictObject({ pool: z.array(Question), draw: z.number(), testOut: z.literal(true) })
});

export const Syllables = z.array(
	z.strictObject({ syllable: z.string(), initial: z.string(), final: z.string() })
);

export const Sentences = z.array(Sentence);

export const schemas = {
	Lesson,
	Word,
	Char,
	Sentence,
	Sentences,
	GrammarPoint,
	Question,
	Primer,
	Syllables
};

export type ContentType = keyof typeof schemas;
export type Lesson = z.infer<typeof Lesson>;
export type Word = z.infer<typeof Word>;
export type Char = z.infer<typeof Char>;
export type Sentence = z.infer<typeof Sentence>;
export type Sentences = z.infer<typeof Sentences>;
export type GrammarPoint = z.infer<typeof GrammarPoint>;
export type Question = z.infer<typeof Question>;
export type Primer = z.infer<typeof Primer>;
export type Syllables = z.infer<typeof Syllables>;
