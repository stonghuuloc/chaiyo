import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixtureRefs } from './fixtures/refs';
import { lint, loadContentDir, type ContentSet, type LintError } from './index';
import { CHECK_NAMES } from './types';
import type { Lesson } from '../schemas';

const { set: cleanSet } = loadContentDir(join(__dirname, 'fixtures/clean'));

const run = (mutate: (set: ContentSet) => void): LintError[] => {
	const set = structuredClone(cleanSet);
	mutate(set);
	return lint(set, fixtureRefs);
};
const lesson = (set: ContentSet) => set.lessons[0].value as Lesson;
const word = (set: ContentSet, id: string) => set.words.find((w) => w.value.id === id)!;
const char = (set: ContentSet, c: string) => set.chars.find((x) => x.value.hanzi === c)!;

const only = (errors: LintError[], check: number, file: string, path: string) => {
	expect(errors).toHaveLength(1);
	expect(errors[0]).toMatchObject({ check, name: CHECK_NAMES[check as 1], file, path });
};

describe('clean set', () => {
	it('has no errors', () => expect(run(() => {})).toEqual([]));
});

describe('check 1 Hán Việt', () => {
	it('flags a dash hanviet', () =>
		only(
			run((s) => (char(s, '你').value.readings[0].hanviet = '—')),
			1,
			'chars/你.yaml',
			'readings[0].hanviet'
		));
	it('flags an empty hanviet', () =>
		only(
			run((s) => (char(s, '们').value.readings[0].hanviet = ' ')),
			1,
			'chars/们.yaml',
			'readings[0].hanviet'
		));
});

describe('check 2 Polyphones', () => {
	it('flags a char missing a listed reading', () => {
		const errors = run((s) => (char(s, '好').value.readings = [{ pinyin: 'hǎo', hanviet: 'hảo' }]));
		only(errors, 2, 'chars/好.yaml', 'readings');
		expect(errors[0].message).toContain('hào');
	});
	it('accepts extra readings', () =>
		expect(run((s) => char(s, '好').value.readings.push({ pinyin: 'hāo', hanviet: 'x' }))).toEqual(
			[]
		));
});

describe('check 4 Sandhi', () => {
	it('flags a spoken that differs from the derived sandhi', () =>
		only(
			run((s) => (lesson(s).sentences[5].spoken = 'bù kèqi')),
			4,
			'lessons/hsk1/h1-01.yaml',
			'sentences[5].spoken'
		));
	it('flags a bad spoken in a sentence file', () => {
		const errors = run((s) =>
			s.sentences.push({
				file: 'sentences/a.yaml',
				value: [{ id: 's-x', hanzi: '不客气。', pinyin: 'bù kèqi', spoken: 'bù kèqi', vi: 'x' }]
			})
		);
		only(errors, 4, 'sentences/a.yaml', '[0].spoken');
	});
	it('ignores a sentence without spoken', () =>
		expect(
			run((s) => {
				delete lesson(s).sentences[5].spoken;
			})
		).toEqual([]));
});

describe('check 5 80% known chars', () => {
	const withUnknown = (unknown?: { hanzi: string; pinyin: string; vi: string }[]) =>
		run((s) => {
			const sentence = lesson(s).sentences[9];
			sentence.hanzi = '我好！';
			if (unknown) sentence.unknown = unknown;
		});
	it('flags a char no taught word has', () =>
		only(withUnknown(), 5, 'lessons/hsk1/h1-01.yaml', 'sentences[9].hanzi'));
	it('allows a char listed in unknown', () =>
		expect(withUnknown([{ hanzi: '我', pinyin: 'wǒ', vi: 'tôi' }])).toEqual([]));
	const extra = (order: number) =>
		run((s) => {
			const base = lesson(s);
			s.lessons.push({
				file: 'lessons/hsk1/h1-02.yaml',
				value: {
					...structuredClone(base),
					id: 'h1-02',
					order,
					sections: { ...structuredClone(base.sections), words: { ids: [] } },
					sentences: [{ id: 's-h1-02-01', hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Chào' }]
				}
			});
		}).filter((e) => e.check === 5);
	it('counts words of earlier lessons as known', () => expect(extra(2)).toEqual([]));
	it('does not count words of later lessons', () => expect(extra(0)).toHaveLength(1));
});

describe('check 6 Real glyphs', () => {
	it('flags a Kangxi radical code point', () => {
		const errors = run((s) => (word(s, '你').value.senses[0].vi = '⾒ bạn'));
		only(errors, 6, 'words/你.yaml', 'senses[0].vi');
		expect(errors[0].message).toContain('U+2F92');
	});
});

describe('check 7 Mnemonic reuse', () => {
	it('flags a field that differs from the vault', () =>
		only(
			run((s) => (char(s, '你').value.mnemonic!.am = 'khác')),
			7,
			'chars/你.yaml',
			'mnemonic.am'
		));
	it('ignores trailing whitespace', () =>
		expect(run((s) => (char(s, '你').value.mnemonic!.am += ' '))).toEqual([]));
	it('ignores a char the vault does not have', () => {
		const set = structuredClone(cleanSet);
		char(set, '你').value.mnemonic!.am = 'khác';
		expect(lint(set, { ...fixtureRefs, mnemonics: new Map() })).toEqual([]);
	});
	it('is skipped when the vault is undefined', () => {
		const set = structuredClone(cleanSet);
		char(set, '你').value.mnemonic!.am = 'khác';
		expect(lint(set, { ...fixtureRefs, mnemonics: undefined })).toEqual([]);
	});
});

describe('check 3 Tone marks', () => {
	const sentencePinyin = (value: string) => run((s) => (lesson(s).sentences[0].pinyin = value));
	it('flags an unmarked sentence pinyin', () =>
		only(sentencePinyin('ni hao'), 3, 'lessons/hsk1/h1-01.yaml', 'sentences[0].pinyin'));
	it('flags a digit in a word pinyin', () =>
		only(
			run((s) => (word(s, '你好').value.pinyin = 'nǐ hao3')),
			3,
			'words/你好.yaml',
			'pinyin'
		));
	it('passes a whole-string neutral entry', () => expect(sentencePinyin('qi lai')).toEqual([]));
	it('flags a bare syllable outside the neutral list', () =>
		only(sentencePinyin('ni'), 3, 'lessons/hsk1/h1-01.yaml', 'sentences[0].pinyin'));
	it('keeps the neutral 们 reading clean', () =>
		expect(char(cleanSet, '们').value.readings[0].pinyin).toBe('men'));
	it('flags a bad part pinyin', () =>
		only(
			run((s) => (word(s, '不客气').value.parts![0].pinyin = 'bu')),
			3,
			'words/不客气.yaml',
			'parts[0].pinyin'
		));
	it('scans content/sentences files', () => {
		const errors = run((s) =>
			s.sentences.push({
				file: 'sentences/a.yaml',
				value: [{ id: 's-x', hanzi: '你好', pinyin: 'ni hao', vi: 'Chào' }]
			})
		);
		only(errors, 3, 'sentences/a.yaml', '[0].pinyin');
	});
});
