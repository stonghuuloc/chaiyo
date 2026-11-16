import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixtureRefs } from '../lint/fixtures/refs';
import { buildBundle } from './bundle';
import { importContent } from './import';
import { createMemorySink, type ImportedContent } from './sink';

const OK = join(__dirname, 'fixtures/ok');

const loadOk = async (): Promise<ImportedContent> => {
	const sink = createMemorySink();
	const res = await importContent(OK, sink, { refs: fixtureRefs });
	if ('errors' in res) throw new Error(JSON.stringify(res.errors));
	return sink.content!;
};

describe('buildBundle', () => {
	it('has the 9 keys and the lesson without gateCoverage and thin', async () => {
		const c = await loadOk();
		const b = buildBundle(c, 'h1-01');
		const lesson = c.lessons.find((l) => l.id === 'h1-01')!;
		expect(Object.keys(b)).toEqual([
			'sha',
			'lesson',
			'sentences',
			'questions',
			'grammar',
			'words',
			'chars',
			'gateCoverage',
			'thin'
		]);
		expect(b.sha).toBe(c.sha);
		expect(b.lesson).not.toHaveProperty('gateCoverage');
		expect(b.lesson).not.toHaveProperty('thin');
		expect(b.gateCoverage).toEqual(lesson.gateCoverage);
		expect(b.thin).toEqual(lesson.thin);
		expect(b.lesson.id).toBe('h1-01');
	});

	it('holds the taught words with derived fields, their chars, grammar and questions', async () => {
		const c = await loadOk();
		const b = buildBundle(c, 'h1-01');
		const lesson = c.lessons.find((l) => l.id === 'h1-01')!;
		if ('kind' in lesson) throw new Error('primer');
		expect(b.words.map((w) => w.id)).toEqual(lesson.sections.words.ids.slice().sort());
		expect(b.words.find((w) => w.id === '你好')).toMatchObject({
			spoken: 'ní hǎo',
			hanviet: 'nhĩ hảo',
			taughtIn: 'h1-01'
		});
		expect(b.chars.map((x) => x.hanzi)).toEqual(['们', '你', '好']);
		expect(b.grammar.map((g) => g.id)).toEqual(lesson.sections.grammar.ids);
		expect(b.questions.map((q) => q.id)).toEqual(
			c.questions.filter((q) => q.lessonId === 'h1-01').map((q) => q.id)
		);
	});

	it('Given_Bundle_When_Build_Then_EverySentenceCarriesItsManifestKey', async () => {
		const c = await loadOk();
		const b = buildBundle(c, 'h1-01');
		const keys = new Map(c.audio.filter((a) => a.kind === 'sentence').map((a) => [a.ref, a.key]));
		expect(b.sentences.length).toBeGreaterThan(0);
		for (const s of b.sentences) expect(s.audio).toBe(keys.get(s.id));
		const noSpeaker = b.sentences.find((s) => s.speaker === undefined)!;
		expect(noSpeaker.audio!.startsWith('examples/')).toBe(true);
	});

	it('holds the lesson sentences plus the free ones a taught word lists', async () => {
		const c = await loadOk();
		const ids = buildBundle(c, 'h1-01').sentences.map((s) => s.id);
		expect(ids).toEqual([...ids].sort());
		for (const s of c.sentences.filter((s) => s.lessonId === 'h1-01')) expect(ids).toContain(s.id);
		expect(ids).toContain('s-w-1');
		const unlisted = { ...c.sentences.find((x) => x.id === 's-w-1')!, id: 's-w-unlisted' };
		const more = { ...c, sentences: [...c.sentences, unlisted] };
		expect(buildBundle(more, 'h1-01').sentences.map((x) => x.id)).not.toContain('s-w-unlisted');
	});

	it('the Primer bundle has no words, chars, grammar or sentences', async () => {
		const c = await loadOk();
		const b = buildBundle(c, 'h0-00');
		expect(b.words).toEqual([]);
		expect(b.chars).toEqual([]);
		expect(b.grammar).toEqual([]);
		expect(b.sentences).toEqual([]);
		expect(b.thin).toEqual([]);
		expect(b.gateCoverage).toEqual({});
		expect(b.questions.length).toBeGreaterThan(0);
	});

	it('throws on an unknown lesson', async () => {
		expect(() => buildBundle(emptyContent(), 'nope')).toThrow('no lesson nope');
	});
});

const emptyContent = (): ImportedContent => ({
	sha: 'x',
	lessons: [],
	words: [],
	sentences: [],
	chars: [],
	grammar: [],
	questions: [],
	syllables: [],
	audio: []
});
