import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const T = '2026-11-16T02:00:00Z';

let db: PGlite;
beforeEach(async () => {
	db = new PGlite();
	await migrate(db);
	await db.exec("insert into auth.users (id) values ('" + LINH + "'), ('" + NAM + "')");
	await db.exec(
		"insert into settings (learner_id, delete_at) values ('" +
			LINH +
			"', '" +
			T +
			"'), ('" +
			NAM +
			"', '" +
			T +
			"')"
	);
});
afterEach(() => db.close());

describe('settings.delete_at', () => {
	it('lets a learner restore her own account', async () => {
		await asLearner(db, LINH);
		const r = await db.query('update settings set delete_at = null where learner_id = $1', [LINH]);
		expect(r.affectedRows).toBe(1);
		const row = await db.query<{ delete_at: Date | null }>(
			'select delete_at from settings where learner_id = $1',
			[LINH]
		);
		expect(row.rows[0].delete_at).toBeNull();
	});

	it("hides and protects another learner's value", async () => {
		await asLearner(db, LINH);
		const read = await db.query('select delete_at from settings where learner_id = $1', [NAM]);
		expect(read.rows).toHaveLength(0);
		const upd = await db.query('update settings set delete_at = null where learner_id = $1', [NAM]);
		expect(upd.affectedRows).toBe(0);
		await asOwner(db);
		const r = await db.query<{ delete_at: Date | null }>(
			'select delete_at from settings where learner_id = $1',
			[NAM]
		);
		expect(r.rows[0].delete_at?.toISOString()).toBe('2026-11-16T02:00:00.000Z');
	});
});
