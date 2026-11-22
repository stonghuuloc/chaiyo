import type { LessonContent } from '#lib/catalog/index.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { describe, expect, it } from 'vitest';
import { Lesson, Primer, Sentence } from '#lib/content/schemas.js';
import { speakSteps } from './listen-speak';

const sentence = (id: string, hanzi: string, pinyin: string, vi: string, spoken?: string) => ({
	...Sentence.parse({ id, hanzi, pinyin, spoken, vi }),
	seg: [hanzi]
});

const bundle = (lesson: LessonContent['lesson'], sentences: LessonContent['sentences']) =>
	({
		contentSha: 'sha',
		lesson,
		words: [],
		chars: [],
		sentences,
		grammar: [],
		questions: [],
		gateCoverage: {},
		thin: []
	}) satisfies LessonContent;

const content = (
	items: unknown[],
	sentences = [sentence('s1', '不客气。', 'bù kèqi', 'Không có gì.', 'bú kèqi')]
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

const readAloud = { id: 'q-s01', type: 'readAloud', tests: { words: ['不客气'] }, sentence: 's1' };
const freeAnswer = {
	id: 'q-f01',
	type: 'freeAnswer',
	tests: { words: ['对不起'] },
	prompt: { kind: 'vi', text: 'Bạn làm đổ trà của bạn mình. Nói gì?' },
	rubric: ['Nói 对不起']
};

describe('speakSteps', () => {
	it('Given_H1_01_When_SpeakSteps_Then_ThreeSpeakSteps', () => {
		// Arrange
		const c = content([
			{
				id: 'q-l01',
				type: 'tone',
				tests: { words: ['好'], tone: true },
				prompt: { kind: 'audio', ref: '好' },
				syllable: 0,
				answer: 3
			},
			readAloud,
			freeAnswer,
			{
				...freeAnswer,
				id: 'q-f02',
				prompt: { kind: 'vi', text: 'Bạn gặp cô giáo ở cổng trường. Chào cô.' }
			}
		]);

		// Act
		const steps = speakSteps(c);

		// Assert
		expect(steps.map((s) => s.id)).toEqual(['q-s01', 'q-f01', 'q-f02']);
		expect(steps.every((s) => s.kind === 'speak')).toBe(true);
	});

	it('Given_ReadAloud_When_SpeakSteps_Then_SentenceHanziSpokenPinyinMeaning', () => {
		// Act
		const [step] = speakSteps(content([readAloud])) as Extract<LessonStep, { kind: 'speak' }>[];

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
		const [step] = speakSteps(content([freeAnswer]));

		// Assert
		expect(step).toMatchObject({
			kind: 'speak',
			ask: m.lesson_speak_answer_ask(),
			title: 'Bạn làm đổ trà của bạn mình. Nói gì?'
		});
	});

	it('Given_ReadAloudWithoutSpoken_When_SpeakSteps_Then_PinyinFromSentence', () => {
		// Arrange
		const c = content([readAloud], [sentence('s1', '谢谢。', 'xièxie', 'Cảm ơn.')]);

		// Act
		const [step] = speakSteps(c) as Extract<LessonStep, { kind: 'speak' }>[];

		// Assert
		expect(step.pinyin).toBe('xièxie');
	});

	it('Given_ReadAloudMissingSentence_When_SpeakSteps_Then_ItemSkipped', () => {
		// Arrange
		const c = content([{ ...readAloud, sentence: 's9' }, freeAnswer]);

		// Act / Assert
		expect(speakSteps(c).map((s) => s.id)).toEqual(['q-f01']);
	});

	it('Given_FreeAnswerAudioPrompt_When_SpeakSteps_Then_TitleIsPromptRef', () => {
		// Arrange
		const c = content([{ ...freeAnswer, prompt: { kind: 'audio', ref: '你好吗？' } }]);

		// Act
		const [step] = speakSteps(c);

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
		expect(speakSteps(bundle(primer, []))).toEqual([]);
	});
});
