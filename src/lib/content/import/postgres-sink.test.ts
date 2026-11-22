import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
import { fixtureRefs } from '../lint/fixtures/refs';
import { audioKey, sentenceVoice } from './audio';
import { importContent } from './import';
import { createPostgresSink, type SqlClient } from './postgres-sink';
import { createMemorySink, type ImportedContent, type ImportedLesson } from './sink';

const OK = join(__dirname, 'fixtures/ok');
const MIGRATION = join(
	__dirname,
	'../../../../supabase/migrations/20261105000000_content_tables.sql'
);

const client = (db: PGlite): SqlClient => ({
	query: (sql, params) => db.query(sql, params),
	transaction: (fn) => db.transaction((tx) => fn((sql, params) => tx.query(sql, params)))
});

let db: PGlite;
let sink: ReturnType<typeof createPostgresSink>;
let template: Promise<PGlite> | undefined;
beforeEach(async () => {
	template ??= (async () => {
		const t = new PGlite();
		await t.exec('create role authenticated');
		await t.exec(readFileSync(MIGRATION, 'utf8'));
		return t;
	})();
	db = (await (await template).clone()) as PGlite;
	sink = createPostgresSink(client(db));
});
afterEach(() => db.close());

const loadOk = async (): Promise<ImportedContent> => {
	const mem = createMemorySink();
	const res = await importContent(OK, mem, { refs: fixtureRefs });
	if ('errors' in res) throw new Error(JSON.stringify(res.errors));
	return mem.content!;
};

const count = async (table: string) =>
	Number(((await db.query(`select count(*)::int as n from ${table}`)).rows[0] as { n: number }).n);
const ids = async (table: string, col = 'id') =>
	((await db.query(`select ${col} as v from ${table} order by 1`)).rows as { v: string }[]).map(
		(r) => r.v
	);

const withLesson = (c: ImportedContent, id: string, order: number): ImportedContent => {
	const base = c.lessons.find((l) => l.id === 'h1-01') as Exclude<ImportedLesson, { kind: string }>;
	const extra = {
		...base,
		id,
		order,
		sections: {
			...base.sections,
			words: { ids: [] },
			grammar: { ...base.sections.grammar, ids: [] }
		}
	} as ImportedLesson;
	return { ...c, sha: c.sha + id, lessons: [...c.lessons, extra] };
};

describe('createPostgresSink', () => {
	it('writes every entity of the content', async () => {
		const c = await loadOk();
		await sink.write(c);
		expect(await count('lessons')).toBe(c.lessons.length);
		expect(await count('words')).toBe(c.words.length);
		expect(await count('chars')).toBe(c.chars.length);
		expect(await count('sentences')).toBe(c.sentences.length);
		expect(await count('grammar_points')).toBe(c.grammar.length);
		expect(await count('questions')).toBe(c.questions.length);
		expect(await count('word_chars')).toBe(c.words.reduce((n, w) => n + [...w.hanzi].length, 0));
		expect(await count('lesson_words')).toBe(10);
		expect(await count('lesson_grammar')).toBe(1);
		expect(await ids('content_versions', 'sha')).toEqual([c.sha]);
	});

	it('sets audio_key per sentence from its speaker and style', async () => {
		const c = await loadOk();
		await sink.write(c);
		const rows = (await db.query('select id, hanzi, audio_key from sentences')).rows as {
			id: string;
			hanzi: string;
			audio_key: string;
		}[];
		for (const s of c.sentences)
			expect(rows.find((r) => r.id === s.id)?.audio_key).toBe(
				audioKey(s.hanzi, sentenceVoice(s).voice, sentenceVoice(s).style, sentenceVoice(s).folder)
			);
		const manifest = new Set(c.audio.map((e) => e.key));
		for (const r of rows) {
			expect(r.audio_key).toMatch(/^(examples|dialogue)\/[0-9a-f]{64}$/);
			expect(manifest.has(r.audio_key)).toBe(true);
		}
		const key = (id: string) => rows.find((r) => r.id === id)!.audio_key;
		expect(key('s-h1-01-11')).toBe(key('s-h1-01-10'));
		expect(key('s-w-1')).toBe(key('s-h1-01-10'));
	});

	it('importing twice leaves one content_versions row', async () => {
		const c = await loadOk();
		await sink.write(c);
		await sink.write(c);
		expect(await count('content_versions')).toBe(1);
		expect(await count('words')).toBe(c.words.length);
	});

	it('has is true for the latest import only; A, B, A rewrites the mirror to A', async () => {
		const a = await loadOk();
		const b = structuredClone(a);
		b.sha = 'b'.repeat(64);
		b.words = b.words.filter((w) => w.id !== '谢谢');
		const lesson = b.lessons.find((l) => l.id === 'h1-01') as {
			sections: { words: { ids: string[] } };
		};
		lesson.sections.words.ids = lesson.sections.words.ids.filter((x) => x !== '谢谢');
		expect(await sink.has(a.sha)).toBe(false);
		await sink.write(a);
		expect(await sink.has(a.sha)).toBe(true);
		await sink.write(b);
		expect(await sink.has(a.sha)).toBe(false);
		expect(await sink.has(b.sha)).toBe(true);
		expect(await ids('words')).not.toContain('谢谢');
		await sink.write(a);
		expect(await sink.has(a.sha)).toBe(true);
		expect(await ids('words')).toContain('谢谢');
		expect(await count('content_versions')).toBe(2);
	});

	it('a word removed from the content is gone from words and lesson_words', async () => {
		const a = await loadOk();
		await sink.write(a);
		const b = structuredClone(a);
		b.sha = 'b'.repeat(64);
		b.words = b.words.filter((w) => w.id !== '你好');
		const lesson = b.lessons.find((l) => l.id === 'h1-01') as {
			sections: { words: { ids: string[] } };
		};
		lesson.sections.words.ids = lesson.sections.words.ids.filter((x) => x !== '你好');
		await sink.write(b);
		expect(await ids('words')).not.toContain('你好');
		expect(await ids('lesson_words', 'word_id')).not.toContain('你好');
		expect(await ids('lesson_words', 'word_id')).toContain('谢谢');
	});

	it('a question removed from the files stays in questions', async () => {
		const a = await loadOk();
		await sink.write(a);
		const b = {
			...a,
			sha: 'b'.repeat(64),
			questions: a.questions.filter((q) => q.id !== 'q-h1-01-d01')
		};
		await sink.write(b);
		expect(await ids('questions')).toContain('q-h1-01-d01');
		expect(await count('questions')).toBe(a.questions.length);
	});

	it('a removed lesson goes while its word, re-taught elsewhere, stays', async () => {
		const a = withLesson(await loadOk(), 'h1-02', 2);
		await sink.write(a);
		const b = structuredClone(a);
		b.sha = 'b'.repeat(64);
		b.lessons = b.lessons.filter((l) => l.id !== 'h1-01');
		b.sentences = b.sentences.filter((s) => s.lessonId !== 'h1-01');
		const kept = b.lessons.find((l) => l.id === 'h1-02') as {
			sections: { words: { ids: string[] } };
		};
		kept.sections.words.ids = ['你好'];
		b.words = b.words.filter((w) => w.id === '你好').map((w) => ({ ...w, taughtIn: 'h1-02' }));
		b.chars = [];
		b.grammar = [];
		await sink.write(b);
		expect(await ids('lessons')).toEqual(['h0-00', 'h1-02']);
		expect(await ids('words')).toEqual(['你好']);
		expect((await db.query("select taught_in from words where id = '你好'")).rows).toEqual([
			{ taught_in: 'h1-02' }
		]);
	});

	it('swaps the order of two lessons', async () => {
		const a = withLesson(await loadOk(), 'h1-02', 2);
		await sink.write(a);
		const b = structuredClone(a);
		b.sha = 'b'.repeat(64);
		for (const l of b.lessons) {
			if (l.id === 'h1-01') l.order = 2;
			if (l.id === 'h1-02') l.order = 1;
		}
		await sink.write(b);
		expect(
			(
				await db.query(
					'select id, "order" from lessons where level = 1 and id <> \'h0-00\' order by id'
				)
			).rows
		).toEqual([
			{ id: 'h1-01', order: 2 },
			{ id: 'h1-02', order: 1 }
		]);
	});

	it('is read-only for authenticated by RLS', async () => {
		await sink.write(await loadOk());
		await db.exec('grant select, insert on all tables in schema public to authenticated');
		await db.exec('set role authenticated');
		expect(
			Number(((await db.query('select count(*)::int as n from words')).rows[0] as { n: number }).n)
		).toBeGreaterThan(0);
		await expect(
			db.query(
				"insert into chars (hanzi, radical, ids, strokes, readings) values ('x', 'x', 'x', 1, '[]')"
			)
		).rejects.toThrow(/violates row-level security/);
		await db.exec('reset role');
	});

	it('rolls back the whole import when a statement fails', async () => {
		const a = await loadOk();
		const bad = {
			...a,
			sha: 'b'.repeat(64),
			questions: [...a.questions, { ...a.questions[0], role: 'nope' as 'drill' }]
		};
		await expect(sink.write(bad)).rejects.toThrow();
		expect(await ids('content_versions', 'sha')).toEqual([]);
		expect(await count('words')).toBe(0);
	});
});
