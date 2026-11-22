import type { LessonContent } from '#lib/catalog/index.js';
import { Lesson, Sentence, Word } from '#lib/content/schemas.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { describe, expect, it } from 'vitest';
import { gateSteps } from './gate';

const word = (id: string, pinyin: string, vi: string, audio?: string) => ({
	...Word.parse({
		id,
		hanzi: id,
		pinyin,
		level: 1,
		pos: ['phrase'],
		senses: [{ vi }],
		examples: []
	}),
	listedIn: ['h1-01'],
	...(audio ? { audio } : {})
});

const WORDS = [
	word('谢谢', 'xièxie', 'cảm ơn', 'words/xiexie'),
	word('再见', 'zàijiàn', 'tạm biệt', 'words/zaijian'),
	word('没关系', 'méi guānxi', 'không sao', 'words/meiguanxi'),
	word('好', 'hǎo', 'tốt')
];

const SENTENCES = [
	{
		...Sentence.parse({ id: 's9', hanzi: '你们好！', pinyin: 'nǐmen hǎo', vi: 'Chào các bạn!' }),
		seg: []
	}
];

const POOL = [
	{
		id: 'x-audio',
		type: 'choice',
		tests: {},
		prompt: { kind: 'audio', ref: '谢谢' },
		optionKind: 'hanzi',
		options: ['谢谢', '再见'],
		answer: 0
	},
	{
		id: 'x-mute',
		type: 'choice',
		tests: {},
		prompt: { kind: 'audio', ref: '好' },
		optionKind: 'hanzi',
		options: ['好', '你'],
		answer: 0
	},
	{
		id: 'x-hanzi',
		type: 'choice',
		tests: {},
		prompt: { kind: 'hanzi', ref: '好' },
		optionKind: 'vi',
		options: ['tốt', 'cảm ơn'],
		answer: 0
	},
	{
		id: 'x-vi',
		type: 'choice',
		tests: {},
		prompt: { kind: 'vi', text: 'không sao' },
		optionKind: 'hanzi',
		options: ['对不起', '没关系'],
		answer: 1
	},
	{ id: 'x-order', type: 'order', tests: {}, tiles: ['们', '你', '好'], answer: 's9' },
	{ id: 'x-order-lost', type: 'order', tests: {}, tiles: ['们'], answer: 's-none' },
	{
		id: 'x-tone',
		type: 'tone',
		tests: {},
		prompt: { kind: 'audio', ref: '没关系' },
		syllable: 0,
		answer: 2
	},
	{
		id: 'x-tone-mute',
		type: 'tone',
		tests: {},
		prompt: { kind: 'audio', ref: '好' },
		syllable: 0,
		answer: 3
	},
	{
		id: 'x-true',
		type: 'trueFalse',
		tests: {},
		prompt: { kind: 'hanzi', ref: '好' },
		statement: '好 nghĩa là tốt.',
		answer: true
	},
	{
		id: 'x-false',
		type: 'trueFalse',
		tests: {},
		prompt: { kind: 'hanzi', ref: '再见' },
		statement: '再见 nghĩa là xin chào.',
		answer: false
	},
	{
		id: 'x-pinyin',
		type: 'typePinyin',
		tests: {},
		prompt: { kind: 'hanzi', ref: '再见' },
		answer: 'zàijiàn'
	},
	{ id: 'x-read', type: 'readAloud', tests: {}, sentence: 's9' }
];

const content = (draw: number, pool: unknown[] = POOL): LessonContent => ({
	contentSha: 'sha',
	lesson: Lesson.parse({
		id: 'h1-01',
		level: 1,
		topic: 'chao-hoi',
		order: 1,
		title: 'Chào hỏi',
		titleHanzi: '你好',
		goal: 'Chào',
		scene: { file: 'scene/h1-01.webp', cast: ['takin'], prompt: 'scene' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids: [] },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool, draw }
	}),
	words: WORDS,
	chars: [],
	sentences: SENTENCES,
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

const byId = (steps: LessonStep[]) => Object.fromEntries(steps.map((s) => [s.id, s]));

describe('gateSteps', () => {
	it('Given_PoolOf12_When_Draw_Then_OnlyRenderableItems', () => {
		// Arrange
		const c = content(99);

		// Act
		const steps = gateSteps(c, () => 0);

		// Assert
		expect(steps.map((s) => s.id).sort()).toEqual(
			['x-audio', 'x-false', 'x-hanzi', 'x-order', 'x-pinyin', 'x-tone', 'x-true', 'x-vi'].sort()
		);
	});

	it('Given_Draw3_When_Draw_Then_ThreeDistinctPoolIds', () => {
		// Arrange
		const c = content(3);

		// Act
		const steps = gateSteps(c, Math.random);

		// Assert
		expect(steps).toHaveLength(3);
		expect(new Set(steps.map((s) => s.id)).size).toBe(3);
		steps.forEach((s) => expect(POOL.map((q) => q.id)).toContain(s.id));
	});

	it('Given_TwoSeeds_When_Draw_Then_OrderDiffers', () => {
		// Arrange
		const c = content(99);

		// Act
		const a = gateSteps(c, () => 0).map((s) => s.id);
		const b = gateSteps(c, () => 0.999).map((s) => s.id);

		// Assert
		expect(a).not.toEqual(b);
	});

	it('Given_EveryKind_When_Map_Then_StepsMatchContent', () => {
		// Arrange
		const c = content(99);

		// Act
		const s = byId(gateSteps(c));

		// Assert
		expect(s['x-audio']).toEqual({
			kind: 'choice',
			id: 'x-audio',
			ask: m.listen_word_ask(),
			title: '',
			options: ['谢谢', '再见'],
			answer: '谢谢',
			script: 'hanzi',
			audio: 'words/xiexie'
		});
		expect(s['x-hanzi']).toMatchObject({
			ask: m.gate_meaning_ask(),
			title: '好',
			answer: 'tốt',
			script: 'text'
		});
		expect(s['x-vi']).toMatchObject({
			ask: m.gate_hanzi_ask(),
			title: 'không sao',
			answer: '没关系'
		});
		expect(s['x-order']).toEqual({
			kind: 'order',
			id: 'x-order',
			ask: m.gate_order_ask(),
			title: 'Chào các bạn!',
			tiles: ['们', '你', '好'],
			answer: '你们好'
		});
		expect(s['x-tone']).toEqual({
			kind: 'tone',
			id: 'x-tone',
			ask: m.listen_tone_ask(),
			audio: 'words/meiguanxi',
			answer: 2,
			syllable: 'méi'
		});
		expect(s['x-true']).toMatchObject({
			kind: 'choice',
			title: '好 nghĩa là tốt.',
			options: [m.gate_true(), m.gate_false()],
			answer: m.gate_true()
		});
		expect(s['x-false']).toMatchObject({ answer: m.gate_false() });
		expect(s['x-pinyin']).toEqual({
			kind: 'pinyin',
			id: 'x-pinyin',
			ask: m.gate_pinyin_ask(),
			title: 'tạm biệt',
			hanzi: '再见',
			answer: 'zàijiàn'
		});
	});

	it('Given_UnknownWord_When_MapPinyin_Then_EmptyTitle', () => {
		// Arrange
		const c = content(1, [
			{
				id: 'p',
				type: 'typePinyin',
				tests: {},
				prompt: { kind: 'hanzi', ref: '猫' },
				answer: 'māo'
			}
		]);

		// Act
		const [step] = gateSteps(c);

		// Assert
		expect(step).toMatchObject({ kind: 'pinyin', title: '', hanzi: '猫' });
	});

	it('Given_Primer_When_Draw_Then_NoSteps', () => {
		// Arrange
		const c = { ...content(1), lesson: { kind: 'primer' } } as unknown as LessonContent;

		// Act
		const steps = gateSteps(c);

		// Assert
		expect(steps).toEqual([]);
	});
});
