import type { LessonContent } from '#lib/catalog/index.js';
import type { ImportedWord } from '#lib/content/import/sink.js';
import { Lesson, Word } from '#lib/content/schemas.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { describe, expect, it } from 'vitest';
import { toneVariants, warmupScore, warmupSteps, warmupWords } from './warmup';

const NOW = new Date('2026-11-22T05:00:00Z');
const TZ = 'UTC';
const PREV = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'];
const PINYIN: Record<string, string> = {
	你: 'nǐ',
	好: 'hǎo',
	您: 'nín',
	你们: 'nǐmen',
	你好: 'nǐ hǎo',
	对不起: 'duìbuqǐ',
	没关系: 'méi guānxi',
	谢谢: 'xièxie',
	不客气: 'bú kèqi',
	再见: 'zàijiàn'
};

const word = (id: string, over: Partial<Word> = {}, audio: string | null = `word/${id}`) =>
	({
		...Word.parse({
			id,
			hanzi: id,
			pinyin: PINYIN[id] ?? id,
			level: 1,
			pos: ['n'],
			senses: [{ vi: `vi-${id}` }],
			examples: [],
			...over
		}),
		listedIn: ['h1-01'],
		...(audio ? { audio } : {})
	}) satisfies ImportedWord;

const content = (words: ImportedWord[], order = 1): LessonContent => ({
	contentSha: 'sha-1',
	lesson: Lesson.parse({
		id: 'h1-01',
		level: 1,
		topic: 't',
		order,
		title: 'T',
		titleHanzi: '你',
		goal: 'g',
		scene: { file: 's.webp', cast: ['takin'], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids: words.map((w) => w.id) },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 0 }
	}),
	words,
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

const card = (due: string) => ({ due, first: '2026-11-01T00:00:00Z', fsrs: {} });

const seeded = (ids: string[], due: Record<string, string> = {}): State => {
	const s = initialState({ curriculum: CURRICULUM, tz: TZ });
	for (const id of ids)
		s.lexicon[id] = { saved: false, cards: { the: card(due[id] ?? '2026-12-30T00:00:00Z') } };
	return s;
};

const zero = () => 0;
const choice = (s: LessonStep) => {
	if (s.kind !== 'choice') throw new Error('not a choice step');
	return s;
};

describe('warmupWords', () => {
	it('Given_TenPrevWordsTwoDue_When_Pick_Then_DueFirstAndSix', () => {
		// Arrange
		const state = seeded(PREV, {
			谢谢: '2026-11-20T00:00:00Z',
			再见: '2026-11-21T00:00:00Z'
		});

		// Act
		const picked = warmupWords(state, 'h1-02', NOW, TZ);
		const steps = warmupSteps(content(PREV.map((id) => word(id))), picked, zero);

		// Assert
		expect(picked.slice(0, 2)).toEqual(['谢谢', '再见']);
		expect(picked).toHaveLength(10);
		expect(steps).toHaveLength(6);
		expect(steps.slice(0, 2).map((s) => choice(s).card?.word)).toEqual(['谢谢', '再见']);
	});

	it('Given_NoPrevLexicon_When_Pick_Then_Empty', () => {
		// Arrange
		const state = seeded([]);

		// Act
		const picked = warmupWords(state, 'h1-02', NOW, TZ);

		// Assert
		expect(picked).toEqual([]);
	});

	it('Given_H1_01_When_Pick_Then_Empty', () => {
		// Arrange
		const state = seeded(PREV);

		// Act
		const picked = warmupWords(state, 'h1-01', NOW, TZ);

		// Assert
		expect(picked).toEqual([]);
	});

	it('Given_UnknownLesson_When_Pick_Then_Empty', () => {
		// Arrange
		const state = seeded(PREV);

		// Act
		const picked = warmupWords(state, 'nope', NOW, TZ);

		// Assert
		expect(picked).toEqual([]);
	});

	it('Given_OtherLessonDueWord_When_Pick_Then_Excluded', () => {
		// Arrange
		const state = seeded(['谢谢', 'h2-01-w01'], { 'h2-01-w01': '2026-11-01T00:00:00Z' });

		// Act
		const picked = warmupWords(state, 'h1-02', NOW, TZ);

		// Assert
		expect(picked).toEqual(['谢谢']);
	});
});

describe('warmupSteps', () => {
	const all = content(PREV.map((id) => word(id)));

	it('Given_ThreeCandidates_When_Steps_Then_CycleToSix', () => {
		// Arrange
		const picked = ['你', '好', '您'];

		// Act
		const steps = warmupSteps(all, picked, zero);

		// Assert
		expect(steps.map((s) => choice(s).card?.word)).toEqual(['你', '好', '您', '你', '好', '您']);
		expect(new Set(steps.map((s) => s.id)).size).toBe(6);
	});

	it('Given_NoPicked_When_Steps_Then_Empty', () => {
		// Arrange / Act
		const steps = warmupSteps(all, [], zero);

		// Assert
		expect(steps).toEqual([]);
	});

	it('Given_PickedNotInLesson_When_Steps_Then_Empty', () => {
		// Arrange / Act
		const steps = warmupSteps(all, ['ghost'], zero);

		// Assert
		expect(steps).toEqual([]);
	});

	it('Given_Six_When_Steps_Then_TypesRotate_1_2_3_4_1_2', () => {
		// Arrange
		const picked = PREV.slice(0, 6);

		// Act
		const steps = warmupSteps(all, picked, zero).map(choice);

		// Assert
		expect(steps.map((s) => s.title)).toEqual([
			'Nghe rồi chọn từ đúng',
			'Từ này nghĩa là gì?',
			'Nghe rồi chọn pinyin đúng',
			'Chọn từ có nghĩa này',
			'Nghe rồi chọn từ đúng',
			'Từ này nghĩa là gì?'
		]);
		expect(steps.map((s) => s.card?.skill).join()).toBe('nghe,the,nghe,the,nghe,the');
		expect(steps[0].audio).toBe('word/你');
		expect(steps[1].prompt).toEqual({ text: '好', hanzi: true });
		expect(steps[2].answer).toBe('nín');
		expect(steps[3].prompt).toEqual({ text: 'vi-你们', hanzi: false });
		expect(steps[3].answer).toBe('你们');
	});

	it('Given_NoAudio_When_Steps_Then_AudioTypesFallBack', () => {
		// Arrange
		const noClip = content(
			PREV.map((id) => word(id, {}, id === '你' || id === '您' ? null : `word/${id}`))
		);

		// Act
		const steps = warmupSteps(noClip, ['你', '好', '您', '你们'], zero).map(choice);

		// Assert
		expect(steps[0].title).toBe('Từ này nghĩa là gì?');
		expect(steps[0].audio).toBeUndefined();
		expect(steps[0].card?.skill).toBe('the');
		expect(steps[2].title).toBe('Chọn từ có nghĩa này');
		expect(steps[2].audio).toBeUndefined();
	});

	it('Given_NoToneMark_When_Steps_Then_ToneCardFallsBackToRev', () => {
		// Arrange
		const flat = content(PREV.map((id) => word(id, id === '您' ? { pinyin: 'nin' } : {})));

		// Act
		const steps = warmupSteps(flat, ['你', '好', '您', '你们'], zero).map(choice);

		// Assert
		expect(steps[2].title).toBe('Chọn từ có nghĩa này');
		expect(steps[2].card?.skill).toBe('the');
	});

	it('Given_PrevLessonUnderFourWords_When_Steps_Then_Empty', () => {
		// Arrange
		const small = content(PREV.slice(0, 3).map((id) => word(id)));

		// Act
		const steps = warmupSteps(small, PREV.slice(0, 3), zero);

		// Assert
		expect(steps).toEqual([]);
	});

	it('Given_DuplicateMeanings_When_MeanCard_Then_DistinctOptions', () => {
		// Arrange
		const dup = content(
			PREV.map((id, i) => word(id, { senses: [{ vi: i < 4 ? 'giống nhau' : `vi-${id}` }] }))
		);

		// Act
		const steps = warmupSteps(dup, ['好', '你', '您', '你们'], zero).map(choice);

		// Assert
		const mean = steps[1];
		expect(mean.title).toBe('Từ này nghĩa là gì?');
		expect(new Set(mean.options).size).toBe(4);
		expect(mean.options).toContain(mean.answer);
	});

	it('Given_TooFewDistinctMeanings_When_MeanCard_Then_FallsBackToRev', () => {
		// Arrange
		const same = content(PREV.map((id) => word(id, { senses: [{ vi: 'giống nhau' }] })));

		// Act
		const steps = warmupSteps(same, ['你', '好', '您', '你们'], zero).map(choice);

		// Assert
		expect(steps[1].title).toBe('Chọn từ có nghĩa này');
		expect(steps[1].card?.skill).toBe('the');
	});

	it('Given_Steps_When_Built_Then_FourDistinctOptionsWithAnswer', () => {
		// Arrange
		const picked = PREV.slice(0, 6);

		// Act
		const steps = warmupSteps(all, picked, Math.random).map(choice);

		// Assert
		expect(steps).toHaveLength(6);
		for (const s of steps) {
			expect(new Set(s.options).size).toBe(4);
			expect(s.options).toContain(s.answer);
			expect(s.missHint).toBe('Từ này sẽ quay lại sớm hơn');
		}
		expect(steps[0].ask).toBe('Ôn lại Bài 1 trước khi học từ mới');
		expect(steps.slice(1).map((s) => s.ask)).toEqual(Array(5).fill('Khởi động · Ôn Bài 1'));
	});
});

describe('toneVariants', () => {
	it('Given_MeiGuanxi_When_ToneVariants_Then_ThreeDistinctSameShape', () => {
		// Arrange / Act
		const v = toneVariants('méi guānxi');

		// Assert
		expect(v).toEqual(['mēi guānxi', 'měi guānxi', 'mèi guānxi']);
		expect(new Set(v).size).toBe(3);
		expect(v.every((x) => x.split(' ').length === 2 && x !== 'méi guānxi')).toBe(true);
	});

	it('Given_Xiexie_When_ToneVariants_Then_FirstSyllableChangesSecondKept', () => {
		// Arrange / Act
		const v = toneVariants('xièxie');

		// Assert
		expect(v).toEqual(['xiēxie', 'xiéxie', 'xiěxie']);
	});

	it('Given_Nuer_When_ToneVariants_Then_UmlautKept', () => {
		// Arrange / Act
		const v = toneVariants("nǚ'ér");

		// Assert
		expect(v).toEqual(["nǖ'ér", "nǘ'ér", "nǜ'ér"]);
	});

	it('Given_NoToneMark_When_ToneVariants_Then_Empty', () => {
		// Arrange / Act
		const v = toneVariants('ma');

		// Assert
		expect(v).toEqual([]);
	});
});

describe('warmupScore', () => {
	const run = (id: string, answers: boolean[], closed = true) => ({
		step: { kind: 'section' as const, lesson: 'h1-02', section: 'warmup', run: id, of: 6 },
		answers: Object.fromEntries(answers.map((a, i) => [`q${i}`, a])),
		...(closed ? { closed: true as const } : {})
	});

	it('Given_RunClosedThisMount_When_Score_Then_RightCount', () => {
		// Arrange
		const state = seeded([]);
		state.runs.r1 = run('r1', [true, true, true, true, true, false]);

		// Act
		const k = warmupScore(new Set(), state, 'h1-02');

		// Assert
		expect(k).toBe(5);
	});

	it('Given_RunClosedBefore_When_Score_Then_Ignored', () => {
		// Arrange
		const state = seeded([]);
		state.runs.r1 = run('r1', [true, true, true, true, true, true]);

		// Act
		const k = warmupScore(new Set(['r1']), state, 'h1-02');

		// Assert
		expect(k).toBe(0);
	});

	it('Given_OpenRunOrOtherSection_When_Score_Then_Zero', () => {
		// Arrange
		const state = seeded([]);
		state.runs.open = run('open', [true, true], false);
		state.runs.other = {
			...run('other', [true, true, true]),
			step: { kind: 'section', lesson: 'h1-02', section: 'words', run: 'other', of: 3 }
		};

		// Act
		const k = warmupScore(new Set(), state, 'h1-02');

		// Assert
		expect(k).toBe(0);
	});
});
