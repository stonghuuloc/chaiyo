import { PGlite } from '@electric-sql/pglite';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';

const attempt = (name: string) => [
	`${name}-1`,
	'card:你:the',
	'sha1',
	'the',
	'你',
	true,
	1200,
	'2026-11-09T02:00:00Z'
];
const INSERT_ATTEMPT =
	'insert into attempts (id, question_id, content_sha, skill, word, correct, ms, at) values ($1,$2,$3,$4,$5,$6,$7,$8)';

let db: PGlite;
beforeEach(async () => {
	db = new PGlite();
	await migrate(db);
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
	for (const [id, name] of [
		[LINH, 'Linh'],
		[NAM, 'Nam']
	]) {
		await asLearner(db, id);
		await db.query('insert into profiles (display_name) values ($1)', [name]);
		await db.exec('insert into settings default values');
		await db.query(INSERT_ATTEMPT, attempt(name));
		await asOwner(db);
	}
});
afterEach(() => db.close());

const ids = async (table: string) =>
	(await db.query<{ learner_id: string }>(`select learner_id from ${table}`)).rows.map(
		(r) => r.learner_id
	);
const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string; column?: string }) => e
	);

describe('learner tables', () => {
	it('migrations apply cleanly', async () => {
		const fresh = new PGlite();
		const files = await migrate(fresh);
		expect(files[0]).toBe('20261105000000_content_tables.sql');
		expect(files).toContain('20261110000000_learner_tables.sql');
		const { rows } = await fresh.query<{ relrowsecurity: boolean }>(
			"select relname, relrowsecurity from pg_class where relname in ('profiles','attempts','settings','follows')"
		);
		expect(rows).toHaveLength(4);
		expect(rows.every((r) => r.relrowsecurity)).toBe(true);
		await fresh.close();

		const dir = mkdtempSync(join(tmpdir(), 'migrations-'));
		const src = join(import.meta.dirname, '../../../supabase/migrations');
		for (const f of readdirSync(src)) cpSync(join(src, f), join(dir, f));
		writeFileSync(join(dir, 'zz_bad.sql'), 'create tabel x ();');
		const bad = new PGlite();
		await expect(migrate(bad, dir)).rejects.toThrow('zz_bad.sql');
		await bad.close();
		rmSync(dir, { recursive: true });
	});

	it('a learner reads only her own rows', async () => {
		await asLearner(db, LINH);
		expect(await ids('attempts')).toEqual([LINH]);
		expect(await ids('settings')).toEqual([LINH]);
		await asLearner(db, NAM);
		expect(await ids('attempts')).toEqual([NAM]);
		expect(await ids('settings')).toEqual([NAM]);
	});

	it('shows hidden = false profiles to everyone and hides the rest', async () => {
		await asLearner(db, LINH);
		expect((await ids('profiles')).sort()).toEqual([LINH, NAM]);
		await asLearner(db, NAM);
		await db.exec('update profiles set hidden = true');
		await asLearner(db, LINH);
		expect(await ids('profiles')).toEqual([LINH]);
	});

	it("a learner cannot write to another learner's rows", async () => {
		const snapshot = async () => ({
			settings: (await db.query('select * from settings where learner_id = $1', [NAM])).rows,
			profiles: (await db.query('select * from profiles where learner_id = $1', [NAM])).rows,
			attempts: (await db.query('select * from attempts where learner_id = $1', [NAM])).rows
		});
		const before = await snapshot();
		await asLearner(db, LINH);
		const inserts = [
			db.query(
				'insert into attempts (learner_id, id, question_id, content_sha, ms, at) values ($1, $2, $3, $4, $5, now())',
				[NAM, 'x', 'q', 's', 1]
			),
			db.query('insert into settings (learner_id) values ($1)', [NAM]),
			db.query('insert into profiles (learner_id) values ($1)', [NAM]),
			db.query('insert into follows (follower_id, followee_id) values ($1, $2)', [NAM, LINH])
		];
		for (const p of inserts) expect((await code(p))?.code).toBe('42501');
		const upd = await db.query("update settings set tz = 'UTC' where learner_id = $1", [NAM]);
		expect(upd.affectedRows).toBe(0);
		expect((await code(db.query('update settings set learner_id = $1', [NAM])))?.code).toBe(
			'42501'
		);
		await asOwner(db);
		expect(await snapshot()).toEqual(before);
	});

	it('follows are private to the follower and settings and profiles cannot be deleted', async () => {
		await asLearner(db, NAM);
		await db.query('insert into follows (followee_id) values ($1)', [LINH]);
		await asLearner(db, LINH);
		expect((await db.query('select * from follows')).rows).toHaveLength(0);
		expect((await db.query('delete from follows')).affectedRows).toBe(0);
		expect((await db.query('delete from settings')).affectedRows).toBe(0);
		expect((await db.query('delete from profiles')).affectedRows).toBe(0);
		await asOwner(db);
		expect((await db.query('select * from follows')).rows).toHaveLength(1);
		expect((await db.query('select * from settings')).rows).toHaveLength(2);
		expect((await db.query('select * from profiles')).rows).toHaveLength(2);
	});

	it('attempts record which content they answered', async () => {
		await asLearner(db, LINH);
		const run = (cols: string, vals: unknown[]) =>
			code(
				db.query(
					`insert into attempts (${cols}, ms, at) values (${vals.map((_, i) => '$' + (i + 1)).join(',')}, 1, now())`,
					vals
				)
			);
		const noQuestion = await run('id, content_sha', ['a', 's']);
		expect([noQuestion?.code, noQuestion?.column]).toEqual(['23502', 'question_id']);
		const noSha = await run('id, question_id', ['b', 'q']);
		expect([noSha?.code, noSha?.column]).toEqual(['23502', 'content_sha']);
		expect(await run('id, question_id, content_sha', ['c', 'q', 's'])).toBeUndefined();
		expect(
			(await run('id, question_id, content_sha, skill, word', ['d', 'q', 's', 'listen', 'w']))?.code
		).toBe('23514');
		expect((await run('id, question_id, content_sha, skill', ['e', 'q', 's', 'the']))?.code).toBe(
			'23514'
		);
		expect((await db.query('select 1 from attempts where id = $1', ['c'])).rows).toHaveLength(1);
	});
});
