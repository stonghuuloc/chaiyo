import { describe, expect, it } from 'vitest';
import { createMemorySink, type ImportedContent } from './sink';

const make = (sha: string): ImportedContent => ({
	sha,
	lessons: [],
	words: [],
	sentences: [],
	chars: [],
	grammar: [],
	questions: [],
	syllables: [],
	audio: []
});

describe('createMemorySink', () => {
	it('has() is false when empty', async () => {
		expect(await createMemorySink().has('A')).toBe(false);
	});

	it('write records the version and the current content', async () => {
		const sink = createMemorySink();
		const a = make('A');
		await sink.write(a);
		expect(await sink.has('A')).toBe(true);
		expect(sink.versions.map((v) => v.sha)).toEqual(['A']);
		expect(sink.versions[0].createdAt).toBeInstanceOf(Date);
		expect(sink.content).toEqual(a);
	});

	it('has() means current: A then B then A again writes A again, 2 rows', async () => {
		const sink = createMemorySink();
		await sink.write(make('A'));
		await sink.write(make('B'));
		expect(await sink.has('A')).toBe(false);
		expect(await sink.has('B')).toBe(true);
		expect(sink.versions).toHaveLength(2);
		await sink.write(make('A'));
		expect(await sink.has('A')).toBe(true);
		expect(sink.versions).toHaveLength(2);
		expect(sink.content?.sha).toBe('A');
	});

	it('a write that throws while cloning leaves versions and content untouched', async () => {
		const sink = createMemorySink();
		const a = make('A');
		await sink.write(a);
		const bad = make('B');
		Object.defineProperty(bad, 'words', {
			enumerable: true,
			get() {
				throw new Error('boom');
			}
		});
		await expect(sink.write(bad)).rejects.toThrow('boom');
		expect(sink.versions.map((v) => v.sha)).toEqual(['A']);
		expect(sink.content).toEqual(a);
	});
});
