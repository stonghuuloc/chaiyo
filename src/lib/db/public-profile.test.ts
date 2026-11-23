import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const NAM = '22222222-2222-2222-2222-222222222222';

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}'), ('${NAM}')`);
	for (const [id, name] of [
		[LINH, 'Linh'],
		[NAM, 'Tống Lộc']
	]) {
		await asLearner(db, id);
		await db.query('insert into profiles (display_name) values ($1)', [name]);
		await asOwner(db);
	}
	await db.query('update profiles set hidden = true where learner_id = $1', [NAM]);
});
afterEach(() => db.close());

describe('public columns on profiles', () => {
	it('Given_NamHidden_When_LinhSelectsNam_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		const r = await db.query('select * from profiles where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(0);
	});

	it('Given_NamHidden_When_NamSelectsOwn_Then_RowWithHandleAndStats', async () => {
		await asLearner(db, NAM);
		const r = await db.query<{ streak: number; badges: string[] }>(
			'select handle, streak, words_week, words_known, hsk, lesson, badges from profiles where learner_id = $1',
			[NAM]
		);
		expect(r.rows).toHaveLength(1);
		expect(r.rows[0]).toMatchObject({
			streak: 0,
			words_week: 0,
			words_known: 0,
			hsk: 1,
			lesson: 0,
			badges: []
		});
		expect(r.fields.map((f) => f.name)).toContain('handle');
	});

	it('Given_NamUnhidden_When_LinhSelectsNam_Then_OneRow', async () => {
		await db.query('update profiles set hidden = false where learner_id = $1', [NAM]);
		await asLearner(db, LINH);
		const r = await db.query('select streak from profiles where learner_id = $1', [NAM]);
		expect(r.rows).toHaveLength(1);
	});
});

describe('leaderboard join', () => {
	const joined = async () =>
		(
			await db.query(
				'select p.learner_id from follows f join profiles p on f.followee_id = p.learner_id'
			)
		).rows;

	it('Given_LinhFollowsHiddenNam_When_JoinFollowsProfiles_Then_ZeroRows', async () => {
		await asLearner(db, LINH);
		await db.query('insert into follows (followee_id) values ($1)', [NAM]);
		expect(await joined()).toHaveLength(0);
	});

	it('Given_NamUnhidden_When_JoinFollowsProfiles_Then_OneRow', async () => {
		await asLearner(db, LINH);
		await db.query('insert into follows (followee_id) values ($1)', [NAM]);
		await asOwner(db);
		await db.query('update profiles set hidden = false where learner_id = $1', [NAM]);
		await asLearner(db, LINH);
		expect(await joined()).toHaveLength(1);
	});
});
