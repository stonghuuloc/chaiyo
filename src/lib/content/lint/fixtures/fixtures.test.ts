import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from '../../parse';
import type { ContentType } from '../../schemas';

const root = join(__dirname, 'clean');
const typeOf = (rel: string): ContentType => {
	if (rel.startsWith('lessons/')) return 'Lesson';
	if (rel.startsWith('words/')) return 'Word';
	if (rel.startsWith('chars/')) return 'Char';
	if (rel.startsWith('grammar/')) return 'GrammarPoint';
	if (rel.startsWith('sentences/')) return 'Sentences';
	return 'Syllables';
};

describe('clean fixture tree', () => {
	const files = (readdirSync(root, { recursive: true }) as string[]).filter((f) =>
		f.endsWith('.yaml')
	);

	it('has the Bài 1 files', () => {
		expect(files.filter((f) => f.startsWith('words/'))).toHaveLength(10);
		expect(files.filter((f) => f.startsWith('chars/'))).toHaveLength(3);
	});

	it.each(files)('%s parses under its schema', (rel) => {
		const result = parseContent(typeOf(rel), rel, readFileSync(join(root, rel), 'utf8'));
		expect(result.ok ? [] : result.errors).toEqual([]);
	});
});
