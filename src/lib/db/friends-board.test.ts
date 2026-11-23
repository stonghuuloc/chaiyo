import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from './fresh-db';
import { asLearner, asOwner } from './migrate';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const MINH = '22222222-2222-2222-2222-222222222222';
const LAN = '33333333-3333-3333-3333-333333333333';
const HUY = '44444444-4444-4444-4444-444444444444';
const NAM = '55555555-5555-5555-5555-555555555555';
const QUAN = '66666666-6666-6666-6666-666666666666';
const PEOPLE: [string, string][] = [
	[LINH, 'Linh'],
	[MINH, 'Minh'],
	[LAN, 'Lan'],
	[HUY, 'Huy'],
	[NAM, 'Nam'],
	[QUAN, 'Quân']
];

const code = (p: Promise<unknown>) =>
	p.then(
		() => undefined,
		(e: { code?: string }) => e.code
	);

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(
		`insert into auth.users (id) values ${PEOPLE.map(([id]) => `('${id}')`).join(',')}`
	);
	for (const [id, name] of PEOPLE) {
		await asLearner(db, id);
		await db.query('insert into profiles (display_name) values ($1)', [name]);
	}
	await asLearner(db, LINH);
	for (const id of [MINH, LAN, HUY, NAM])
		await db.query('insert into follows (followee_id) values ($1)', [id]);
	await asOwner(db);
	await db.query('update profiles set hidden = true where learner_id = $1', [NAM]);
});
afterEach(() => db.close());

const profile = async (id: string) => {
	await asOwner(db);
	return (
		await db.query<Record<string, unknown>>('select * from profiles where learner_id = $1', [id])
	).rows[0];
};

describe('stat columns and evidence stamps', () => {
	it('Given_Linh_When_UpdateStreak_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(await code(db.query('update profiles set streak = 99'))).toBe('42501');
	});

	it('Given_Linh_When_InsertWithStreak_Then_42501', async () => {
		await asOwner(db);
		await db.query('delete from profiles where learner_id = $1', [LINH]);
		await asLearner(db, LINH);
		expect(
			await code(db.query("insert into profiles (display_name, streak) values ('Linh', 99)"))
		).toBe('42501');
	});

	it('Given_Linh_When_UpsertNamePhotoHidden_Then_Saved', async () => {
		await asLearner(db, LINH);
		await db.query(
			`insert into profiles (learner_id, display_name, photo_url, hidden) values ($1, 'Mai', null, true)
			on conflict (learner_id) do update set learner_id = excluded.learner_id,
			display_name = excluded.display_name, photo_url = excluded.photo_url, hidden = excluded.hidden`,
			[LINH]
		);
		expect(await profile(LINH)).toMatchObject({ display_name: 'Mai', hidden: true, streak: 0 });
	});

	it('Given_Linh_When_InsertAttemptWithReceivedAt_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(
			await code(
				db.query(
					"insert into attempts (id, question_id, content_sha, ms, at, received_at) values ('a1', 'q', 's', 1, now(), now())"
				)
			)
		).toBe('42501');
	});

	it('Given_Linh_When_InsertSaveWithReceivedAt_Then_42501', async () => {
		await asLearner(db, LINH);
		expect(
			await code(
				db.query(
					"insert into lexicon_saves (word, saved_at, received_at) values ('你', now(), now())"
				)
			)
		).toBe('42501');
	});

	it('Given_Linh_When_PushColsOnConflictDoNothing_Then_Saved', async () => {
		await asLearner(db, LINH);
		await db.query(
			`insert into attempts (learner_id, id, at, question_id, content_sha, word, skill, correct, ms, answer, step, tone)
			values ($1, 'a1', now(), 'q', 's', '你', 'the', true, 1, null, null, null)
			on conflict (learner_id, id) do nothing`,
			[LINH]
		);
		await db.query(
			`insert into lexicon_saves (learner_id, word, saved_at) values ($1, '你', now())
			on conflict (learner_id, word) do nothing`,
			[LINH]
		);
		const r = await db.query<{ n: number }>(
			'select (select count(*) from attempts where received_at is not null)::int + (select count(*) from lexicon_saves where received_at is not null)::int as n'
		);
		expect(r.rows[0].n).toBe(2);
	});
});
