import type { PGlite } from '@electric-sql/pglite';
import { freshDb } from './fresh-db';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';
const ID = '33333333-3333-3333-3333-333333333333';

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
});
afterEach(() => db.close());

type Row = {
	learner_id: string;
	lesson_id: string | null;
	step_id: string | null;
	word_id: string | null;
	content_sha: string;
	category: string;
	note: string | null;
	status: string;
};

const report = (over: Record<string, string | null> = {}) => {
	const row: Record<string, string | null> = {
		id: ID,
		lesson_id: 'h1-01',
		step_id: 'w03',
		word_id: '你好',
		content_sha: 'sha1',
		category: 'hanviet',
		note: 'Hán Việt lệch',
		created_at: '2026-11-16T09:00:00.000Z',
		...over
	};
	const cols = Object.keys(row);
	return db.query(
		`insert into error_reports (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')})`,
		cols.map((c) => row[c])
	);
};
const stored = async () =>
	(
		await (asOwner(db),
		db.query<Row>(
			'select learner_id, lesson_id, step_id, word_id, content_sha, category, note, status from error_reports'
		))
	).rows;

describe('error_reports', () => {
	it('stores a lesson-step report as new', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		await report();

		// Assert
		await asOwner(db);
		expect(await stored()).toEqual([
			{
				learner_id: LINH,
				lesson_id: 'h1-01',
				step_id: 'w03',
				word_id: '你好',
				content_sha: 'sha1',
				category: 'hanviet',
				note: 'Hán Việt lệch',
				status: 'new'
			}
		]);
	});

	it('stores a word-page report with no lesson', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		await report({ lesson_id: null, step_id: null });

		// Assert
		await asOwner(db);
		const rows = await stored();
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ lesson_id: null, step_id: null, word_id: '你好' });
	});

	it('learner cannot spoof, read, change or resolve', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act / Assert
		await expect(
			db.query(
				`insert into error_reports (id, learner_id, content_sha, category, created_at)
				 values ('${ID}', '${NAM}', 'sha1', 'other', now())`
			)
		).rejects.toMatchObject({ code: '42501' });
		await expect(report({ status: 'resolved' })).rejects.toMatchObject({ code: '42501' });
		await expect(db.query('select * from error_reports')).resolves.toMatchObject({ rows: [] });
		await expect(db.query("update error_reports set note = 'x'")).rejects.toMatchObject({
			code: '42501'
		});
		await expect(db.query('delete from error_reports')).rejects.toMatchObject({ code: '42501' });
	});

	it('replayed id is a duplicate', async () => {
		// Arrange
		await asLearner(db, LINH);
		await report();

		// Act / Assert
		await expect(report()).rejects.toMatchObject({ code: '23505' });
		await asOwner(db);
		expect(await stored()).toHaveLength(1);
	});

	it('rejects a sixth category and a lesson without a step', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act / Assert
		await expect(report({ category: 'spelling' })).rejects.toMatchObject({ code: '23514' });
		await expect(report({ step_id: null })).rejects.toMatchObject({ code: '23514' });
	});
});
