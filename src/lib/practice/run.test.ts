import { describe, expect, it } from 'vitest';
import type { LessonContent } from '#lib/catalog/index.js';
import type { CatalogWord } from '#lib/catalog/index.js';
import type { ThinEntry } from '#lib/content/derive/dictionary.js';
import type { Answer } from '#lib/lesson/types.js';
import type { Skill } from '#lib/study/index.js';
import { itemId, type QueueItem } from './queue';
import { fromCard, itemOf, summary, toPracticeAttempt, wordInfo, type WordInfo } from './run';

const info: WordInfo = {
	pinyin: 'xuéshēng',
	hanviet: 'học sinh',
	nghia: 'học sinh',
	audio: 'word/学生',
	contentSha: 'sha-1'
};

const queued = (word: string, skill: Skill, again = false): QueueItem => ({
	word,
	skill,
	again,
	id: itemId({ word, skill }, again)
});

const word = (over: Partial<CatalogWord> = {}) =>
	({
		id: '学生',
		hanzi: '学生',
		pinyin: 'xuéshēng',
		hanviet: 'học sinh',
		level: 1,
		pos: [],
		senses: [{ vi: 'học sinh' }],
		examples: [],
		listedIn: [],
		audio: 'word/学生',
		taughtIn: 'h1-01',
		contentSha: 'sha-1',
		...over
	}) as CatalogWord;

type Stub = {
	find: (h: string) => Promise<{ word: CatalogWord | null; char: null }>;
	thin: (h: string) => Promise<ThinEntry | null>;
	lesson: (id: string) => Promise<LessonContent>;
};

const stub = (over: Partial<Stub> = {}): Stub => ({
	find: async () => ({ word: word(), char: null }),
	thin: async () => null,
	lesson: async () => {
		throw new Error('no lesson');
	},
	...over
});

const result = (w: string, skill: Skill, correct: boolean | null, again = false) => ({
	item: queued(w, skill, again),
	correct
});

const run = (skill: Skill, missed: number, total: number) =>
	Array.from({ length: total }, (_, i) => result(`w${i}`, skill, i >= missed));

describe('itemOf', () => {
	it('Given_TheCard_When_ItemOf_Then_Flashcard', () => {
		// Arrange
		const item = queued('学生', 'the');

		// Act
		const out = itemOf(item, info, ['学生']);

		// Assert
		expect(out).toEqual({
			kind: 'flashcard',
			id: 'practice:the:学生',
			again: false,
			card: {
				hanzi: '学生',
				pinyin: 'xuéshēng',
				hanviet: 'học sinh',
				meaning: 'học sinh',
				audio: 'word/学生',
				example: undefined
			}
		});
	});

	it('Given_NgheCard_When_ItemOf_Then_ChoiceWithInstant', () => {
		// Arrange
		const item = queued('学生', 'nghe');

		// Act
		const out = itemOf(item, info, ['学生', '你好', '谢谢', '再见']);

		// Assert
		expect(out).toMatchObject({
			kind: 'choice',
			id: 'practice:nghe:学生',
			answer: '学生',
			instant: true,
			audio: 'word/学生',
			card: { word: '学生', skill: 'nghe' }
		});
	});

	it('Given_VietCard_When_ItemOf_Then_VietWithItemId', () => {
		// Arrange
		const item = queued('学生', 'viet');

		// Act
		const out = itemOf(item, info, []);

		// Assert
		expect(out).toEqual({
			kind: 'viet',
			id: 'practice:viet:学生',
			word: '学生',
			pinyin: 'xuéshēng',
			nghia: 'học sinh',
			again: false
		});
	});

	it('Given_AgainItem_When_ItemOf_Then_AgainKept', () => {
		// Arrange
		const the = queued('学生', 'the', true);
		const nghe = queued('学生', 'nghe', true);
		const viet = queued('学生', 'viet', true);

		// Act
		const outs = [the, nghe, viet].map((i) => itemOf(i, info, ['学生']));

		// Assert
		expect(outs.map((o) => o.id)).toEqual([
			'practice:the:学生#again',
			'practice:nghe:学生#again',
			'practice:viet:学生#again'
		]);
		expect(outs[0]).toMatchObject({ kind: 'flashcard', again: true });
		expect(outs[1]).toMatchObject({ kind: 'choice' });
		expect(outs[2]).toMatchObject({ kind: 'viet', again: true });
	});
});

describe('wordInfo', () => {
	it('Given_FindMisses_When_WordInfo_Then_ThinFallback', async () => {
		// Arrange
		const catalog = stub({
			find: async () => ({ word: null, char: null }),
			thin: async () => ({ hanzi: '你', pinyin: 'nǐ', hanviet: 'nhĩ', meaning: 'bạn' })
		});

		// Act
		const out = await wordInfo(catalog, '你');

		// Assert
		expect(out).toEqual({
			pinyin: 'nǐ',
			hanviet: 'nhĩ',
			nghia: 'bạn',
			audio: '',
			contentSha: ''
		});
	});

	it('Given_BothMiss_When_WordInfo_Then_EmptyStrings', async () => {
		// Arrange
		const catalog = stub({ find: async () => ({ word: null, char: null }) });

		// Act
		const out = await wordInfo(catalog, '你');

		// Assert
		expect(out).toEqual({ pinyin: '', hanviet: '', nghia: '', audio: '', contentSha: '' });
	});

	it('Given_FindThrows_When_WordInfo_Then_EmptyStrings', async () => {
		// Arrange
		const catalog = stub({
			find: async () => {
				throw new Error('offline');
			}
		});

		// Act
		const out = await wordInfo(catalog, '你');

		// Assert
		expect(out).toEqual({ pinyin: '', hanviet: '', nghia: '', audio: '', contentSha: '' });
	});

	it('Given_SenseExample_When_WordInfo_Then_ExampleFromLesson', async () => {
		// Arrange
		const catalog = stub({
			find: async () => ({
				word: word({
					senses: [
						{ vi: 'hiếm', rare: true, example: 's-rare' },
						{ vi: 'học sinh', example: 's-1' }
					]
				}),
				char: null
			}),
			lesson: async () =>
				({
					sentences: [
						{ id: 's-rare', hanzi: '错', pinyin: 'cuò', vi: 'sai' },
						{
							id: 's-1',
							hanzi: '他是学生。',
							pinyin: 'Tā shì xuéshēng.',
							vi: 'Anh ấy là học sinh.'
						}
					]
				}) as LessonContent
		});

		// Act
		const out = await wordInfo(catalog, '学生');

		// Assert
		expect(out).toMatchObject({
			nghia: 'học sinh',
			audio: 'word/学生',
			contentSha: 'sha-1',
			example: { hanzi: '他是学生。', pinyin: 'Tā shì xuéshēng.', vi: 'Anh ấy là học sinh.' }
		});
	});

	it('Given_NoExampleId_When_WordInfo_Then_NoExample', async () => {
		// Arrange
		const catalog = stub();

		// Act
		const out = await wordInfo(catalog, '学生');

		// Assert
		expect(out.example).toBeUndefined();
	});

	it('Given_ExampleIdNotInLesson_When_WordInfo_Then_NoExample', async () => {
		// Arrange
		const catalog = stub({
			find: async () => ({
				word: word({ senses: [{ vi: 'học sinh', example: 'missing' }] }),
				char: null
			}),
			lesson: async () => ({ sentences: [] }) as unknown as LessonContent
		});

		// Act
		const out = await wordInfo(catalog, '学生');

		// Assert
		expect(out.example).toBeUndefined();
		expect(out.nghia).toBe('học sinh');
	});

	it('Given_LessonThrows_When_WordInfo_Then_NoExample', async () => {
		// Arrange
		const catalog = stub({
			find: async () => ({
				word: word({ senses: [{ vi: 'học sinh', example: 's-1' }] }),
				char: null
			})
		});

		// Act
		const out = await wordInfo(catalog, '学生');

		// Assert
		expect(out.example).toBeUndefined();
		expect(out.pinyin).toBe('xuéshēng');
	});

	it('Given_NoTaughtIn_When_WordInfo_Then_NoExample', async () => {
		// Arrange
		const catalog = stub({
			find: async () => ({
				word: word({ taughtIn: undefined, senses: [{ vi: 'học sinh', example: 's-1' }] }),
				char: null
			})
		});

		// Act
		const out = await wordInfo(catalog, '学生');

		// Assert
		expect(out.example).toBeUndefined();
	});
});

describe('fromCard', () => {
	it('Given_Quen_When_FromCard_Then_CorrectFalse', () => {
		// Arrange
		const item = queued('学生', 'the');

		// Act
		const quen = fromCard(item, { remembered: false, ms: 900 });
		const nho = fromCard(item, { remembered: true, ms: 400 });

		// Assert
		expect(quen).toEqual({
			questionId: 'practice:the:学生',
			pick: 'quen',
			correct: false,
			ms: 900,
			card: { word: '学生', skill: 'the' }
		});
		expect(nho).toMatchObject({ pick: 'nho', correct: true, ms: 400 });
	});
});

describe('toPracticeAttempt', () => {
	const ctx = { run: 'run-1', of: 10, contentSha: 'sha-1' };
	const ids = { id: 'a-1', at: '2026-11-23T01:00:00.000Z' };

	it('Given_Answer_When_ToPracticeAttempt_Then_PracticeStepOfOriginalCount', () => {
		// Arrange
		const item = queued('学生', 'nghe', true);
		const a: Answer = {
			questionId: item.id,
			pick: '学生',
			correct: false,
			ms: 700,
			card: { word: '学生', skill: 'nghe' }
		};

		// Act
		const out = toPracticeAttempt(a, item, ctx, ids);

		// Assert
		expect(out).toEqual({
			id: 'a-1',
			at: '2026-11-23T01:00:00.000Z',
			questionId: 'practice:nghe:学生#again',
			contentSha: 'sha-1',
			correct: false,
			ms: 700,
			answer: '学生',
			card: { word: '学生', skill: 'nghe' },
			step: { kind: 'practice', run: 'run-1', of: 10 }
		});
	});

	it('Given_NoAnswer_When_ToPracticeAttempt_Then_NullCorrect', () => {
		// Arrange
		const item = queued('学生', 'viet');

		// Act
		const out = toPracticeAttempt(undefined, item, ctx, ids);

		// Assert
		expect(out).toEqual({
			id: 'a-1',
			at: '2026-11-23T01:00:00.000Z',
			questionId: 'practice:viet:学生',
			contentSha: 'sha-1',
			correct: null,
			ms: 0,
			card: { word: '学生', skill: 'viet' },
			step: { kind: 'practice', run: 'run-1', of: 10 }
		});
	});
});

describe('summary', () => {
	it('Given_ZeroThreeEightOfTen_When_Summary_Then_GreatOkHard', () => {
		// Arrange
		const none = run('the', 0, 10);
		const three = run('the', 3, 10);
		const eight = run('the', 8, 10);

		// Act
		const out = [none, three, eight].map((r) => summary(r));

		// Assert
		expect(out.map((s) => s.headline)).toEqual(['great', 'ok', 'hard']);
		expect(out.map((s) => s.missed)).toEqual([0, 3, 8]);
		expect(out.map((s) => s.scored)).toEqual([10, 10, 10]);
	});

	it('Given_ThreeOfSix_When_Summary_Then_Hard', () => {
		// Arrange
		const results = run('nghe', 3, 6);

		// Act
		const out = summary(results);

		// Assert
		expect(out.headline).toBe('hard');
	});

	it('Given_MissThenHit_When_Summary_Then_StillMissed', () => {
		// Arrange
		const results = [
			result('学生', 'the', false),
			result('你好', 'the', true),
			result('学生', 'the', true, true)
		];

		// Act
		const out = summary(results);

		// Assert
		expect(out.missed).toBe(1);
		expect(out.scored).toBe(2);
		expect(out.rows).toEqual([
			{ word: '学生', skill: 'the', missed: true },
			{ word: '你好', skill: 'the', missed: false }
		]);
		expect(out.skills).toEqual([{ skill: 'the', right: 1, total: 2 }]);
	});

	it('Given_NullOnly_When_Summary_Then_Unscored', () => {
		// Arrange
		const results = [
			...run('nghe', 2, 9).map((r, i) => ({ ...r, item: queued(`n${i}`, 'nghe') })),
			result('学生', 'viet', null)
		];

		// Act
		const out = summary(results);

		// Assert
		expect(out.scored).toBe(9);
		expect(out.missed).toBe(2);
		expect(out.headline).toBe('ok');
		expect(out.rows.map((r) => r.word)).not.toContain('学生');
		expect(out.skills).toEqual([{ skill: 'nghe', right: 7, total: 9 }]);
	});

	it('Given_AllNull_When_Summary_Then_NoHeadline', () => {
		// Arrange
		const results = [result('学生', 'viet', null), result('你好', 'viet', null)];

		// Act
		const out = summary(results);

		// Assert
		expect(out).toEqual({ missed: 0, scored: 0, headline: null, skills: [], rows: [] });
	});

	it('Given_Mix_When_Summary_Then_SkillLinesAndMissedFirst', () => {
		// Arrange
		const results = [
			...Array.from({ length: 6 }, (_, i) => result(`t${i}`, 'the', i !== 2)),
			...Array.from({ length: 3 }, (_, i) => result(`n${i}`, 'nghe', i !== 1)),
			result('v0', 'viet', true),
			result('t2', 'the', true, true)
		];

		// Act
		const out = summary(results);

		// Assert
		expect(out.skills).toEqual([
			{ skill: 'the', right: 5, total: 6 },
			{ skill: 'nghe', right: 2, total: 3 },
			{ skill: 'viet', right: 1, total: 1 }
		]);
		expect(out.rows.slice(0, 2)).toEqual([
			{ word: 't2', skill: 'the', missed: true },
			{ word: 'n1', skill: 'nghe', missed: true }
		]);
		expect(out.rows.slice(2).every((r) => !r.missed)).toBe(true);
		expect(out.rows.slice(2).map((r) => r.word)).toEqual([
			't0',
			't1',
			't3',
			't4',
			't5',
			'n0',
			'n2',
			'v0'
		]);
	});

	it('Given_SameWordTwoSkills_When_Summary_Then_TwoRows', () => {
		// Arrange
		const results = [result('你好', 'the', true), result('你好', 'nghe', true)];

		// Act
		const out = summary(results);

		// Assert
		expect(out.rows).toHaveLength(2);
	});
});
