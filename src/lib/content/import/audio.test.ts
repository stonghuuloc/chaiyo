import { describe, expect, it } from 'vitest';
import { addTone, audioKey, audioManifest } from './audio';
import type { ImportedContent } from './sink';

type Input = Omit<ImportedContent, 'sha' | 'audio'>;

const sentence = (id: string, hanzi: string, speaker?: string) => ({
	id,
	hanzi,
	pinyin: '',
	vi: '',
	spoken: '',
	seg: [],
	...(speaker ? { speaker } : {})
});

const word = (id: string, hanzi: string, spoken = '') =>
	({
		id,
		hanzi,
		pinyin: '',
		spoken,
		hanviet: '',
		level: 1,
		pos: [],
		senses: [],
		examples: [],
		listedIn: []
	}) as unknown as Input['words'][number];

const empty: Input = {
	lessons: [],
	words: [],
	sentences: [],
	chars: [],
	grammar: [],
	questions: [],
	syllables: []
};

const primer = (cards: { syllables: unknown[]; pairs?: unknown[] }[]) =>
	({
		kind: 'primer',
		id: 'h0-00',
		sections: Object.fromEntries(
			['tones', 'finals', 'initials', 'spelling', 'sandhi'].map((s, i) => [
				s,
				{ cards: i === 0 ? cards : [], drills: [] }
			])
		)
	}) as unknown as Input['lessons'][number];

describe('audioKey', () => {
	it('is sha256(text|voice)', () => {
		expect(audioKey('你好！', 'redpanda')).toMatch(/^2499c461/);
		expect(audioKey('你好', 'narrator')).toMatch(/^a8c34d15/);
	});
});

describe('addTone', () => {
	it.each([
		['ma', 'mā má mǎ mà'],
		['lü', 'lǖ lǘ lǚ lǜ'],
		['hou', 'hōu hóu hǒu hòu'],
		['liu', 'liū liú liǔ liù'],
		['gui', 'guī guí guǐ guì'],
		['bei', 'bēi béi běi bèi'],
		['ni', 'nī ní nǐ nì']
	])('marks %s', (s, marks) => {
		expect([1, 2, 3, 4].map((t) => addTone(s, t)).join(' ')).toBe(marks);
	});
});

describe('audioManifest', () => {
	it('keys a sentence by its speaker, narrator when none', () => {
		const m = audioManifest({
			...empty,
			sentences: [sentence('a', '你好！', 'redpanda'), sentence('b', '谢谢')]
		});
		expect(m.find((e) => e.ref === 'a')).toEqual({
			key: audioKey('你好！', 'redpanda'),
			kind: 'sentence',
			ref: 'a',
			voice: 'redpanda',
			hanzi: '你好！'
		});
		expect(m.find((e) => e.ref === 'b')?.voice).toBe('narrator');
	});

	it('keys a word on narrator and splits a word whose id differs from its hanzi', () => {
		const m = audioManifest({
			...empty,
			words: [word('你好', '你好'), word('打', '打'), word('打-da2', '打', 'dá')]
		});
		const byRef = Object.fromEntries(m.map((e) => [e.ref, e]));
		expect(byRef['你好'].key).toMatch(/^a8c34d15/);
		expect(byRef['打'].key).toBe(audioKey('打', 'narrator'));
		expect(byRef['打'].split).toBeUndefined();
		expect(byRef['打-da2']).toEqual({
			key: audioKey('打-da2', 'narrator'),
			kind: 'word',
			ref: '打-da2',
			voice: 'narrator',
			hanzi: '打',
			reading: 'dá',
			split: true
		});
	});

	it('adds the syllable table x 4 tones, Primer cards and syllable prompts, deduped', () => {
		const m = audioManifest({
			...empty,
			syllables: [{ syllable: 'ma', initial: 'm', final: 'a' }],
			lessons: [
				primer([
					{ syllables: ['mā', 'ma', { say: 'ā', label: 'a' }], pairs: [['má', { say: 'mǎ' }]] }
				])
			],
			questions: [
				{
					id: 'q1',
					lessonId: 'h0-00',
					role: 'drill',
					body: {
						id: 'q1',
						type: 'tone',
						prompt: { kind: 'syllable', text: 'mā', spoken: 'mà' },
						syllable: 0,
						answer: 1,
						tests: {}
					}
				}
			]
		});
		const syl = m.filter((e) => e.kind === 'syllable').map((e) => e.ref);
		expect(syl.sort()).toEqual(['ma', 'mà', 'má', 'mā', 'mǎ', 'ā'].sort());
		for (const e of m.filter((e) => e.kind === 'syllable')) {
			expect(e.key).toBe(audioKey(e.ref, 'narrator'));
			expect(e.hanzi).toBe(e.ref);
			expect(e.voice).toBe('narrator');
		}
	});

	it('dedupes by key keeping the smallest kind then ref, sorted by key', () => {
		const m = audioManifest({
			...empty,
			sentences: [
				sentence('s-w-1', '你好！'),
				sentence('s-h1-01-11', '你好！'),
				sentence('s-h1-01-10', '你好！'),
				sentence('z', '谢谢')
			],
			words: [word('谢谢', '谢谢')]
		});
		expect(m.filter((e) => e.key === audioKey('你好！', 'narrator'))).toEqual([
			expect.objectContaining({ ref: 's-h1-01-10', kind: 'sentence' })
		]);
		expect(m.filter((e) => e.hanzi === '谢谢')).toEqual([
			expect.objectContaining({ kind: 'sentence', ref: 'z' })
		]);
		expect(m.map((e) => e.key)).toEqual([...m.map((e) => e.key)].sort());
	});
});
