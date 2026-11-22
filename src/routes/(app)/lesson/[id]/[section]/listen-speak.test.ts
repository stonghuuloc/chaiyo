import type { LessonContent } from '#lib/catalog/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { describe, expect, it } from 'vitest';
import { Lesson, Primer, Sentence, Word } from '#lib/content/schemas.js';
import { listenSpeakSteps } from './listen-speak';

const sentence = (id: string, hanzi: string, pinyin: string, vi: string, spoken?: string) => ({
	...Sentence.parse({ id, hanzi, pinyin, spoken, vi }),
	seg: [hanzi]
});

const word = (id: string, pinyin: string, audio: string, spoken?: string) => ({
	...Word.parse({
		id,
		hanzi: id,
		pinyin,
		spoken,
		level: 1,
		pos: ['adj'],
		senses: [{ vi: 'x' }],
		examples: []
	}),
	listedIn: ['h1-01'],
	audio
});

const WORDS = [word('你好', 'nǐ hǎo', 'words/nihao', 'ní hǎo'), word('好', 'hǎo', 'words/hao')];

const bundle = (
	lesson: LessonContent['lesson'],
	sentences: LessonContent['sentences'],
	words: LessonContent['words'] = WORDS
) =>
	({
		contentSha: 'sha',
		lesson,
		words,
		chars: [],
		sentences,
		grammar: [],
		questions: [],
		gateCoverage: {},
		thin: []
	}) satisfies LessonContent;

const content = (
	items: unknown[],
	sentences: LessonContent['sentences'] = [
		{ ...sentence('s1', '不客气。', 'bù kèqi', 'Không có gì.', 'bú kèqi'), audio: 'dialogue/s1' }
	]
) =>
	bundle(
		Lesson.parse({
			id: 'h1-01',
			level: 1,
			topic: 'chao-hoi',
			order: 1,
			title: 'Chào hỏi',
			titleHanzi: '你好',
			goal: 'Chào và cảm ơn',
			scene: { file: 'scene/h1-01.webp', cast: ['takin'], prompt: 'scene' },
			sentences: [],
			sections: {
				warmup: {},
				words: { ids: ['你'] },
				grammar: { ids: [], drills: [] },
				dialogue: { parts: [], questions: [] },
				listenSpeak: { items },
				writing: { chars: [] }
			},
			gate: { pool: [], draw: 0 }
		}),
		sentences
	);

const tone = {
	id: 'q-l01',
	type: 'tone',
	tests: { words: ['好'], tone: true },
	prompt: { kind: 'audio', ref: '好' },
	syllable: 0,
	answer: 3
};
const wordChoice = {
	id: 'q-l02',
	type: 'choice',
	tests: { words: ['你好'] },
	prompt: { kind: 'audio', ref: '你好' },
	optionKind: 'hanzi',
	options: ['你好', '你们', '您', '再见'],
	answer: 0
};
const meaningChoice = {
	id: 'q-l03',
	type: 'choice',
	tests: { words: ['不客气'] },
	prompt: { kind: 'audio', ref: 's1' },
	optionKind: 'vi',
	options: ['Không có gì.', 'Xin lỗi!', 'Cảm ơn!', 'Tạm biệt!'],
	answer: 0
};

const readAloud = { id: 'q-s01', type: 'readAloud', tests: { words: ['不客气'] }, sentence: 's1' };
const freeAnswer = {
	id: 'q-f01',
	type: 'freeAnswer',
	tests: { words: ['对不起'] },
	prompt: { kind: 'vi', text: 'Bạn làm đổ trà của bạn mình. Nói gì?' },
	rubric: ['Nói 对不起']
};

describe('listenSpeakSteps', () => {
	it('Given_H1_01_When_ListenSpeakSteps_Then_SixStepsInYamlOrder', () => {
		// Arrange
		const c = content([
			tone,
			wordChoice,
			meaningChoice,
			readAloud,
			freeAnswer,
			{
				...freeAnswer,
				id: 'q-f02',
				prompt: { kind: 'vi', text: 'Bạn gặp cô giáo ở cổng trường. Chào cô.' }
			}
		]);

		// Act
		const steps = listenSpeakSteps(c);

		// Assert
		expect(steps.map((s) => [s.id, s.kind])).toEqual([
			['q-l01', 'tone'],
			['q-l02', 'choice'],
			['q-l03', 'choice'],
			['q-s01', 'speak'],
			['q-f01', 'speak'],
			['q-f02', 'speak']
		]);
	});

	it('Given_ToneItem_When_ListenSpeakSteps_Then_WordClipAnswerAndSyllablePinyin', () => {
		// Act
		const [step] = listenSpeakSteps(content([tone]));

		// Assert
		expect(step).toEqual({
			kind: 'tone',
			id: 'q-l01',
			ask: m.listen_tone_ask(),
			audio: 'words/hao',
			answer: 3,
			syllable: 'hǎo',
			hanzi: '好',
			target: 0
		});
	});

	it('Given_ToneOnTwoSyllableWord_When_ListenSpeakSteps_Then_SpokenSyllableAtIndex', () => {
		// Act
		const [step] = listenSpeakSteps(
			content([{ ...tone, prompt: { kind: 'audio', ref: '你好' }, syllable: 0, answer: 2 }])
		);

		// Assert
		expect(step).toMatchObject({ audio: 'words/nihao', syllable: 'ní' });
	});

	it('Given_WordChoice_When_ListenSpeakSteps_Then_HanziOptionsWithWordClip', () => {
		// Act
		const [step] = listenSpeakSteps(content([wordChoice]));

		// Assert
		expect(step).toEqual({
			kind: 'choice',
			id: 'q-l02',
			ask: m.listen_word_ask(),
			title: '',
			options: ['你好', '你们', '您', '再见'],
			answer: '你好',
			script: 'hanzi',
			audio: 'words/nihao'
		});
	});

	it('Given_MeaningChoice_When_ListenSpeakSteps_Then_TextOptionsWithSentenceClip', () => {
		// Arrange
		const s1 = { ...sentence('s1', '不客气。', 'bù kèqi', 'Không có gì.'), audio: 'dialogue/s1' };

		// Act
		const [step] = listenSpeakSteps(content([meaningChoice], [s1]));

		// Assert
		expect(step).toMatchObject({
			kind: 'choice',
			ask: m.listen_meaning_ask(),
			answer: 'Không có gì.',
			script: 'text',
			audio: 'dialogue/s1'
		});
	});

	it('Given_ChoiceWithTextPrompt_When_ListenSpeakSteps_Then_TitleIsPromptText', () => {
		// Act
		const [step] = listenSpeakSteps(
			content([{ ...meaningChoice, prompt: { kind: 'vi', text: 'Không có gì.' } }])
		);

		// Assert
		expect(step).toMatchObject({ kind: 'choice', title: 'Không có gì.', audio: undefined });
	});

	it('Given_AudioPromptsWithNoClip_When_ListenSpeakSteps_Then_ItemsSkipped', () => {
		// Arrange
		const items = [
			{ ...tone, prompt: { kind: 'audio', ref: '再见' } },
			{ ...wordChoice, prompt: { kind: 'audio', ref: '再见' } },
			readAloud
		];

		// Act
		const ids = listenSpeakSteps(content(items)).map((s) => s.id);

		// Assert
		expect(ids).toEqual(['q-s01']);
	});

	it('Given_ReadAloud_When_SpeakSteps_Then_SentenceHanziSpokenPinyinMeaning', () => {
		// Act
		const [step] = listenSpeakSteps(content([readAloud])) as Extract<
			LessonStep,
			{ kind: 'speak' }
		>[];

		// Assert
		expect(step).toMatchObject({
			kind: 'speak',
			id: 'q-s01',
			ask: m.lesson_speak_read_ask(),
			title: m.lesson_speak_read_title(),
			hanzi: '不客气。',
			pinyin: 'bú kèqi',
			meaning: 'Không có gì.'
		});
	});

	it('Given_FreeAnswer_When_SpeakSteps_Then_TitleIsPromptText', () => {
		// Act
		const [step] = listenSpeakSteps(content([freeAnswer]));

		// Assert
		expect(step).toMatchObject({
			kind: 'speak',
			ask: m.lesson_speak_answer_ask(),
			title: 'Bạn làm đổ trà của bạn mình. Nói gì?',
			rubric: ['Nói 对不起'],
			answer: undefined
		});
	});

	it('Given_FreeAnswerWithAnswer_When_SpeakSteps_Then_AnswerHanziPinyinMeaning', () => {
		// Arrange
		const c = content(
			[{ ...freeAnswer, answer: 'sf' }],
			[sentence('sf', '对不起！', 'duìbuqǐ', 'Xin lỗi!')]
		);

		// Act
		const [step] = listenSpeakSteps(c);

		// Assert
		expect(step).toMatchObject({
			answer: { hanzi: '对不起！', pinyin: 'duìbuqǐ', meaning: 'Xin lỗi!' },
			rubric: ['Nói 对不起']
		});
	});

	it('Given_FreeAnswerAnswerSpoken_When_SpeakSteps_Then_AnswerPinyinIsSpoken', () => {
		// Arrange
		const c = content(
			[{ ...freeAnswer, answer: 'sf' }],
			[sentence('sf', '你好！', 'nǐ hǎo', 'Chào bạn!', 'ní hǎo')]
		);

		// Act
		const [step] = listenSpeakSteps(c) as Extract<LessonStep, { kind: 'speak' }>[];

		// Assert
		expect(step.answer?.pinyin).toBe('ní hǎo');
	});

	it('Given_FreeAnswerAnswerIdMissing_When_SpeakSteps_Then_NoAnswerRubricKept', () => {
		// Arrange
		const c = content([{ ...freeAnswer, answer: 's-none' }]);

		// Act
		const [step] = listenSpeakSteps(c) as Extract<LessonStep, { kind: 'speak' }>[];

		// Assert
		expect(step.answer).toBeUndefined();
		expect(step.rubric).toEqual(['Nói 对不起']);
	});

	it('Given_ReadAloudWithoutSpoken_When_SpeakSteps_Then_PinyinFromSentence', () => {
		// Arrange
		const c = content([readAloud], [sentence('s1', '谢谢。', 'xièxie', 'Cảm ơn.')]);

		// Act
		const [step] = listenSpeakSteps(c) as Extract<LessonStep, { kind: 'speak' }>[];

		// Assert
		expect(step.pinyin).toBe('xièxie');
	});

	it('Given_ReadAloudMissingSentence_When_SpeakSteps_Then_ItemSkipped', () => {
		// Arrange
		const c = content([{ ...readAloud, sentence: 's9' }, freeAnswer]);

		// Act / Assert
		expect(listenSpeakSteps(c).map((s) => s.id)).toEqual(['q-f01']);
	});

	it('Given_FreeAnswerAudioPrompt_When_SpeakSteps_Then_TitleIsPromptRef', () => {
		// Arrange
		const c = content([{ ...freeAnswer, prompt: { kind: 'audio', ref: '你好吗？' } }]);

		// Act
		const [step] = listenSpeakSteps(c);

		// Assert
		expect(step).toMatchObject({ title: '你好吗？' });
	});

	it('Given_Primer_When_SpeakSteps_Then_Empty', () => {
		// Arrange
		const section = { cards: [], drills: [] };
		const primer = Primer.parse({
			kind: 'primer',
			id: 'h1-00',
			level: 1,
			order: 0,
			title: 'Pinyin',
			titleHanzi: '拼音',
			scene: { file: 'scene/h1-00.webp', cast: ['takin'], prompt: 'scene' },
			sections: {
				tones: section,
				finals: section,
				initials: section,
				spelling: section,
				sandhi: section
			},
			gate: { pool: [], draw: 0, testOut: true }
		});

		// Act / Assert
		expect(listenSpeakSteps(bundle(primer, [], []))).toEqual([]);
	});
});
