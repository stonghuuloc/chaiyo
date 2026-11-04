import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixtureRefs } from './fixtures/refs';
import { lintDir, loadContentDir } from './index';

const clean = join(__dirname, 'fixtures/clean');
let dir: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'lint-load-'));
	cpSync(clean, dir, { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('loadContentDir', () => {
	it('only skips a broken file outside the selected folders', () => {
		mkdirSync(join(dir, 'lessons/hsk2'), { recursive: true });
		writeFileSync(join(dir, 'lessons/hsk2/broken.yaml'), 'id: [unclosed');
		const only = ['lessons/hsk1', 'words', 'chars', 'grammar', 'syllables.yaml'];
		expect(lintDir(dir, { refs: fixtureRefs, only }).errors).toEqual([]);
		const all = lintDir(dir, { refs: fixtureRefs }).errors;
		expect(all).toHaveLength(1);
		expect(all[0]).toMatchObject({ file: 'lessons/hsk2/broken.yaml', check: 0, name: 'schema' });
	});

	it('only matches a file path exactly, not by string prefix', () => {
		const { set } = loadContentDir(dir, { only: ['words/你.yaml'] });
		expect(set.words.map((w) => w.value.id)).toEqual(['你']);
	});

	it('no syllables.yaml gives an empty syllables list', () => {
		rmSync(join(dir, 'syllables.yaml'));
		expect(loadContentDir(dir).set.syllables).toEqual([]);
	});

	it('invalid YAML becomes a check 0 error and valid files still load', () => {
		writeFileSync(join(dir, 'words/坏.yaml'), 'id: [unclosed');
		const { set, errors } = loadContentDir(dir);
		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({ file: 'words/坏.yaml', check: 0 });
		expect(errors[0].line).toBeDefined();
		expect(set.words).toHaveLength(10);
	});

	it('missing sentences folder yields no sentence files', () => {
		expect(loadContentDir(dir).set.sentences).toEqual([]);
	});

	it('reads sentence files as Sentences', () => {
		mkdirSync(join(dir, 'sentences'));
		writeFileSync(
			join(dir, 'sentences/a.yaml'),
			'- { id: s-x, hanzi: 你好, pinyin: nǐ hǎo, vi: Chào }\n'
		);
		expect(loadContentDir(dir).set.sentences[0].value[0].id).toBe('s-x');
	});
});
