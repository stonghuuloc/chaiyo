import { PGlite } from '@electric-sql/pglite';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { fixtureRefs } from '../lint/fixtures/refs';
import { audioKey } from './audio';
import { buildBundle } from './bundle';
import { createBundleSink } from './bundle-sink';
import { importContent } from './import';
import { createPostgresSink } from './postgres-sink';
import { createMemorySink } from './sink';

const OK = join(__dirname, 'fixtures/ok');
const MIGRATION = join(
	__dirname,
	'../../../../supabase/migrations/20261105000000_content_tables.sql'
);

let db: PGlite | undefined;
let out: string | undefined;
afterEach(async () => {
	await db?.close();
	if (out) rmSync(out, { recursive: true, force: true });
});

const rows = async <T>(sql: string) => (await db!.query(sql)).rows as T[];

describe('the same content in every sink', () => {
	it(
		'memory, bundle files and Postgres rows agree on every entity',
		{ timeout: 30_000 },
		async () => {
			out = mkdtempSync(join(tmpdir(), 'sinks-'));
			db = new PGlite();
			await db.exec('create role authenticated');
			await db.exec(readFileSync(MIGRATION, 'utf8'));
			const memory = createMemorySink();
			const sinks = [
				memory,
				createBundleSink(out),
				createPostgresSink({
					query: (sql, params) => db!.query(sql, params),
					transaction: (fn) => db!.transaction((tx) => fn((sql, params) => tx.query(sql, params)))
				})
			];
			const shas = new Set<string>();
			for (const sink of sinks) {
				const res = await importContent(OK, sink, { refs: fixtureRefs });
				if ('errors' in res) throw new Error(JSON.stringify(res.errors));
				shas.add(res.sha);
			}
			expect(shas.size).toBe(1);
			const c = memory.content!;

			expect(
				(await rows<{ id: string }>('select id from lessons order by id')).map((r) => r.id)
			).toEqual(c.lessons.map((l) => l.id));
			expect(
				await rows(
					'select id, hanzi, spoken, hanviet, taught_in as "taughtIn" from words order by id'
				)
			).toEqual(
				c.words.map((w) => ({
					id: w.id,
					hanzi: w.hanzi,
					spoken: w.spoken,
					hanviet: w.hanviet,
					taughtIn: w.taughtIn ?? null
				}))
			);
			expect(
				await rows(
					'select id, spoken, seg, audio_key, lesson_id as "lessonId" from sentences order by id'
				)
			).toEqual(
				c.sentences.map((s) => ({
					id: s.id,
					spoken: s.spoken,
					seg: s.seg,
					audio_key: audioKey(s.hanzi, s.speaker ?? 'narrator'),
					lessonId: s.lessonId ?? null
				}))
			);
			expect(await rows('select id, body from questions order by id, lesson_id')).toEqual(
				c.questions.map((q) => ({ id: q.id, body: q.body }))
			);
			expect(await rows('select hanzi, readings from chars order by hanzi')).toEqual(
				c.chars.map((x) => ({ hanzi: x.hanzi, readings: x.readings }))
			);
			expect(await rows('select id, kind, level, "order", title from lessons order by id')).toEqual(
				c.lessons.map((l) => ({
					id: l.id,
					kind: 'kind' in l ? 'primer' : 'lesson',
					level: l.level,
					order: l.order,
					title: l.title
				}))
			);
			expect(
				(await rows<{ id: string }>('select id from grammar_points order by id')).map((r) => r.id)
			).toEqual(c.grammar.map((g) => g.id));

			const dir = join(out, c.sha);
			const files = readdirSync(dir).filter((f) => !f.endsWith('manifest.json'));
			expect(files.sort()).toEqual(c.lessons.map((l) => `${l.id}.json`).sort());
			for (const l of c.lessons)
				expect(JSON.parse(readFileSync(join(dir, `${l.id}.json`), 'utf8'))).toEqual(
					buildBundle(c, l.id)
				);
			expect(JSON.parse(readFileSync(join(out, 'current.json'), 'utf8')).sha).toBe(
				(
					await rows<{ sha: string }>(
						'select sha from content_versions order by imported_at desc limit 1'
					)
				)[0].sha
			);

			const bundles = c.lessons.map((l) => buildBundle(c, l.id));
			const inBundles = <K extends 'words' | 'sentences' | 'chars'>(k: K) =>
				new Set(bundles.flatMap((b) => b[k].map((x) => ('id' in x ? x.id : x.hanzi))));
			expect(c.sentences.map((s) => s.id).filter((id) => !inBundles('sentences').has(id))).toEqual(
				[]
			);
			expect(c.words.map((w) => w.id).filter((id) => !inBundles('words').has(id))).toEqual([]);
			expect(c.chars.map((x) => x.hanzi).filter((h) => !inBundles('chars').has(h))).toEqual([]);
		}
	);
});
