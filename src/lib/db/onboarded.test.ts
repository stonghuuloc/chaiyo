import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const T = '2026-11-10T02:00:00Z';

let db: PGlite;
beforeEach(async () => {
	db = new PGlite();
	await migrate(db);
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}');
		insert into settings (learner_id, onboarded_at) values ('${NAM}', '${T}')`);
});
afterEach(() => db.close());

describe('settings.onboarded_at', () => {
	it('lets a learner write and read back her own value', async () => {
		await asLearner(db, LINH);
		await db.query('insert into settings (learner_id, onboarded_at) values ($1, $2)', [LINH, T]);
		const r = await db.query<{ onboarded_at: Date }>(
			'select onboarded_at from settings where learner_id = $1',
			[LINH]
		);
		expect(r.rows[0].onboarded_at.toISOString()).toBe('2026-11-10T02:00:00.000Z');
	});

	it("hides and protects another learner's value", async () => {
		await asLearner(db, LINH);
		const read = await db.query('select onboarded_at from settings where learner_id = $1', [NAM]);
		expect(read.rows).toHaveLength(0);
		const upd = await db.query('update settings set onboarded_at = now() where learner_id = $1', [
			NAM
		]);
		expect(upd.affectedRows).toBe(0);
		await asOwner(db);
		const r = await db.query<{ onboarded_at: Date }>(
			'select onboarded_at from settings where learner_id = $1',
			[NAM]
		);
		expect(r.rows[0].onboarded_at.toISOString()).toBe('2026-11-10T02:00:00.000Z');
	});
});
