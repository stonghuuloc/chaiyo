import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import * as nodeFs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fixtureRefs } from '../lint/fixtures/refs';
import { buildBundle } from './bundle';
import { createBundleSink } from './bundle-sink';
import { importContent } from './import';
import { createMemorySink, type ImportedContent } from './sink';

const OK = join(__dirname, 'fixtures/ok');
let out: string;
beforeEach(() => {
	out = mkdtempSync(join(tmpdir(), 'bundle-sink-'));
});
afterEach(() => rmSync(out, { recursive: true, force: true }));

const loadOk = async (): Promise<ImportedContent> => {
	const sink = createMemorySink();
	const res = await importContent(OK, sink, { refs: fixtureRefs });
	if ('errors' in res) throw new Error(JSON.stringify(res.errors));
	return sink.content!;
};
const json = (...p: string[]) => JSON.parse(readFileSync(join(out, ...p), 'utf8'));

describe('createBundleSink', () => {
	it('writes the lesson files, manifest, audio manifest and current.json', async () => {
		const c = await loadOk();
		const sink = createBundleSink(out);
		expect(await sink.has(c.sha)).toBe(false);
		await sink.write(c);
		expect(await sink.has(c.sha)).toBe(true);
		expect(json('current.json')).toEqual({ sha: c.sha });
		expect(readdirSync(out).sort()).toEqual(['current.json', c.sha].sort());
		expect(readdirSync(join(out, c.sha)).sort()).toEqual(
			['audio-manifest.json', 'h0-00.json', 'h1-01.json', 'manifest.json'].sort()
		);
		expect(json(c.sha, 'h1-01.json')).toEqual(buildBundle(c, 'h1-01'));
		expect(json(c.sha, 'audio-manifest.json')).toEqual({ sha: c.sha, entries: c.audio });
		const manifest = json(c.sha, 'manifest.json');
		expect(manifest.sha).toBe(c.sha);
		expect(manifest.lessons.map((l: { id: string }) => l.id)).toEqual(['h0-00', 'h1-01']);
		for (const l of manifest.lessons) {
			expect(l.file).toBe(`${l.id}.json`);
			expect(l.bytes).toBe(statSync(join(out, c.sha, l.file)).size);
		}
	});

	it('the h1-01 bundle holds the lesson, its words, chars, sentences and questions', async () => {
		const c = await loadOk();
		await createBundleSink(out).write(c);
		const b = json(c.sha, 'h1-01.json');
		expect(b.lesson.id).toBe('h1-01');
		expect(b.words.map((w: { id: string }) => w.id)).toContain('你好');
		expect(b.chars.map((x: { hanzi: string }) => x.hanzi)).toEqual(['们', '你', '好']);
		expect(b.sentences.length).toBeGreaterThan(0);
		expect(b.questions.length).toBeGreaterThan(0);
	});

	it('A then B then A: the third write only rewrites current.json', async () => {
		const a = await loadOk();
		const b = { ...a, sha: 'b'.repeat(64) };
		const sink = createBundleSink(out);
		await sink.write(a);
		await sink.write(b);
		expect(await sink.has(a.sha)).toBe(false);
		const mtime = statSync(join(out, a.sha, 'h1-01.json')).mtimeMs;
		await new Promise((r) => setTimeout(r, 15));
		await sink.write(a);
		expect(statSync(join(out, a.sha, 'h1-01.json')).mtimeMs).toBe(mtime);
		expect(json('current.json')).toEqual({ sha: a.sha });
		expect(await sink.has(a.sha)).toBe(true);
	});

	it('a failed rename leaves no sha folder, no tmp folder and the old current.json', async () => {
		const a = await loadOk();
		const b = { ...a, sha: 'b'.repeat(64) };
		await createBundleSink(out).write(a);
		const failing = createBundleSink(out, {
			...nodeFs,
			renameSync: (from, to) => {
				if (String(to).endsWith(b.sha)) throw new Error('boom');
				nodeFs.renameSync(from, to);
			}
		});
		await expect(failing.write(b)).rejects.toThrow('boom');
		expect(readdirSync(out).sort()).toEqual(['current.json', a.sha].sort());
		expect(json('current.json')).toEqual({ sha: a.sha });
	});

	it('has is false when current.json holds the sha but the manifest is missing', async () => {
		const a = await loadOk();
		const sink = createBundleSink(out);
		await sink.write(a);
		rmSync(join(out, a.sha, 'manifest.json'));
		expect(await sink.has(a.sha)).toBe(false);
	});
});
