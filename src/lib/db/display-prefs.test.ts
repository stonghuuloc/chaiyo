import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asLearner, migrate } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';

let db: PGlite;
beforeEach(async () => {
	db = new PGlite();
	await migrate(db);
	await db.exec(`insert into auth.users (id) values ('${LINH}')`);
});
afterEach(() => db.close());

const mine = () =>
	db.query<{ show_pinyin: boolean | null; show_meaning: boolean | null }>(
		'select show_pinyin, show_meaning from settings where learner_id = $1',
		[LINH]
	);

describe('settings display pref columns', () => {
	it('Given_NewRow_When_Read_Then_BothNull', async () => {
		// Arrange
		await asLearner(db, LINH);

		// Act
		await db.query("insert into settings (tz) values ('Asia/Ho_Chi_Minh')");

		// Assert
		expect((await mine()).rows[0]).toEqual({ show_pinyin: null, show_meaning: null });
	});

	it('Given_PinyinSet_When_UpsertMeaningOnly_Then_PinyinKept', async () => {
		// Arrange
		await asLearner(db, LINH);
		await db.query('insert into settings (learner_id, show_pinyin) values ($1, false)', [LINH]);

		// Act
		await db.query(
			`insert into settings (learner_id, show_meaning) values ($1, false)
			 on conflict (learner_id) do update set show_meaning = excluded.show_meaning`,
			[LINH]
		);

		// Assert
		expect((await mine()).rows[0]).toEqual({ show_pinyin: false, show_meaning: false });
	});
});
