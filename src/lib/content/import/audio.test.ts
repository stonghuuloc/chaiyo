import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CAST } from '../../audio/cast';
import { addTone, audioKey, audioManifest, sentenceVoice } from './audio';
import type { ImportedContent } from './sink';

type Input = Omit<ImportedContent, 'sha' | 'audio'>;

const sha = (s: string) => createHash('sha256').update(s).digest('hex');

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
	it('keys a recorded cell by sha256(text|voice), unchanged', () => {
		expect(audioKey('你好！', 'redpanda')).toMatch(/^2499c461/);
		expect(audioKey('你好', 'redpanda')).toMatch(/^5c3d5b26/);
	});

	it('hashes the whole Azure request of a styled clip: voice name, style, rate, format', () => {
		expect(audioKey('你好', 'redpanda', 'newscast')).toBe(
			sha('你好|zh-CN-XiaoxiaoNeural/newscast|-20%|audio-48khz-192kbitrate-mono-mp3')
		);
		expect(audioKey('你好', 'takin', 'sad')).toBe(
			sha('你好|zh-CN-YunfengNeural/sad|-20%|audio-48khz-192kbitrate-mono-mp3')
		);
	});

	it('changes every styled key when the cast changes', () => {
		const before = audioKey('你好', 'redpanda', 'newscast');
		const rate = CAST.rate;
		CAST.rate = '-10%';
		try {
			expect(audioKey('你好', 'redpanda', 'newscast')).not.toBe(before);
			expect(audioKey('你好', 'redpanda')).toMatch(/^5c3d5b26/);
		} finally {
			CAST.rate = rate;
		}
	});

	it('puts the clip folder in front of the hash, so the URL is <base>/<folder>/<hash>.mp3', () => {
		expect(audioKey('你好', 'redpanda', 'poetry-reading', 'words')).toBe(
			'words/' + audioKey('你好', 'redpanda', 'poetry-reading')
		);
	});
});

describe('sentenceVoice', () => {
	it('reads a line with no speaker as newscast on redpanda', () =>
		expect(sentenceVoice({})).toEqual({
			voice: 'redpanda',
			style: 'newscast',
			folder: 'examples'
		}));
	it('gives each speaker its default dialogue style', () => {
		expect(sentenceVoice({ speaker: 'redpanda' })).toEqual({
			voice: 'redpanda',
			style: 'chat-casual',
			folder: 'dialogue'
		});
		expect(sentenceVoice({ speaker: 'takin' })).toEqual({
			voice: 'takin',
			style: 'default',
			folder: 'dialogue'
		});
	});
	it('uses the style written on the line', () =>
		expect(sentenceVoice({ speaker: 'takin', style: 'cheerful' })).toEqual({
			voice: 'takin',
			style: 'cheerful',
			folder: 'dialogue'
		}));
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
	it('keys a sentence by its speaker and style, newscast on redpanda when no speaker', () => {
		const m = audioManifest({
			...empty,
			sentences: [sentence('a', '你好！', 'redpanda'), sentence('b', '你好！')]
		});
		expect(m.find((e) => e.ref === 'a')).toEqual({
			key: audioKey('你好！', 'redpanda', 'chat-casual', 'dialogue'),
			kind: 'sentence',
			ref: 'a',
			voice: 'redpanda',
			style: 'chat-casual',
			folder: 'dialogue',
			hanzi: '你好！'
		});
		expect(m.find((e) => e.ref === 'b')).toMatchObject({
			key: audioKey('你好！', 'redpanda', 'newscast', 'examples'),
			voice: 'redpanda',
			style: 'newscast',
			folder: 'examples'
		});
	});

	it('keys a word on redpanda in poetry-reading and splits a word whose id differs from its hanzi', () => {
		const m = audioManifest({
			...empty,
			words: [word('你好', '你好'), word('打', '打'), word('打-da2', '打', 'dá')]
		});
		const byRef = Object.fromEntries(m.map((e) => [e.ref, e]));
		expect(byRef['你好'].key).toBe(audioKey('你好', 'redpanda', 'poetry-reading', 'words'));
		expect(byRef['打'].key).toBe(audioKey('打', 'redpanda', 'poetry-reading', 'words'));
		expect(byRef['打'].split).toBeUndefined();
		expect(byRef['打-da2']).toEqual({
			key: audioKey('打-da2', 'redpanda', 'poetry-reading', 'words'),
			kind: 'word',
			ref: '打-da2',
			voice: 'redpanda',
			style: 'poetry-reading',
			folder: 'words',
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
			expect(e.key).toBe(audioKey(e.ref, 'redpanda'));
			expect(e.style).toBeUndefined();
			expect(e.folder).toBeUndefined();
			expect(e.hanzi).toBe(e.ref);
			expect(e.voice).toBe('redpanda');
		}
	});

	it('reads a multi-syllable Primer chip in poetry-reading, a single syllable with no style', () => {
		const m = audioManifest({ ...empty, lessons: [primer([{ syllables: ['nǐ hǎo', 'mā'] }])] });
		expect(m.find((e) => e.ref === 'nǐ hǎo')).toMatchObject({
			key: audioKey('nǐ hǎo', 'redpanda', 'poetry-reading', 'chips'),
			style: 'poetry-reading',
			folder: 'chips'
		});
		expect(m.find((e) => e.ref === 'mā')).toMatchObject({ key: audioKey('mā', 'redpanda') });
		expect(m.find((e) => e.ref === 'mā')?.style).toBeUndefined();
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
		expect(
			m.filter((e) => e.key === audioKey('你好！', 'redpanda', 'newscast', 'examples'))
		).toEqual([expect.objectContaining({ ref: 's-h1-01-10', kind: 'sentence' })]);
		expect(m.filter((e) => e.hanzi === '谢谢').map((e) => [e.kind, e.style])).toEqual(
			expect.arrayContaining([
				['sentence', 'newscast'],
				['word', 'poetry-reading']
			])
		);
		expect(m.map((e) => e.key)).toEqual([...m.map((e) => e.key)].sort());
	});
});
