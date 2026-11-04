import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { parseContent } from './parse';
import type { ContentType } from './schemas';

const cases: [ContentType, string, string][] = [
	['Lesson', 'lesson', 'level'],
	['Word', 'word', 'level'],
	['Char', 'char', 'strokes'],
	['Sentence', 'sentence', 'hanzi'],
	['Sentences', 'sentences', '[0].source'],
	['GrammarPoint', 'grammar-point', 'std'],
	['Question', 'question', 'answer'],
	['Primer', 'primer', 'kind'],
	['Syllables', 'syllables', '[0].initial']
];

const read = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe.each(cases)('%s', (type, slug, wrongPath) => {
	it('parses the valid fixture and returns the typed object', () => {
		const text = read(`${slug}.valid.yaml`);
		const result = parseContent(type, `${slug}.valid.yaml`, text);
		expect(result).toEqual({ ok: true, value: YAML.parse(text) });
	});

	it('returns an error list with file and field path for the invalid fixture', () => {
		const file = `${slug}.invalid.yaml`;
		const result = parseContent(type, file, read(file));
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0].file).toBe(file);
		expect(result.errors[0].path).toBe(wrongPath);
	});
});

const primer = () => YAML.parse(read('primer.valid.yaml'));
const question = () => YAML.parse(read('question.valid.yaml'));
const word = () => YAML.parse(read('word.valid.yaml'));
const ok = (type: ContentType, value: unknown) =>
	parseContent(type, 'x.yaml', YAML.stringify(value)).ok;

describe('C6 fields', () => {
	it('accepts a chip object in syllables and pairs', () => {
		const p = primer();
		p.sections.tones.cards[0].syllables.push({ say: 'ā', label: 'a', hanzi: '啊' });
		p.sections.tones.cards[0].pairs = [[{ say: 'ā' }, 'á']];
		expect(ok('Primer', p)).toBe(true);
	});

	it('rejects a chip with an unknown key', () => {
		const p = primer();
		p.sections.tones.cards[0].syllables.push({ say: 'ā', color: 'red' });
		expect(ok('Primer', p)).toBe(false);
	});

	it("rejects section 'dance'", () => {
		const q = question();
		q.section = 'dance';
		expect(ok('Question', q)).toBe(false);
	});

	it('accepts ask, why and section on a choice question', () => {
		expect(ok('Question', question())).toBe(true);
	});

	it('accepts spoken on a syllable prompt and rejects it on a vi prompt', () => {
		const q = question();
		q.prompt = { kind: 'syllable', text: 'nǐ hǎo', spoken: 'ní hǎo' };
		expect(ok('Question', q)).toBe(true);
		q.prompt = { kind: 'vi', text: 'x', spoken: 'y' };
		expect(ok('Question', q)).toBe(false);
	});

	it('rejects sense rare: false', () => {
		const w = word();
		w.senses[1].rare = false;
		expect(ok('Word', w)).toBe(false);
	});

	it("rejects sense pos 'foo' and accepts 'comp'", () => {
		const w = word();
		expect(ok('Word', w)).toBe(true);
		w.senses[1].pos = 'foo';
		expect(ok('Word', w)).toBe(false);
	});

	it("accepts Sentence source 'ai' and rejects 'tatoeba:abc'", () => {
		const s = YAML.parse(read('sentence.valid.yaml'));
		s.source = 'ai';
		expect(ok('Sentence', s)).toBe(true);
		s.source = 'tatoeba:abc';
		expect(ok('Sentence', s)).toBe(false);
	});
});
