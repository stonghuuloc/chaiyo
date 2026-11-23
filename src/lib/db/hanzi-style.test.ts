import type { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}')`);
});
afterEach(() => db.close());

const mine = () =>
	db.query<{ hanzi_style: string; reminder_time: string }>(
		'select hanzi_style, reminder_time::text as reminder_time from settings where learner_id = $1',
		[LINH]
	);

describe('settings.hanzi_style', () => {
	it('Given_NewRow_When_Read_Then_Kai', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		await db.query("insert into settings (tz) values ('Asia/Ho_Chi_Minh')");

		// Assert
		expect((await mine()).rows[0]?.hanzi_style).toBe('kai');
	});

	it('Given_Owner_When_UpsertXing_Then_ReadsBackAndReminderTimeKept', async () => {
		// Arrange
		await asLearner(db, LINH);
		await db.query('insert into settings (learner_id, reminder_time) values ($1, $2)', [
			LINH,
			'07:00'
		]);

		// Act
		await db.query(
			`insert into settings (learner_id, hanzi_style) values ($1, 'xing')
			 on conflict (learner_id) do update set hanzi_style = excluded.hanzi_style`,
			[LINH]
		);

		// Assert
		expect((await mine()).rows[0]).toEqual({ hanzi_style: 'xing', reminder_time: '07:00:00' });
	});

	it('Given_Abc_When_Upsert_Then_CheckViolation', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		const write = db.query("insert into settings (learner_id, hanzi_style) values ($1, 'abc')", [
			LINH
		]);

		// Assert
		await expect(write).rejects.toThrow(/check/i);
	});
});
