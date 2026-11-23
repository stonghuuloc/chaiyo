import type { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}');
		insert into push_subscriptions (learner_id, endpoint, p256dh, auth)
		values ('${NAM}', 'https://push.example.test/nam', 'k', 'a')`);
});
afterEach(() => db.close());

const insert = (learner: string, endpoint: string) =>
	db.query(
		`insert into push_subscriptions (learner_id, endpoint, p256dh, auth) values ($1, $2, 'k', 'a')
		 on conflict (learner_id, endpoint) do nothing`,
		[learner, endpoint]
	);
const count = (learner: string) =>
	db
		.query<{ n: number }>('select count(*)::int as n from push_subscriptions where learner_id = $1', [
			learner
		])
		.then((r) => r.rows[0].n);

describe('push_subscriptions', () => {
	it('Given_Linh_When_InsertOwn_Then_ReadsOneRow', async () => {
		await asLearner(db, LINH);
		await insert(LINH, 'https://push.example.test/linh');
		const r = await db.query('select * from push_subscriptions where learner_id = $1', [LINH]);
		expect(r.rows).toHaveLength(1);
	});

	it('Given_Linh_When_SelectNams_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		const r = await db.query('select * from push_subscriptions where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(0);
	});

	it('Given_Linh_When_InsertAsNam_Then_Denied', async () => {
		await asLearner(db, LINH);
		await expect(insert(NAM, 'https://push.example.test/forged')).rejects.toMatchObject({
			code: '42501'
		});
	});

	it('Given_Linh_When_DeleteNams_Then_ZeroAffected', async () => {
		await asLearner(db, LINH);
		const r = await db.query('delete from push_subscriptions where learner_id = $1', [NAM]);
		expect(r.affectedRows).toBe(0);
		await asOwner(db);
		expect(await count(NAM)).toBe(1);
	});

	it('Given_Linh_When_DeleteOwn_Then_RowGone', async () => {
		await asLearner(db, LINH);
		await insert(LINH, 'https://push.example.test/linh');
		const r = await db.query('delete from push_subscriptions where learner_id = $1', [LINH]);
		expect(r.affectedRows).toBe(1);
	});

	it('Given_Linh_When_UpdateOwn_Then_Denied', async () => {
		await asLearner(db, LINH);
		await insert(LINH, 'https://push.example.test/linh');
		await expect(
			db.query("update push_subscriptions set p256dh = 'x' where learner_id = $1", [LINH])
		).rejects.toMatchObject({ code: '42501' });
	});

	it('Given_ExistingRow_When_InsertOnConflictDoNothing_Then_OneRow', async () => {
		await asLearner(db, LINH);
		await insert(LINH, 'https://push.example.test/linh');
		await insert(LINH, 'https://push.example.test/linh');
		expect(await count(LINH)).toBe(1);
	});

	it('Given_UserDeleted_When_Owner_Then_RowsGone', async () => {
		await asOwner(db);
		await db.query('delete from auth.users where id = $1', [NAM]);
		expect(await count(NAM)).toBe(0);
	});

	it('Given_LongEndpoint_When_Insert_Then_CheckViolation', async () => {
		await asLearner(db, LINH);
		await expect(insert(LINH, 'h'.repeat(2049))).rejects.toMatchObject({ code: '23514' });
	});
});
