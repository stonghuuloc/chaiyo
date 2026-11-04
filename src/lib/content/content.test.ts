import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { parseContent } from './parse';
import type { ContentType } from './schemas';

const root = resolve(process.cwd(), 'content');
const skipped = ['cast.yaml', 'levels/', 'mock/'];
const folders: [string, ContentType][] = [
	['words/', 'Word'],
	['grammar/', 'GrammarPoint'],
	['chars/', 'Char'],
	['sentences/', 'Sentences']
];

const yamlFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? yamlFiles(join(dir, e.name))
			: e.name.endsWith('.yaml')
				? [join(dir, e.name)]
				: []
	);

const typeOf = (file: string, text: string): ContentType | undefined => {
	if (file === 'syllables.yaml') return 'Syllables';
	if (file.startsWith('lessons/')) return YAML.parse(text)?.kind === 'primer' ? 'Primer' : 'Lesson';
	return folders.find(([prefix]) => file.startsWith(prefix))?.[1];
};

const files = yamlFiles(root)
	.map((path) => [relative(root, path), path] as const)
	.filter(([file]) => !skipped.some((s) => file === s || file.startsWith(s)))
	.map(([file, path]) => [file, path, readFileSync(path, 'utf8')] as const);

describe('real content', () => {
	it.each(files)('%s has a type and parses with 0 errors', (file, _path, text) => {
		const type = typeOf(file, text);
		expect(type, `no schema type for ${file}`).toBeDefined();
		if (!type) return;
		const result = parseContent(type, file, text);
		const errors = result.ok
			? []
			: result.errors.map((e) => `${e.file} at ${e.path}: ${e.message}`);
		expect(errors).toEqual([]);
	});
});
