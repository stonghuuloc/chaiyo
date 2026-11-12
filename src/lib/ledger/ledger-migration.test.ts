import { PGlite } from '@electric-sql/pglite';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from '#lib/db/migrate.js';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);
const SAVE = "insert into lexicon_saves (word, saved_at) values ('你', '2026-11-09T02:00:00Z')";
const STEP = { kind: 'gate', lesson: 'h1-01', run: 'r1', of: 10 };

describe('ledger migration', () => {
	let db: PGlite;
	beforeAll(async () => {
		db = new PGlite();
		await migrate(db);
		await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
	});

	it('lexicon_saves: insert once, conflict does nothing, plain repeat is 23505', async () => {
		await asLearner(db, LINH);
		const first = await db.query(`${SAVE} on conflict (learner_id, word) do nothing`);
		const second = await db.query(`${SAVE} on conflict (learner_id, word) do nothing`);
		expect([first.affectedRows, second.affectedRows]).toEqual([1, 0]);
		expect(await code(db.query(SAVE))).toBe('23505');
	});

	it('lexicon_saves: RLS and grants', async () => {
		await asLearner(db, LINH);
		expect(
			await code(
				db.query(
					`insert into lexicon_saves (learner_id, word, saved_at) values ('${NAM}', 'x', now())`
				)
			)
		).toBe('42501');
		expect(await code(db.query("update lexicon_saves set word = 'y'"))).toBe('42501');
		expect(await code(db.query('delete from lexicon_saves'))).toBe('42501');
		await asOwner(db);
		await db.exec(
			`insert into lexicon_saves (learner_id, word, saved_at) values ('${NAM}', '好', now())`
		);
		await asLearner(db, LINH);
		const rows = await db.query<{ word: string }>('select word from lexicon_saves');
		expect(rows.rows).toEqual([{ word: '你' }]);
		await asOwner(db);
		await db.exec('set role anon');
		expect(await code(db.query('select * from lexicon_saves'))).toBe('42501');
		await asOwner(db);
	});

	it('rejects an explicitly pinned attempt under another learner session', async () => {
		await asLearner(db, NAM);
		expect(
			await code(
				db.query(
					`insert into attempts (learner_id, id, question_id, content_sha, correct, ms, at) values ('${LINH}', 'private', 'q', 'sha', true, 1, now()) on conflict (learner_id, id) do nothing`
				)
			)
		).toBe('42501');
		await asOwner(db);
	});

	it('attempts.step stores jsonb and stays append-only', async () => {
		await asLearner(db, LINH);
		await db.query(
			"insert into attempts (id, question_id, content_sha, skill, word, correct, ms, at, step) values ('a-step', 'card:你:the', 'sha1', 'the', '你', true, 1200, '2026-11-09T02:00:00Z', $1)",
			[JSON.stringify(STEP)]
		);
		const row = await db.query<{ step: unknown }>("select step from attempts where id = 'a-step'");
		expect(row.rows[0].step).toEqual(STEP);
		expect(await code(db.query('update attempts set step = null'))).toBe('42501');
		await asOwner(db);
	});
});
