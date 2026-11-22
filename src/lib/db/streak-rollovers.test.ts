import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const INSERT =
	"insert into public.streak_rollovers (learner_id, day, count, freezes, events) values ($1, '2026-11-22', $2, 0, '[]') on conflict do nothing";

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}')`);
});
afterEach(() => db.close());

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

describe('streak_rollovers', () => {
	it('Given_RowForLearnerDay_When_InsertedAgain_Then_OneRowFirstValuesKept', async () => {
		// Arrange
		await db.query(INSERT, [LINH, 5]);

		// Act
		await db.query(INSERT, [LINH, 9]);

		// Assert
		const { rows } = await db.query<{ count: number }>('select count from public.streak_rollovers');
		expect(rows).toEqual([{ count: 5 }]);
	});

	it('Given_Learner_When_SelectOrInsert_Then_PermissionDenied', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		const read = await code(db.query('select * from public.streak_rollovers'));
		const write = await code(db.query(INSERT, [LINH, 1]));
		await asOwner(db);

		// Assert
		expect(read).toBe('42501');
		expect(write).toBe('42501');
	});

	it('Given_MigrationText_When_Read_Then_ScheduleOnlyInsideExtensionGuardWithNoSecrets', () => {
		// Arrange
		const sql = readFileSync(
			join(import.meta.dirname, '../../../supabase/migrations/20261124000000_notify.sql'),
			'utf8'
		);

		// Act
		const guard = sql.indexOf('pg_available_extensions');
		const end = sql.indexOf('end if');

		// Assert
		expect(guard).toBeGreaterThan(-1);
		for (const needle of ['cron.schedule', "'*/15 * * * *'"]) {
			expect(sql.split(needle)).toHaveLength(2);
			expect(sql.indexOf(needle)).toBeGreaterThan(guard);
			expect(sql.indexOf(needle)).toBeLessThan(end);
		}
		expect(sql).not.toMatch(/http:|https:|eyJ/);
	});
});
