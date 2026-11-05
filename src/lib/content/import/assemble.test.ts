import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { parseDictionary } from '../derive';
import { lintDir } from '../lint';
import { fixtureRefs } from '../lint/fixtures/refs';
import { assemble } from './assemble';
import { audioManifest } from './audio';

const OK = join(__dirname, 'fixtures/ok');

const load = (dir: string) => {
	const { set, errors } = lintDir(dir, { refs: fixtureRefs });
	const dict = parseDictionary(
		'dictionary.json',
		JSON.parse(readFileSync(join(dir, 'dictionary.json'), 'utf8'))
	);
	if (!dict.ok) throw new Error('bad dictionary');
	return { set, errors, dict: dict.value };
};

const built = (dir = OK) => {
	const { set, dict } = load(dir);
	const result = assemble(set, dict);
	if ('errors' in result) throw new Error(JSON.stringify(result.errors));
	return result.content;
};

const temps: string[] = [];
afterEach(() => {
	for (const t of temps.splice(0)) rmSync(t, { recursive: true, force: true });
});

const walk = (v: unknown, seen: unknown[] = []): unknown[] => {
	if (v && typeof v === 'object') {
		seen.push(v);
		for (const x of Object.values(v)) walk(x, seen);
	}
	return seen;
};

describe('assemble on fixtures/ok', () => {
	it('fixture is lint-clean', () => {
		expect(load(OK).errors).toEqual([]);
	});

	it('holds every lesson, word, char, grammar point, sentence and question', () => {
		const { set } = load(OK);
		const c = built();
		expect(c.lessons.map((l) => l.id)).toEqual(['h0-00', 'h1-01']);
		expect(c.words.map((w) => w.id)).toEqual(set.words.map((w) => w.value.id).sort());
		expect(c.chars.map((x) => x.hanzi)).toEqual(['们', '你', '好']);
		expect(c.grammar.map((g) => g.id)).toEqual(['h1-g01']);
		expect(c.sentences).toHaveLength(20);
		expect(c.syllables.length).toBe(set.syllables.length);
		expect(c.questions.length).toBeGreaterThan(0);
	});

	it('resolves words: spoken, hanviet, taughtIn, listedIn', () => {
		const c = built();
		const nihao = c.words.find((w) => w.id === '你好')!;
		expect(nihao.spoken).toBe('ní hǎo');
		expect(nihao.hanviet).toBe('nhĩ hảo');
		expect(nihao.taughtIn).toBe('h1-01');
		expect(nihao.listedIn).toEqual(['h1-01']);
		const nimen = c.words.find((w) => w.id === '你们')!;
		expect(nimen.spoken).toBe('nǐmen');
	});

	it('derives hanviet when the word does not author it', () => {
		const dir = mkdtempSync(join(tmpdir(), 'assemble-'));
		temps.push(dir);
		cpSync(OK, dir, { recursive: true });
		const f = join(dir, 'words/你们.yaml');
		writeFileSync(f, readFileSync(f, 'utf8').replace(/^hanviet: .*\n/m, ''));
		expect(built(dir).words.find((w) => w.id === '你们')!.hanviet).toBe('nhĩ môn');
	});

	it('sentences carry spoken and seg; the free one has no lessonId', () => {
		const c = built();
		const free = c.sentences.find((s) => s.id === 's-w-1')!;
		expect(free.lessonId).toBeUndefined();
		expect(free.spoken).toBe('ní hǎo');
		expect(free.seg.length).toBeGreaterThan(0);
		const own = c.sentences.find((s) => s.id === 's-h1-01-09')!;
		expect(own.lessonId).toBe('h1-01');
		expect(own.spoken).toBe('nǐmen hǎo');
		expect(own.seg).toEqual(['你们', '好', '！']);
		expect(c.sentences.find((s) => s.id === 's-h1-01-03')!.spoken).toBe('duìbuqǐ');
	});

	it('segments a free sentence with an empty lesson-word set', () => {
		const free = built().sentences.find((s) => s.id === 's-w-1')!;
		expect(free.seg).toEqual(['你', '好', '！']);
	});

	it('questions carry roles and the lesson id', () => {
		const c = built();
		const roles = Object.fromEntries(c.questions.map((q) => [q.id, q.role]));
		expect(roles['q-h1-01-d01']).toBe('dialogue');
		expect(roles['q-h1-01-l01']).toBe('listen');
		expect(roles['q-h1-01-g01']).toBe('gate');
		expect(c.questions.every((q) => q.lessonId === 'h0-00' || q.lessonId === 'h1-01')).toBe(true);
		expect(c.questions.some((q) => q.lessonId === 'h0-00' && q.role === 'drill')).toBe(true);
	});

	it('the Primer has empty gateCoverage and thin; the lesson has both', () => {
		const c = built();
		const primer = c.lessons.find((l) => l.id === 'h0-00')!;
		expect(primer.gateCoverage).toEqual({});
		expect(primer.thin).toEqual([]);
		const lesson = c.lessons.find((l) => l.id === 'h1-01')!;
		expect(Object.keys(lesson.gateCoverage)).toEqual([
			'你',
			'好',
			'您',
			'你们',
			'你好',
			'对不起',
			'没关系',
			'谢谢',
			'不客气',
			'再见'
		]);
		expect(lesson.thin.length).toBeGreaterThan(0);
		expect(lesson.thin.map((t) => t.hanzi)).toContain('们');
	});

	it('audio is the manifest of the content and changes with a speaker', () => {
		const c = built();
		expect(c.audio).toEqual(audioManifest(c));
		const dir = mkdtempSync(join(tmpdir(), 'assemble-'));
		temps.push(dir);
		cpSync(OK, dir, { recursive: true });
		const f = join(dir, 'lessons/hsk1/h1-01.yaml');
		writeFileSync(
			f,
			readFileSync(f, 'utf8').replace(
				'vi: Không sao., speaker: redpanda',
				'vi: Không sao., speaker: takin'
			)
		);
		const speaker = built(dir).audio;
		expect(speaker).not.toEqual(c.audio);
		expect(speaker.find((e) => e.ref === 's-h1-01-04')?.voice).toBe('takin');
	});

	it('holds only plain objects and arrays', () => {
		for (const v of walk(built())) {
			expect(v instanceof Map || v instanceof Set).toBe(false);
			expect(Object.getPrototypeOf(v) === Object.prototype || Array.isArray(v)).toBe(true);
		}
	});

	it('a word whose Hán Việt cannot be derived is a check 10 error', () => {
		const dir = mkdtempSync(join(tmpdir(), 'assemble-'));
		temps.push(dir);
		cpSync(OK, dir, { recursive: true });
		const f = join(dir, 'words/你们.yaml');
		writeFileSync(f, readFileSync(f, 'utf8').replace(/^hanviet: .*\n/m, ''));
		rmSync(join(dir, 'chars/们.yaml'));
		const { set, dict } = load(dir);
		const result = assemble(set, dict);
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
	});
});
