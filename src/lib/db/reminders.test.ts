import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';

let db: PGlite;
beforeEach(async () => {
	db = new PGlite();
	await migrate(db);
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}');
		insert into settings (learner_id) values ('${NAM}')`);
});
afterEach(() => db.close());

const mine = () =>
	db.query<{
		reminder_time: string;
		remind_push: boolean;
		remind_email: boolean;
		remind_telegram: boolean;
	}>(
		'select reminder_time, remind_push, remind_email, remind_telegram from settings where learner_id = $1',
		[LINH]
	);

describe('settings reminder columns', () => {
	it('default to 21:00, email only', async () => {
		await asLearner(db, LINH);
		await db.query("insert into settings (tz) values ('Asia/Ho_Chi_Minh')");
		expect((await mine()).rows[0]).toEqual({
			reminder_time: '21:00:00',
			remind_push: false,
			remind_email: true,
			remind_telegram: false
		});
	});

	it('upsert reads back', async () => {
		await asLearner(db, LINH);
		const up = (time: string) =>
			db.query(
				`insert into settings (learner_id, reminder_time, remind_push, remind_email, remind_telegram)
				 values ($1, $2, false, true, false)
				 on conflict (learner_id) do update set reminder_time = excluded.reminder_time`,
				[LINH, time]
			);
		await up('21:00');
		await up('07:00');
		expect((await mine()).rows[0]).toEqual({
			reminder_time: '07:00:00',
			remind_push: false,
			remind_email: true,
			remind_telegram: false
		});
	});

	it("cannot read another learner's settings", async () => {
		await asLearner(db, LINH);
		const r = await db.query('select * from settings where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(0);
	});

	it("cannot change another learner's settings", async () => {
		await asLearner(db, LINH);
		const r = await db.query('update settings set remind_push = true where learner_id = $1', [NAM]);
		expect(r.affectedRows).toBe(0);
		await asOwner(db);
		const row = await db.query<{ remind_push: boolean }>(
			'select remind_push from settings where learner_id = $1',
			[NAM]
		);
		expect(row.rows[0].remind_push).toBe(false);
	});
});

describe('profiles.photo_url size', () => {
	const save = (n: number) =>
		db.query("insert into profiles (display_name, photo_url) values ('Linh', $1)", ['a'.repeat(n)]);

	it('rejects 100 001 characters with 23514', async () => {
		await asLearner(db, LINH);
		await expect(save(100_001)).rejects.toMatchObject({ code: '23514' });
	});

	it('accepts 100 000 characters', async () => {
		await asLearner(db, LINH);
		await save(100_000);
		const r = await db.query<{ n: number }>('select length(photo_url) as n from profiles');
		expect(r.rows[0].n).toBe(100_000);
	});
});
