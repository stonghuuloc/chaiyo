import { describe, expect, it } from 'vitest';
import { CatalogError, createCatalog, type CatalogSource } from '#lib/catalog/index.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import type { ImportedSentence, ImportedWord } from '#lib/content/import/sink.js';
import { loadWord, wordView, type WordView } from './word-view';

const word = (over: Partial<ImportedWord> & Pick<ImportedWord, 'hanzi'>): ImportedWord => ({
	id: over.hanzi,
	pinyin: 'hǎo',
	level: 1,
	pos: ['phrase'],
	senses: [],
	examples: [],
	listedIn: ['h1-01'],
	...over
});

const sentence = (over: Partial<ImportedSentence> & Pick<ImportedSentence, 'id' | 'hanzi'>) => ({
	pinyin: 'nǐ hǎo',
	vi: 'Chào bạn!',
	seg: [],
	...over
});

const hao = word({
	hanzi: '好',
	pinyin: 'hǎo',
	hanviet: 'hảo',
	pos: ['adj', 'adv', 'comp', 'interj', 'phrase'],
	senses: [
		{ vi: 'tốt, khỏe, hay' },
		{ vi: 'tốt, hay, khỏe', pos: 'adj', example: 's-w-ai-0e7e6aef' },
		{ vi: 'hợp, thích hợp', pos: 'adj', example: 's-w-ai-159bfa32' },
		{ vi: 'thân, thân thiết (hai người)', pos: 'adj', rare: true, example: 's-w-ai-4759a4f6' },
		{ vi: 'quá, thật là (nhấn mạnh, trước tính từ)', pos: 'adv', example: 's-w-785298' },
		{ vi: 'mấy, khá nhiều (trước số từ: 好几个, 好几天)', pos: 'adv', example: 's-w-ai-c2482e5d' },
		{ vi: 'dễ (đứng trước động từ: 好用, 好找)', pos: 'adv', example: 's-w-ai-f43fcbef' },
		{
			vi: 'tốt để, dễ chịu khi (đứng trước động từ: 好吃, 好听, 好睡)',
			pos: 'adv',
			example: 's-w-ai-d29c49e5'
		},
		{ vi: 'xong, hoàn tất (sau động từ)', pos: 'comp', example: 's-w-ai-551ccbe4' },
		{ vi: 'được, ừ được (đồng ý)', pos: 'interj', example: 's-w-6057700' },
		{ vi: 'chào (đứng sau đại từ)', pos: 'phrase', example: 's-w-338827' }
	],
	examples: ['s-h1-01-11']
});

const ni = word({
	hanzi: '你',
	pinyin: 'nǐ',
	hanviet: 'nhĩ',
	pos: ['pron'],
	senses: [
		{ vi: 'bạn, anh, chị' },
		{ vi: 'bạn, cậu, anh, chị (ngôi thứ hai)', pos: 'pron', example: 's-w-395853' }
	],
	examples: ['s-h1-01-10', 's-w-395853']
});

const nihao = word({
	hanzi: '你好',
	senses: [{ vi: 'xin chào' }],
	examples: ['s-h1-01-14']
});

const failure = async (p: Promise<unknown>): Promise<CatalogError> => {
	try {
		await p;
	} catch (e) {
		return e as CatalogError;
	}
	throw new Error('expected rejection');
};

const twoLessonSource = async (): Promise<CatalogSource> => {
	const inner = await fixtureSource();
	const sha = await inner.current();
	const base = await inner.bundle(sha, 'h1-01');
	return {
		current: inner.current,
		bundle: async (s, id) =>
			id === 'h1-02'
				? { ...base, lesson: { ...base.lesson, id: 'h1-02' }, words: [] }
				: inner.bundle(s, id)
	};
};

describe('wordView', () => {
	it('Given_HaoShape_When_View_Then_FiveGroupsInFirstSeenOrder_UntaggedHidden_RareCountOne', () => {
		// Act
		const view = wordView(hao, []);
		// Assert
		expect(view.groups.map((g) => g.pos)).toEqual(['adj', 'adv', 'comp', 'interj', 'phrase']);
		expect(view.rare).toBe(1);
		expect(view.groups.flatMap((g) => g.senses).some((s) => s.vi === 'tốt, khỏe, hay')).toBe(false);
		expect(view.groups[0].senses.map((s) => s.rare)).toEqual([false, false, true]);
	});

	it('Given_NiShape_When_View_Then_OnePronSense', () => {
		// Act
		const view = wordView(ni, [
			sentence({ id: 's-w-395853', hanzi: '你是谁？', vi: 'Bạn là ai?', source: 'tatoeba:395853' })
		]);
		// Assert
		expect(view.groups).toHaveLength(1);
		expect(view.groups[0].pos).toBe('pron');
		expect(view.groups[0].senses).toHaveLength(1);
		expect(view.groups[0].senses[0].example).toEqual({
			hanzi: '你是谁？',
			pinyin: 'nǐ hǎo',
			vi: 'Bạn là ai?',
			source: { kind: 'tatoeba', url: 'https://tatoeba.org/vi/sentences/show/395853' }
		});
	});

	it('Given_AllUntagged_When_View_Then_GroupByWordPos_WithWordExample', () => {
		// Act
		const view = wordView(nihao, [sentence({ id: 's-h1-01-14', hanzi: '你们好！' })]);
		// Assert
		expect(view.groups).toHaveLength(1);
		expect(view.groups[0].pos).toBe('phrase');
		expect(view.groups[0].senses[0].vi).toBe('xin chào');
		expect(view.groups[0].senses[0].example?.hanzi).toBe('你们好！');
	});

	it('Given_TatoebaSource_When_View_Then_TatoebaUrl', () => {
		// Arrange
		const sentences = [
			sentence({ id: 'a', hanzi: '好的。', source: 'tatoeba:785298' }),
			sentence({ id: 'b', hanzi: '好。', source: 'ai' }),
			sentence({ id: 'c', hanzi: '好！' })
		];
		// Act
		const view = wordView(
			word({
				hanzi: '好',
				senses: [
					{ vi: 'tốt', pos: 'adj', example: 'a' },
					{ vi: 'hay', pos: 'adj', example: 'b' },
					{ vi: 'khỏe', pos: 'adj', example: 'c' }
				]
			}),
			sentences
		);
		// Assert
		const sources = view.groups[0].senses.map((s) => s.example?.source);
		expect(sources).toEqual([
			{ kind: 'tatoeba', url: 'https://tatoeba.org/vi/sentences/show/785298' },
			{ kind: 'ai' },
			null
		]);
	});

	it('Given_ExampleIdNotInBundle_When_View_Then_ExampleNull', () => {
		// Act
		const view = wordView(
			word({ hanzi: '好', senses: [{ vi: 'tốt', pos: 'adj', example: 's-missing' }] }),
			[]
		);
		// Assert
		expect(view.groups[0].senses[0].example).toBeNull();
	});
});

describe('loadWord', () => {
	it('Given_FreshCatalog_And_LessonParam_When_Load_Then_View', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		// Act
		const view = (await loadWord(catalog, '你好', 'h1-01')) as WordView;
		// Assert
		expect(view.hanzi).toBe('你好');
		expect(view.pinyin).toBe('nǐ hǎo');
	});

	it('Given_FreshCatalog_NoParam_When_Load_Then_NotFound', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		// Act
		const view = await loadWord(catalog, '你好', null);
		// Assert
		expect(view).toEqual({ notFound: true });
	});

	it('Given_UnknownLesson_When_Load_Then_NotFound', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		// Act
		const view = await loadWord(catalog, '你好', 'h9-99');
		// Assert
		expect(view).toEqual({ notFound: true });
	});

	it('Given_ParamLessonWithoutWord_LoadedEarlier_When_Load_Then_ExamplesResolved', async () => {
		// Arrange
		const catalog = createCatalog(await twoLessonSource());
		await catalog.lesson('h1-01');
		// Act
		const view = (await loadWord(catalog, '你好', 'h1-02')) as WordView;
		// Assert
		expect(view.hanzi).toBe('你好');
		expect(view.groups[0].senses[0].example?.hanzi).toBe('你们好！');
	});

	it('Given_LessonLoadedEarlier_UnknownParam_When_Load_Then_View', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		// Act
		const view = (await loadWord(catalog, '你好', 'h9-99')) as WordView;
		// Assert
		expect(view.hanzi).toBe('你好');
	});

	it('Given_LessonLoadedEarlier_NoParam_When_Load_Then_View', async () => {
		// Arrange
		const catalog = createCatalog(await fixtureSource());
		await catalog.lesson('h1-01');
		// Act
		const view = (await loadWord(catalog, '你好', null)) as WordView;
		// Assert
		expect(view.hanzi).toBe('你好');
		expect(view.groups[0].senses[0].example?.hanzi).toBe('你们好！');
	});

	it('Given_OfflineSource_When_Load_Then_Throws', async () => {
		// Arrange
		const source: CatalogSource = {
			current: async () => 'a'.repeat(64),
			bundle: async (_sha, id) => {
				throw new CatalogError('offline', id);
			}
		};
		// Act
		const e = await failure(loadWord(createCatalog(source), '你好', 'h1-01'));
		// Assert
		expect(e).toBeInstanceOf(CatalogError);
		expect(e.code).toBe('offline');
	});
});
