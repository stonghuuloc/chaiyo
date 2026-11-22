import { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const MIGRATIONS = join(import.meta.dirname, '../../../supabase/migrations');
const CONTENT_TABLES = [
	'content_versions',
	'chars',
	'lessons',
	'words',
	'word_chars',
	'sentences',
	'grammar_points',
	'lesson_words',
	'lesson_grammar',
	'questions'
];
const ON_CONFLICT =
	"insert into attempts (id, question_id, content_sha, ms, at) values ('a-001', 'card:你:the', 'sha1', 1200, '2026-11-09T02:00:00Z') on conflict (learner_id, id) do nothing";

async function seed(db: PGlite) {
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
	for (const [id, name] of [
		[LINH, 'Linh'],
		[NAM, 'Nam']
	]) {
		await asLearner(db, id);
		await db.query(
			"insert into attempts (id, question_id, content_sha, skill, word, correct, ms, at) values ($1, 'card:你:the', 'sha1', 'the', '你', true, 1200, '2026-11-09T02:00:00Z')",
			[`${name}-1`]
		);
		await asOwner(db);
	}
	await db.exec(
		`insert into lessons (id, level, "order", title, title_hanzi, sections) values ('h1-01', 1, 1, 'Hello', '你好', '[]');
		insert into words (id, hanzi, pinyin, spoken, hanviet, level, data) values ('你好', '你好', 'nǐ hǎo', 'ni hao', 'nhĩ hảo', 1, '{}')`
	);
}

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

const GRANTS = '20261110000100_learner_grants.sql';
const HOSTED_DEFAULTS = `grant all on ${CONTENT_TABLES.join(', ')} to anon, authenticated;`;

async function withMigrations(edit: (dir: string) => void, run: (bare: PGlite) => Promise<void>) {
	const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
	const bare = new PGlite();
	try {
		for (const f of readdirSync(MIGRATIONS)) cpSync(join(MIGRATIONS, f), join(dir, f));
		edit(dir);
		await migrate(bare, dir);
		await seed(bare);
		await run(bare);
	} finally {
		await bare.close();
		rmSync(dir, { recursive: true });
	}
}

const withHostedDefaults = (dir: string) =>
	writeFileSync(join(dir, '20261105000001_hosted_defaults.sql'), HOSTED_DEFAULTS);
const editGrants = (dir: string, strip: RegExp) => {
	const file = join(dir, GRANTS);
	writeFileSync(file, readFileSync(file, 'utf8').replace(strip, ''));
};

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await seed(db);
});
afterEach(() => db.close());

describe('learner grants', () => {
	it('attempts are append-only', async () => {
		const before = (await db.query('select * from attempts where id = $1', ['Linh-1'])).rows;
		await asLearner(db, LINH);
		expect(await code(db.query("update attempts set correct = false where id = 'Linh-1'"))).toBe(
			'42501'
		);
		expect(await code(db.query("delete from attempts where id = 'Linh-1'"))).toBe('42501');
		expect(await code(db.query('truncate attempts'))).toBe('42501');
		await asOwner(db);
		expect((await db.query('select * from attempts where id = $1', ['Linh-1'])).rows).toEqual(
			before
		);
	});

	it('without the grants file the same statements silently match 0 rows', async () => {
		await withMigrations(
			(dir) => rmSync(join(dir, GRANTS)),
			async (bare) => {
				await asLearner(bare, LINH);
				expect(
					(await bare.query("update attempts set correct = false where id = 'Linh-1'")).affectedRows
				).toBe(0);
				expect((await bare.query("delete from attempts where id = 'Linh-1'")).affectedRows).toBe(0);
			}
		);
	});

	it('attempt insert is idempotent by id', async () => {
		await asLearner(db, LINH);
		expect((await db.query(ON_CONFLICT)).affectedRows).toBe(1);
		expect((await db.query(ON_CONFLICT)).affectedRows).toBe(0);
		expect(
			await code(
				db.query(
					"insert into attempts (id, question_id, content_sha, ms, at) values ('a-001', 'q', 's', 1, now())"
				)
			)
		).toBe('23505');
		expect(
			(await db.query("select count(*)::int as n from attempts where id = 'a-001'")).rows
		).toEqual([{ n: 1 }]);
		await asLearner(db, NAM);
		expect((await db.query(ON_CONFLICT)).affectedRows).toBe(1);
		await asOwner(db);
		const rows = (
			await db.query<{ learner_id: string }>("select learner_id from attempts where id = 'a-001'")
		).rows;
		expect(rows.map((r) => r.learner_id).sort()).toEqual([LINH, NAM]);
	});

	it('content tables are read-only for learners', async () => {
		await asLearner(db, LINH);
		expect((await db.query('select id from lessons')).rows).toEqual([{ id: 'h1-01' }]);
		expect((await db.query('select id from words')).rows).toEqual([{ id: '你好' }]);
		expect(await code(db.query("update lessons set title = 'x'"))).toBe('42501');
		expect(await code(db.query('delete from lessons'))).toBe('42501');
		for (const t of CONTENT_TABLES)
			expect(await code(db.query(`insert into ${t} default values`)), t).toBe('42501');
		await asOwner(db);
		expect((await db.query('select title from lessons where id = $1', ['h1-01'])).rows).toEqual([
			{ title: 'Hello' }
		]);
	});

	it('the content revoke is what blocks writes when the host grants them by default', async () => {
		await withMigrations(withHostedDefaults, async (bare) => {
			await asLearner(bare, LINH);
			expect(await code(bare.query("update lessons set title = 'x'"))).toBe('42501');
			expect(await code(bare.query('delete from lessons'))).toBe('42501');
		});
		await withMigrations(
			(dir) => {
				withHostedDefaults(dir);
				editGrants(dir, /revoke insert[\s\S]*?from anon, authenticated;\n/);
			},
			async (bare) => {
				await asLearner(bare, LINH);
				expect((await bare.query("update lessons set title = 'x'")).affectedRows).toBe(0);
				expect((await bare.query('delete from lessons')).affectedRows).toBe(0);
			}
		);
	});

	it('without grant select, learners cannot read content', async () => {
		await withMigrations(
			(dir) => editGrants(dir, /grant select on[\s\S]*$/),
			async (bare) => {
				await asLearner(bare, LINH);
				expect(await code(bare.query('select id from lessons'))).toBe('42501');
			}
		);
	});
});
