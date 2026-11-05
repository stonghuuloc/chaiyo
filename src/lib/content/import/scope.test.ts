import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { scopeFor } from './scope';

const OK = join(__dirname, 'fixtures/ok');
const FIXED = ['chars', 'sentences', 'syllables.yaml'];
const ALL_WORDS = [
	'不客气',
	'你',
	'你们',
	'你好',
	'再见',
	'好',
	'对不起',
	'您',
	'没关系',
	'谢谢'
].sort();

const temps: string[] = [];
afterEach(() => {
	for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});
const copy = () => {
	const dir = mkdtempSync(join(tmpdir(), 'scope-'));
	temps.push(dir);
	cpSync(OK, dir, { recursive: true });
	return dir;
};
const edit = (dir: string, file: string, from: string, to: string) => {
	const path = join(dir, file);
	writeFileSync(path, readFileSync(path, 'utf8').replace(from, to));
};

describe('scopeFor', () => {
	it('lists the roots, the fixed entries and the word and grammar files the lessons reference', () => {
		expect(scopeFor(OK, ['lessons/hsk1'])).toEqual([
			'lessons/hsk1',
			...FIXED,
			...ALL_WORDS.map((w) => `words/${w}.yaml`),
			'grammar/h1-g01.yaml'
		]);
	});

	it('gives the same list for a root with a trailing slash', () => {
		expect(scopeFor(OK, ['lessons/hsk1/'])).toEqual(scopeFor(OK, ['lessons/hsk1']));
	});

	it('leaves out a word file nothing in scope references', () => {
		const dir = copy();
		writeFileSync(join(dir, 'words/多余.yaml'), 'id: 多余\n');
		expect(scopeFor(dir, ['lessons/hsk1'])).not.toContain('words/多余.yaml');
	});

	it('adds a word a question tests that no lesson lists', () => {
		const dir = copy();
		edit(
			dir,
			'lessons/hsk1/h1-01.yaml',
			'ids: [你, 好, 您, 你们, 你好, 对不起, 没关系, 谢谢, 不客气, 再见]',
			'ids: [你]'
		);
		const files = scopeFor(dir, ['lessons/hsk1']);
		expect(files).toContain('words/你.yaml');
		expect(files).toContain('words/你好.yaml');
	});

	it('adds no file for a hanzi prompt whose ref is a sentence id', () => {
		const dir = copy();
		const f = join(dir, 'lessons/hsk1/h1-01.yaml');
		writeFileSync(f, readFileSync(f, 'utf8').replaceAll("'ref': '你好'", "'ref': 's-h1-01-01'"));
		const files = scopeFor(dir, ['lessons/hsk1']);
		expect(files).not.toContain('words/s-h1-01-01.yaml');
		expect(files).toContain('words/你好.yaml');
	});
});
