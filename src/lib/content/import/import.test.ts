import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureRefs } from '../lint/fixtures/refs';
import { BUNDLE_FORMAT } from './bundle';
import { contentSha, importContent } from './import';
import { createMemorySink, type Sink } from './sink';

const OK = join(__dirname, 'fixtures/ok');
const refs = fixtureRefs;

const temps: string[] = [];
const withTemp = (mutate?: (dir: string) => void) => {
	const dir = mkdtempSync(join(tmpdir(), 'import-'));
	temps.push(dir);
	cpSync(OK, dir, { recursive: true });
	mutate?.(dir);
	return dir;
};
const edit = (dir: string, file: string, from: string | RegExp, to: string) => {
	const path = join(dir, file);
	const text = readFileSync(path, 'utf8');
	const next = text.replace(from, to);
	if (next === text) throw new Error(`edit did not change ${file}`);
	writeFileSync(path, next);
};

const spySink = (write: Sink['write'] = async () => {}) => ({
	has: vi.fn(async () => false),
	write: vi.fn(write)
});

beforeEach(() => {
	vi.stubEnv('CHAIYO_VAULT', '/nonexistent');
});
afterEach(() => {
	vi.unstubAllEnvs();
	for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});

describe('importContent lint gate [AC1]', () => {
	it('bad pinyin returns the lint error and writes nothing', async () => {
		const dir = withTemp((d) => edit(d, 'words/你好.yaml', 'pinyin: nǐ hǎo', 'pinyin: ni hao'));
		const memory = createMemorySink();
		const stub = spySink();
		const result = await importContent(dir, stub, { refs });
		expect(result).toEqual({
			errors: [
				expect.objectContaining({
					file: 'words/你好.yaml',
					path: 'pinyin',
					check: 3,
					name: 'Tone marks'
				})
			]
		});
		expect(stub.has).not.toHaveBeenCalled();
		expect(stub.write).not.toHaveBeenCalled();
		await importContent(dir, memory, { refs });
		expect(memory.versions).toHaveLength(0);
		expect(memory.content).toBeUndefined();
	});

	it('a derive failure is a check 10 error and writes nothing', async () => {
		const dir = withTemp((d) => {
			edit(d, 'words/你们.yaml', /^hanviet: .*\n/m, '');
			rmSync(join(d, 'chars/们.yaml'));
		});
		const stub = spySink();
		const result = await importContent(dir, stub, { refs });
		expect(result).toEqual({
			errors: [
				expect.objectContaining({
					file: 'words/你们.yaml',
					path: 'hanviet',
					check: 10,
					name: 'Derive'
				})
			]
		});
		expect(stub.write).not.toHaveBeenCalled();
	});

	it('a malformed dictionary row is a check 10 error on dictionary.json', async () => {
		const dir = withTemp((d) => writeFileSync(join(d, 'dictionary.json'), JSON.stringify([['x']])));
		const stub = spySink();
		const result = await importContent(dir, stub, { refs });
		expect(result).toEqual({
			errors: expect.arrayContaining([
				expect.objectContaining({ file: 'dictionary.json', check: 10, name: 'Derive' })
			])
		});
		expect(stub.write).not.toHaveBeenCalled();
	});

	it('an unparseable dictionary.json is one check 10 error', async () => {
		const dir = withTemp((d) => writeFileSync(join(d, 'dictionary.json'), '{nope'));
		const result = await importContent(dir, spySink(), { refs });
		expect(result).toEqual({
			errors: [expect.objectContaining({ file: 'dictionary.json', check: 10 })]
		});
	});

	it('a dictionary.json symlink loop is a check 10 error, not an empty Dictionary', async () => {
		const dir = withTemp((d) => {
			rmSync(join(d, 'dictionary.json'));
			symlinkSync(join(d, 'dictionary.json'), join(d, 'dictionary.json'));
		});
		const stub = spySink();
		const result = await importContent(dir, stub, { refs });
		expect(result).toEqual({
			errors: [expect.objectContaining({ file: 'dictionary.json', check: 10, name: 'Derive' })]
		});
		expect(stub.write).not.toHaveBeenCalled();
	});

	it('a sink whose write throws makes importContent reject with that error', async () => {
		const stub = spySink(async () => {
			throw new Error('disk full');
		});
		await expect(importContent(OK, stub, { refs })).rejects.toThrow('disk full');
	});

	it('only scopes lint to the production list', async () => {
		const dir = withTemp((d) => {
			mkdirSync(join(d, 'lessons/hsk2'));
			writeFileSync(join(d, 'lessons/hsk2/x.yaml'), 'id: broken\n');
		});
		const only = [
			'lessons/hsk1',
			'chars',
			'sentences',
			'syllables.yaml',
			...['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'].map(
				(id) => `words/${id}.yaml`
			),
			'grammar/h1-g01.yaml'
		];
		const without = await importContent(dir, createMemorySink(), { refs });
		expect('errors' in without).toBe(true);
		const scoped = await importContent(dir, createMemorySink(), { refs, only });
		expect(scoped).toEqual({ sha: expect.stringMatching(/^[0-9a-f]{64}$/) });
	});
});

describe('importContent sha [AC2]', () => {
	it('returns exactly { sha } and holds one version when run twice', async () => {
		const sink = createMemorySink();
		const write = vi.spyOn(sink, 'write');
		const first = await importContent(OK, sink, { refs });
		const second = await importContent(OK, sink, { refs });
		expect(first).toEqual({ sha: expect.stringMatching(/^[0-9a-f]{64}$/) });
		expect(second).toEqual(first);
		expect(write).toHaveBeenCalledTimes(1);
		expect(sink.versions).toHaveLength(1);
		expect(sink.content?.sha).toBe((first as { sha: string }).sha);
	});

	it('A then B then A again rewrites A: 3 writes, 2 versions', async () => {
		const sink = createMemorySink();
		const write = vi.spyOn(sink, 'write');
		const dir = withTemp();
		const a = await importContent(dir, sink, { refs });
		edit(dir, 'words/你好.yaml', '{ vi: xin chào }', '{ vi: xin chào bạn }');
		const b = await importContent(dir, sink, { refs });
		edit(dir, 'words/你好.yaml', '{ vi: xin chào bạn }', '{ vi: xin chào }');
		const a2 = await importContent(dir, sink, { refs });
		expect(b).not.toEqual(a);
		expect(a2).toEqual(a);
		expect(write).toHaveBeenCalledTimes(3);
		expect(sink.versions).toHaveLength(2);
		expect(sink.content?.sha).toBe((a as { sha: string }).sha);
	});

	it('ignores YAML comments and whitespace', async () => {
		const dir = withTemp();
		const a = await importContent(dir, createMemorySink(), { refs });
		edit(
			dir,
			'words/你好.yaml',
			'# content/words/你好.yaml',
			'# a new comment line\n# content/words/你好.yaml'
		);
		expect(await importContent(dir, createMemorySink(), { refs })).toEqual(a);
	});

	it('changes when a derived or authored value changes', async () => {
		const a = await importContent(OK, createMemorySink(), { refs });
		const sense = withTemp((d) =>
			edit(d, 'words/你好.yaml', '{ vi: xin chào }', '{ vi: chào hỏi }')
		);
		expect(await importContent(sense, createMemorySink(), { refs })).not.toEqual(a);
		const dict = withTemp((d) => {
			const rows = JSON.parse(readFileSync(join(d, 'dictionary.json'), 'utf8')) as string[][];
			const men = rows.find((r) => r[0] === '们')!;
			men[4] = 'hậu tố số nhiều';
			writeFileSync(join(d, 'dictionary.json'), JSON.stringify(rows));
		});
		expect(await importContent(dict, createMemorySink(), { refs })).not.toEqual(a);
	});

	it('Given_SameContent_When_BundleFormatChanges_Then_ShaChanges', async () => {
		// Arrange
		const sink = createMemorySink();
		const res = await importContent(OK, sink, { refs });
		const { sha, ...content } = sink.content!;

		// Act
		const old = contentSha(content, BUNDLE_FORMAT - 1);
		const current = contentSha(content, BUNDLE_FORMAT);

		// Assert
		expect(BUNDLE_FORMAT).toBe(3);
		expect(res).toEqual({ sha });
		expect(current).toBe(sha);
		expect(old).not.toBe(current);
	});

	it('a missing dictionary.json is an empty Dictionary, not an error', async () => {
		const dir = withTemp((d) => rmSync(join(d, 'dictionary.json')));
		expect(await importContent(dir, createMemorySink(), { refs })).toEqual({
			sha: expect.stringMatching(/^[0-9a-f]{64}$/)
		});
	});
});
