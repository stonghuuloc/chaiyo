import { describe, expect, it } from 'vitest';
import type { Char, GrammarPoint, Lesson, Question, Word } from '../schemas';
import type { ThinEntry } from './dictionary';
import { bundleHanzi, lessonWordEntries, thinEntries } from './thin';

const entry = (hanzi: string, pinyin = '', hanviet = '', meaning = ''): ThinEntry => ({
	hanzi,
	pinyin,
	hanviet,
	meaning
});
const dictOf = (...words: string[]) => new Map(words.map((w) => [w, entry(w, `d-${w}`)]));
const noLesson = new Map<string, ThinEntry>();

const q = (extra: Record<string, unknown>) =>
	({ id: 'q', tests: {}, ...extra }) as unknown as Question;

const lesson = (parts: {
	drills?: Question[];
	questions?: Question[];
	items?: Question[];
	pool?: Question[];
}) =>
	({
		titleHanzi: '你好',
		sentences: [],
		sections: {
			grammar: { ids: [], drills: parts.drills ?? [] },
			dialogue: { parts: [], questions: parts.questions ?? [] },
			listenSpeak: { items: parts.items ?? [] }
		},
		gate: { pool: parts.pool ?? [], draw: 0 }
	}) as unknown as Lesson;

const grammar = [
	{
		title: '问候',
		pattern: '你 / 您 / 你们 + 好',
		explain: 'Chào: 你好 là xin chào',
		pitfalls: [{ wrong: '好你', right: '你好' }]
	}
] as unknown as GrammarPoint[];

describe('bundleHanzi', () => {
	const sentences = [{ seg: ['你们', '好', '！'] }, { seg: ['谢谢', '！'] }];

	it('walks seg tokens, hanzi options, tiles, fill options, pattern, pitfalls and title', () => {
		const l = lesson({
			drills: [
				q({ type: 'choice', optionKind: 'hanzi', options: ['你好', '您好'] }),
				q({ type: 'choice', optionKind: 'vi', options: ['xin chào', 'tạm biệt'] }),
				q({ type: 'order', tiles: ['们', '你', '好'] }),
				q({ type: 'fill', options: ['您', '你们'] }),
				q({ type: 'trueFalse', statement: '不是汉字' })
			]
		});
		expect(bundleHanzi(l, grammar, sentences)).toEqual([
			'你们',
			'好',
			'！',
			'谢谢',
			'！',
			'你好',
			'您好',
			'们',
			'你',
			'好',
			'您',
			'你们',
			'问候',
			'你 / 您 / 你们 + 好',
			'Chào: 你好 là xin chào',
			'好你',
			'你好',
			'你好'
		]);
	});

	it('reads questions from dialogue, listenSpeak and the gate pool too', () => {
		const l = lesson({
			questions: [q({ type: 'order', tiles: ['A'] })],
			items: [q({ type: 'fill', options: ['B'] })],
			pool: [q({ type: 'choice', optionKind: 'hanzi', options: ['C'] })]
		});
		expect(bundleHanzi(l, [], [])).toEqual(['A', 'B', 'C', '你好']);
	});
});

describe('thinEntries', () => {
	const dict = dictOf('你们', '你', '们', '好', '谢谢', '谢', '您', '你好');
	const texts = [
		'你们',
		'好',
		'！',
		'谢谢',
		'！',
		'你好',
		'您好',
		'们',
		'你',
		'好',
		'您',
		'你们',
		'你 / 您 / 你们 + 好',
		'好你',
		'你好',
		'你好'
	];

	it('returns word and char entries, sorted, without duplicates', () => {
		const result = thinEntries(texts, { lessonEntries: noLesson, dict });
		expect(result.map((e) => e.hanzi)).toEqual([
			'们',
			'你',
			'你们',
			'你好',
			'好',
			'您',
			'谢',
			'谢谢'
		]);
	});

	it('prefers a lesson word entry over the dictionary row', () => {
		const lessonEntries = new Map([['你好', entry('你好', 'nǐ hǎo', 'nhĩ hảo', 'xin chào')]]);
		const hit = thinEntries(['你好'], { lessonEntries, dict }).find((e) => e.hanzi === '你好');
		expect(hit).toEqual(entry('你好', 'nǐ hǎo', 'nhĩ hảo', 'xin chào'));
	});

	it('gives a word that appears only in a grammar explain an entry', () => {
		const d = dictOf('刻', '点');
		const g = [
			{ title: '点', pattern: '', explain: 'một 刻 là 15 phút' }
		] as unknown as GrammarPoint[];
		const strings = bundleHanzi(lesson({}), g, []);
		expect(thinEntries(strings, { lessonEntries: noLesson, dict: d }).map((e) => e.hanzi)).toEqual([
			'刻',
			'点'
		]);
	});

	it('adds nothing for a token with no row', () => {
		expect(thinEntries(['熊'], { lessonEntries: noLesson, dict })).toEqual([]);
	});

	it('builds an entry for a shipped seg token that re-segmenting the sentence would cut', () => {
		const d = dictOf('二', '十', '分', '钟', '十分', '分钟');
		const lessonEntries = new Map([['分钟', entry('分钟', 'fēnzhōng')]]);
		const strings = bundleHanzi(lesson({}), [], [{ seg: ['二', '十分', '钟'] }]);
		const result = thinEntries(strings, { lessonEntries, dict: d });
		expect(result.map((e) => e.hanzi)).toEqual(['二', '分', '十', '十分', '钟']);
	});
});

describe('lessonWordEntries', () => {
	const ch = (hanzi: string, pinyin: string, hanviet: string) =>
		({ hanzi, readings: [{ pinyin, hanviet }] }) as unknown as Char;
	const chars = { 你: ch('你', 'nǐ', 'nhĩ'), 们: ch('们', 'men', 'môn') };
	const word = (id: string, hanzi: string, pinyin: string, extra: Record<string, unknown> = {}) =>
		({
			id,
			hanzi,
			pinyin,
			senses: [{ vi: 'các bạn' }, { vi: 'khác' }],
			...extra
		}) as unknown as Word;
	const withIds = (...ids: string[]) => ({ sections: { words: { ids } } }) as unknown as Lesson;

	it('derives hanviet from chars and takes the first sense', () => {
		const words = new Map([['你们', word('你们', '你们', 'nǐmen')]]);
		const result = lessonWordEntries(withIds('你们'), words, chars);
		expect(result.get('你们')).toEqual(entry('你们', 'nǐmen', 'nhĩ môn', 'các bạn'));
	});

	it('lets an authored hanviet win', () => {
		const words = new Map([['你们', word('你们', '你们', 'nǐmen', { hanviet: 'x' })]]);
		expect(lessonWordEntries(withIds('你们'), words, chars).get('你们')?.hanviet).toBe('x');
	});

	it('leaves hanviet blank when chars are missing', () => {
		const words = new Map([['你们', word('你们', '你们', 'nǐmen')]]);
		expect(lessonWordEntries(withIds('你们'), words, {}).get('你们')?.hanviet).toBe('');
	});

	it('skips an id with no Word', () => {
		expect(lessonWordEntries(withIds('nope'), new Map(), chars).size).toBe(0);
	});

	it('keeps the first of a polyphone pair', () => {
		const words = new Map([
			['行-hang', word('行-hang', '行', 'háng', { hanviet: 'hàng' })],
			['行-xing', word('行-xing', '行', 'xíng', { hanviet: 'hành' })]
		]);
		const result = lessonWordEntries(withIds('行-hang', '行-xing'), words, chars);
		expect(result.size).toBe(1);
		expect(result.get('行')?.pinyin).toBe('háng');
	});
});
