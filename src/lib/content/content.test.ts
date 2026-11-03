import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseContent } from './parse';
import type { ContentType } from './schemas';

const root = resolve(process.cwd(), 'content');
const folders: [string, ContentType][] = [
	['words', 'Word'],
	['grammar', 'GrammarPoint'],
	['lessons', 'Lesson']
];

const yamlFiles = (dir: string): string[] =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory()
			? yamlFiles(join(dir, e.name))
			: e.name.endsWith('.yaml')
				? [join(dir, e.name)]
				: []
	);

const files = folders.flatMap(([folder, type]) =>
	yamlFiles(join(root, folder)).map((path) => [relative(root, path), type, path] as const)
);

describe('real content', () => {
	it.each(files)('%s parses with 0 errors', (file, type, path) => {
		const result = parseContent(type, file, readFileSync(path, 'utf8'));
		const errors = result.ok
			? []
			: result.errors.map((e) => `${e.file} at ${e.path}: ${e.message}`);
		expect(errors).toEqual([]);
	});
});
