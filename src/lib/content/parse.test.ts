import { describe, expect, it } from 'vitest';
import { parseContent } from './parse';

const word = `id: 你好
hanzi: 你好
pinyin: nǐ hǎo
level: 1
pos: [phrase]
senses: [{ vi: xin chào }]
examples: []
`;

describe('parseContent', () => {
	it('formats nested path as sentences[3].hanzi', () => {
		const sentences = Array.from({ length: 4 }, (_, i) =>
			i === 3
				? '  - { id: s4, hanzi: 1, pinyin: a, vi: b }'
				: `  - { id: s${i}, hanzi: 好, pinyin: a, vi: b }`
		).join('\n');
		const text = `id: x\nsentences:\n${sentences}\n`;
		const result = parseContent('Lesson', 'lessons/hsk1/x.yaml', text);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors).toContainEqual(
			expect.objectContaining({ file: 'lessons/hsk1/x.yaml', path: 'sentences[3].hanzi' })
		);
	});

	it('unknown key collocatons → path collocatons', () => {
		const result = parseContent('Word', 'words/你好.yaml', word + 'collocatons: []\n');
		expect(result).toEqual({
			ok: false,
			errors: [{ file: 'words/你好.yaml', path: 'collocatons', message: 'unknown key' }]
		});
	});

	it('YAML syntax error → file + line', () => {
		const result = parseContent('Word', 'words/你好.yaml', 'id: [unclosed\nlevel: 1\n');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0]).toMatchObject({ file: 'words/你好.yaml', path: '' });
		expect(result.errors[0].line).toBeGreaterThan(0);
	});

	it('unresolved alias → error list, no throw', () => {
		const result = parseContent('Word', 'words/你好.yaml', 'a: *nope\n');
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0]).toMatchObject({ file: 'words/你好.yaml', path: '' });
	});

	it('nested unknown key sentences[0].foo → path sentences[0].foo', () => {
		const text = 'sentences:\n  - { id: s0, hanzi: 好, pinyin: a, vi: b, foo: 1 }\n';
		const result = parseContent('Lesson', 'lessons/hsk1/x.yaml', text);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors).toContainEqual(
			expect.objectContaining({ path: 'sentences[0].foo', message: 'unknown key' })
		);
	});

	it.each([3, -1, 1.5])('choice answer %s outside options → path answer', (answer) => {
		const text = `id: q\ntype: choice\ntests: {}\nprompt: { kind: vi, text: x }\noptionKind: hanzi\noptions: [a, b, c]\nanswer: ${answer}\n`;
		const result = parseContent('Question', 'q.yaml', text);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0]).toMatchObject({ file: 'q.yaml', path: 'answer' });
	});

	it('fill answer outside options → path answer', () => {
		const text =
			'id: q\ntype: fill\ntests: {}\nsentence: s1\nblank: 0\noptions: [a, b]\nanswer: 2\n';
		const result = parseContent('Question', 'q.yaml', text);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.errors[0]).toMatchObject({ path: 'answer' });
	});
});
