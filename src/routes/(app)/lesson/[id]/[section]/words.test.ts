import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCatalog, type LessonContent } from '#lib/catalog/index.js';
import { buildBundle } from '#lib/content/import/bundle.js';
import { importContent } from '#lib/content/import/import.js';
import { scopeFor, PRODUCTION_ROOTS } from '#lib/content/import/scope.js';
import { createMemorySink, type ImportedWord } from '#lib/content/import/sink.js';
import { Lesson, Word, type Primer } from '#lib/content/schemas.js';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger } from '#lib/ledger/index.js';
import { toAttempt } from '#lib/lesson/attempt.js';
import type { LessonStep } from '#lib/lesson/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { wordSteps } from './words';

const word = (id: string, over: Partial<Word> = {}): ImportedWord => ({
	...Word.parse({
		id,
		hanzi: id,
		pinyin: `p-${id}`,
		level: 1,
		pos: ['n'],
		senses: [{ vi: `vi-${id}` }],
		examples: [],
		...over
	}),
	listedIn: ['h1-99'],
	audio: `word/${id}`
});

const content = (ids: string[], words = ids.map((id) => word(id))): LessonContent => ({
	contentSha: 'sha-1',
	lesson: Lesson.parse({
		id: 'h1-99',
		level: 1,
		topic: 't',
		order: 1,
		title: 'T',
		titleHanzi: '你',
		goal: 'g',
		scene: { file: 's.webp', cast: ['takin'], prompt: 'p' },
		sentences: [],
		sections: {
			warmup: {},
			words: { ids },
			grammar: { ids: [], drills: [] },
			dialogue: { parts: [], questions: [] },
			listenSpeak: { items: [] },
			writing: { chars: [] }
		},
		gate: { pool: [], draw: 0 }
	}),
	words,
	chars: [],
	sentences: [
		{ id: 's1', hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Xin chào!', seg: ['你好'] },
		{ id: 's2', hanzi: '你们好！', pinyin: 'nǐmen hǎo', vi: 'Chào các bạn!', seg: ['你们'] },
		{ id: 's3', hanzi: '好。', pinyin: 'hǎo', vi: 'Tốt.', seg: ['好'] }
	],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
});

const kinds = (steps: LessonStep[]) => steps.map((s) => `${s.kind}:${s.id}`);

describe('wordSteps', () => {
	it('Given_FiveWords_When_Build_Then_CardsInOrderWithCheckAfterEveryThirdAndLast', () => {
		// Arrange
		const c = content(['a', 'b', 'c', 'd', 'e']);

		// Act
		const steps = wordSteps(c);

		// Assert
		expect(kinds(steps)).toEqual([
			'word:a',
			'word:b',
			'word:c',
			'choice:chk-c',
			'word:d',
			'word:e',
			'choice:chk-e'
		]);
	});

	it('Given_Word_When_Build_Then_CardCarriesContentFields', () => {
		// Arrange
		const c = content(
			['你好', '你'],
			[
				word('你好', {
					pinyin: 'nǐ hǎo',
					hanviet: 'nhĩ hảo',
					senses: [{ vi: 'xin chào' }, { vi: 'chào' }],
					examples: ['s1', 'missing', 's2', 's3'],
					parts: [
						{ hanzi: '你', pinyin: 'nǐ', hanviet: 'nhĩ', vi: 'bạn' },
						{ hanzi: '好', pinyin: 'hǎo', hanviet: 'hảo', vi: 'tốt' }
					]
				}),
				word('你', {
					components: [{ hanzi: '亻', name: 'nhân đứng', vi: 'người' }]
				})
			]
		);

		// Act
		const [first, second] = wordSteps(c);

		// Assert
		expect(first).toEqual({
			kind: 'word',
			id: '你好',
			hanzi: '你好',
			pinyin: 'nǐ hǎo',
			hanviet: 'nhĩ hảo',
			meaning: 'xin chào',
			audio: 'word/你好',
			parts: [
				{ hanzi: '你', pinyin: 'nǐ', hanviet: 'nhĩ' },
				{ hanzi: '好', pinyin: 'hǎo', hanviet: 'hảo' }
			],
			components: [],
			examples: [
				{ hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Xin chào!' },
				{ hanzi: '你们好！', pinyin: 'nǐmen hǎo', vi: 'Chào các bạn!' }
			]
		});
		expect(second).toMatchObject({ parts: [], components: ['亻 nhân đứng · người'] });
	});

	it('Given_Group_When_Build_Then_CheckIsListenChoiceWithFourDistinctOptions', () => {
		// Arrange
		const c = content(['a', 'b', 'c', 'd', 'e', 'f']);

		// Act
		const check = wordSteps(c, () => 0.5).find((s) => s.id === 'chk-c');

		// Assert
		expect(check).toMatchObject({
			kind: 'choice',
			ask: m.listen_word_ask(),
			title: m.words_check(),
			answer: 'c',
			audio: 'word/c',
			script: 'hanzi',
			card: { word: 'c', skill: 'nghe' }
		});
		const options = check?.kind === 'choice' ? check.options : [];
		expect(options).toHaveLength(4);
		expect(new Set(options).size).toBe(4);
		expect(options).toContain('c');
	});

	it('Given_TwoWords_When_Build_Then_CheckHasOnlyTwoOptions', () => {
		// Arrange
		const c = content(['a', 'b']);

		// Act
		const check = wordSteps(c).at(-1);

		// Assert
		expect(check?.kind === 'choice' ? [...check.options].sort() : []).toEqual(['a', 'b']);
	});

	it('Given_GroupWithoutClips_When_Build_Then_NoCheck', () => {
		// Arrange
		const c = content(
			['a', 'b'],
			[
				{ ...word('a'), audio: undefined },
				{ ...word('b'), audio: undefined }
			]
		);

		// Act
		const steps = wordSteps(c);

		// Assert
		expect(kinds(steps)).toEqual(['word:a', 'word:b']);
	});

	it('Given_LastWordHasNoClip_When_Build_Then_CheckUsesAnotherWordOfTheGroup', () => {
		// Arrange
		const c = content(['a', 'b'], [word('a'), { ...word('b'), audio: undefined }]);

		// Act
		const steps = wordSteps(c);

		// Assert
		expect(kinds(steps)).toEqual(['word:a', 'word:b', 'choice:chk-a']);
	});

	it('Given_IdMissingFromWords_When_Build_Then_Skipped', () => {
		// Arrange
		const c = content(['a', 'ghost'], [word('a')]);

		// Act
		const steps = wordSteps(c);

		// Assert
		expect(kinds(steps)).toEqual(['word:a', 'choice:chk-a']);
	});

	it('Given_Primer_When_Build_Then_NoSteps', () => {
		// Arrange
		const primer = { kind: 'primer', id: 'h0-00', level: 1 } as unknown as Primer;
		const c: LessonContent = { ...content([]), lesson: primer };

		// Act
		const steps = wordSteps(c);

		// Assert
		expect(steps).toEqual([]);
	});
});

describe('wordSteps on Bài 1', () => {
	const build = async (): Promise<LessonContent> => {
		const prev = process.env.CHAIYO_VAULT;
		process.env.CHAIYO_VAULT = join(tmpdir(), 'no-such-vault');
		try {
			const sink = createMemorySink();
			const r = await importContent('content', sink, {
				only: scopeFor('content', PRODUCTION_ROOTS)
			});
			if (!('sha' in r)) throw new Error(JSON.stringify(r.errors, null, 2));
			if (!sink.content) throw new Error('import wrote no content');
			const b = buildBundle(sink.content, 'h1-01');
			return createCatalog({ current: async () => b.sha, bundle: async () => b }).lesson('h1-01');
		} finally {
			if (prev === undefined) delete process.env.CHAIYO_VAULT;
			else process.env.CHAIYO_VAULT = prev;
		}
	};

	it('Given_H1_01_When_FinishEveryCard_Then_TenWordsInLexicon', { timeout: 30_000 }, async () => {
		// Arrange
		const c = await build();
		const steps = wordSteps(c);
		const cards = steps.filter((s) => s.kind === 'word');
		globalThis.indexedDB = new IDBFactory();
		const ledger = await openLedger({
			initial: initialState({ curriculum: CURRICULUM }),
			store: memoryStore(),
			db: 'words-test'
		});
		const ctx = { lesson: 'h1-01', section: 'words', contentSha: c.contentSha, run: 'r1' };

		// Act
		for (const s of cards)
			await ledger.record(
				toAttempt(
					{
						questionId: s.id,
						pick: 'seen',
						correct: true,
						ms: 1,
						card: { word: s.id, skill: 'the' }
					},
					s.id,
					{ ...ctx, of: steps.length },
					{ id: `a-${s.id}`, at: '2026-11-22T00:00:00.000Z' }
				)
			);

		// Assert
		expect(cards.map((s) => s.id)).toEqual(
			'words' in c.lesson.sections ? c.lesson.sections.words.ids : []
		);
		expect(cards[0]).toMatchObject({ hanzi: '你', pinyin: 'nǐ', hanviet: 'nhĩ' });
		expect(Object.keys(ledger.state().lexicon).sort()).toEqual(cards.map((s) => s.id).sort());
		expect(steps.filter((s) => s.kind === 'choice').length).toBeLessThanOrEqual(4);
	});
});
