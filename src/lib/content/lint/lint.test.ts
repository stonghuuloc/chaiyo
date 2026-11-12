import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixtureRefs } from './fixtures/refs';
import { lint, loadContentDir, type ContentSet, type LintError } from './index';
import { CHECK_NAMES } from './types';
import type { Lesson, Primer } from '../schemas';

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
	it('flags a word hanviet that differs from the char file', () =>
		only(
			run((s) => (word(s, '你好').value.hanviet = 'nễ hảo')),
			1,
			'words/你好.yaml',
			'hanviet'
		));
	it('checks the char that carries an erhua syllable', () => {
		const errors = run((s) => {
			const base = char(s, '你');
			s.chars.push({
				file: 'chars/这.yaml',
				value: { ...base.value, hanzi: '这', readings: [{ pinyin: 'zhè', hanviet: 'giá' }] }
			});
			const w = word(s, '你好');
			s.words.push({
				file: 'words/这儿.yaml',
				value: { ...w.value, id: '这儿', hanzi: '这儿', pinyin: 'zhèr', hanviet: 'chá nhi' }
			});
		}).filter((e) => e.check === 1);
		only(errors, 1, 'words/这儿.yaml', 'hanviet');
	});
	it('matches the char reading by tone, not just letters', () =>
		only(
			run((s) => (word(s, '你好').value.hanviet = 'nhĩ hiếu')),
			1,
			'words/你好.yaml',
			'hanviet'
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

describe('check 8 References', () => {
	const F = 'lessons/hsk1/h1-01.yaml';
	const grammar = (s: ContentSet) => s.grammar[0].value;
	const pool = (s: ContentSet) => lesson(s).gate.pool;

	it('flags an unknown word id in a question', () =>
		only(
			run((s) => pool(s)[0].tests.words!.push('xx')),
			8,
			F,
			'gate.pool[0].tests.words[1]'
		));
	it('flags an unknown sentence id', () =>
		only(
			run((s) => (lesson(s).sections.warmup.extra = ['s-xx'])),
			8,
			F,
			'sections.warmup.extra[0]'
		));
	it('flags an unknown Word senses example', () =>
		only(
			run((s) => (word(s, '你').value.senses[0].example = 's-xx')),
			8,
			'words/你.yaml',
			'senses[0].example'
		));
	it('flags an unknown grammar id', () =>
		only(
			run((s) => lesson(s).sections.grammar.ids.push('h1-gxx')),
			8,
			F,
			'sections.grammar.ids[1]'
		));
	it('flags an unknown Cast id', () =>
		only(
			run((s) => (lesson(s).scene.cast = ['panda', 'nobody'])),
			8,
			F,
			'scene.cast[1]'
		));
	it('flags an unresolved prompt ref', () =>
		only(
			run((s) => {
				const q = pool(s)[0];
				if ('prompt' in q && q.prompt.kind === 'hanzi') q.prompt.ref = 'zz';
			}),
			8,
			F,
			'gate.pool[0].prompt.ref'
		));
	it('flags an unknown readAloud sentence', () =>
		only(
			run((s) => {
				const q = lesson(s).sections.listenSpeak.items[0];
				if (q.type === 'readAloud') q.sentence = 's-xx';
			}),
			8,
			F,
			'sections.listenSpeak.items[0].sentence'
		));
	it('flags a duplicate sentence id', () =>
		only(
			run((s) =>
				s.sentences.push({
					file: 'sentences/a.yaml',
					value: [{ id: 's-h1-01-01', hanzi: '你好', pinyin: 'nǐ hǎo', vi: 'Chào' }]
				})
			),
			8,
			'sentences/a.yaml',
			'[0].id'
		));
	it('flags 7 words, dropping 你, 你好 and 再见', () =>
		only(
			run((s) => {
				const l = lesson(s);
				l.sections.words.ids = l.sections.words.ids.filter(
					(id) => !['你', '你好', '再见'].includes(id)
				);
				for (const i of [6, 18])
					l.sentences[i].unknown = [{ hanzi: '再见', pinyin: 'zàijiàn', vi: 'Tạm biệt' }];
			}),
			8,
			F,
			'sections.words.ids'
		));
	it('flags 16 words', () =>
		only(
			run((s) => {
				const base = word(s, '你');
				['朋友', '学校', '老师', '学生', '水果', '工作'].forEach((id) => {
					s.words.push({
						file: `words/${id}.yaml`,
						value: { ...structuredClone(base.value), id, hanzi: id }
					});
					lesson(s).sections.words.ids.push(id);
					pool(s)[0].tests.words!.push(id);
				});
			}),
			8,
			F,
			'sections.words.ids'
		));
	it('flags a pool of 19 against draw 10', () =>
		only(
			run((s) => pool(s).splice(1, 1)),
			8,
			F,
			'gate.pool'
		));
	it('flags a word no pool question tests', () =>
		only(
			run((s) =>
				pool(s).forEach((q) => (q.tests.words = q.tests.words!.filter((w) => w !== '再见')))
			),
			8,
			F,
			'sections.words.ids[9]'
		));
	it('flags a single char beside its compound that is never taught alone', () =>
		only(
			run((s) => {
				grammar(s).pattern = '你 / 您 / 你们';
				lesson(s).sections.listenSpeak.items[0].tests.words = [];
			}),
			8,
			F,
			'sections.words.ids[1]'
		));

	it('flags a std item above the lesson level', () =>
		only(
			run((s) => (grammar(s).std = [1, 277])),
			8,
			'grammar/h1-g01.yaml',
			'std[1]'
		));
	it('flags a std item missing from the CSV', () =>
		only(
			run((s) => (grammar(s).std = [1, 9999])),
			8,
			'grammar/h1-g01.yaml',
			'std[1]'
		));
	it('flags a lesson with no std item at its level', () =>
		only(
			run((s) => (lesson(s).level = 2)),
			8,
			F,
			'sections.grammar.ids'
		));
	it('flags a lesson whose grammar points are all std: []', () =>
		only(
			run((s) => (grammar(s).std = [])),
			8,
			F,
			'sections.grammar.ids'
		));
	it('flags a lesson with more than 3 grammar points', () => {
		const errors = run((s) => (lesson(s).sections.grammar.ids = Array(4).fill('h1-g01')));
		only(errors, 8, F, 'sections.grammar.ids');
		expect(errors[0].message).toContain('4 grammar points');
	});
	it('flags a grammar point tested by fewer than 2 gate pool questions', () => {
		const errors = run((s) => {
			const q = pool(s).find((x) => x.tests.grammar?.length)!;
			q.tests.grammar = [];
		});
		only(errors, 8, F, 'sections.grammar.ids[0]');
		expect(errors[0].message).toContain('1 gate pool questions');
	});
	it('flags a grammar point no dialogue or listenSpeak question uses', () => {
		const errors = run((s) =>
			[...lesson(s).sections.dialogue.questions, ...lesson(s).sections.listenSpeak.items].forEach(
				(q) => (q.tests.grammar = [])
			)
		);
		only(errors, 8, F, 'sections.grammar.ids[0]');
		expect(errors[0].message).toContain('dialogue or listenSpeak');
	});
});

describe('check 9 Audio', () => {
	const F = 'lessons/hsk1/h1-01.yaml';
	it('flags a speaker that is not a speaking voice', () =>
		only(
			run((s) => (lesson(s).sentences[7].speaker = 'panda')),
			9,
			F,
			'sentences[7].speaker'
		));
	it('flags a dialogue line without a speaker', () =>
		only(
			run((s) => delete lesson(s).sentences[2].speaker),
			9,
			F,
			'sections.dialogue.parts[0].lines[2]'
		));
	it('flags a part where every line is one voice', () =>
		only(
			run((s) => (lesson(s).sentences[4].speaker = 'takin')),
			9,
			F,
			'sections.dialogue.parts[1]'
		));
	it('allows back-to-back lines from one voice', () => expect(run(() => {})).toEqual([]));
	it('allows a style the speaking voice has', () =>
		expect(
			run((s) => {
				lesson(s).sentences[0].style = 'cheerful';
				lesson(s).sentences[1].style = 'serious';
			})
		).toEqual([]));
	it('flags a style the speaking voice does not have', () =>
		only(
			run((s) => (lesson(s).sentences[1].style = 'chat-casual')),
			9,
			F,
			'sentences[1].style'
		));
	it('flags a style on a line with no speaker', () =>
		only(
			run((s) => (lesson(s).sentences[7].style = 'cheerful')),
			9,
			F,
			'sentences[7].style'
		));
	it('ignores a reading line without a speaker', () =>
		expect(
			run((s) => (lesson(s).sections.reading = { title: 'Đọc', lines: ['s-h1-01-08'] }))
		).toEqual([]));
	it('flags a bad speaker on a dialogue line that comes from a sentence file', () =>
		only(
			run((s) => {
				s.sentences.push({
					file: 'sentences/a.yaml',
					value: [{ id: 's-x', hanzi: '你好', pinyin: 'nǐ hǎo', vi: 'Chào', speaker: 'panda' }]
				});
				lesson(s).sections.dialogue.parts[0].lines[2] = 's-x';
			}),
			9,
			F,
			'sections.dialogue.parts[0].lines[2]'
		));
	it('skips a line id that does not resolve; check 8 reports it', () =>
		only(
			run((s) => (lesson(s).sections.dialogue.parts[0].lines[2] = 's-xx')),
			8,
			F,
			'sections.dialogue.parts[0].lines[2]'
		));
});

describe('primer', () => {
	const primerSet = loadContentDir(join(__dirname, 'fixtures/primer')).set;
	const withPrimer = (mutate: (p: Primer) => void) =>
		run((s) => {
			const p = structuredClone(primerSet.lessons[0].value) as Primer;
			mutate(p);
			s.lessons.push({ file: 'lessons/hsk1/h0-00.yaml', value: p });
		});
	const P = 'lessons/hsk1/h0-00.yaml';

	it('clean set plus primer has no errors', () => expect(withPrimer(() => {})).toEqual([]));
	it('flags a syllable that is not a row of syllables.yaml', () =>
		only(
			withPrimer((p) => (p.sections.finals.cards[0].syllables[1] = 'xyz')),
			8,
			P,
			'sections.finals.cards[0].syllables[1]'
		));
	it('flags a pairs object chip by its say', () =>
		only(
			withPrimer((p) => (p.sections.tones.cards[0].pairs![0][0] = { say: 'xyz' })),
			8,
			P,
			'sections.tones.cards[0].pairs[0][0].say'
		));
	it('flags a section with no drill', () =>
		only(
			withPrimer((p) => (p.sections.tones.drills = [])),
			8,
			P,
			'sections.tones.drills'
		));
	it('flags a pool of 9 against draw 5', () =>
		only(
			withPrimer((p) => p.gate.pool.splice(1, 1)),
			8,
			P,
			'gate.pool'
		));
	it('flags a pool question without section', () =>
		only(
			withPrimer((p) => delete p.gate.pool[0].section),
			8,
			P,
			'gate.pool[0].section'
		));
	it('does not run the glyph check on a primer', () =>
		expect(withPrimer((p) => (p.sections.sandhi.cards[0].explain = '⾒'))).toEqual([]));
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
