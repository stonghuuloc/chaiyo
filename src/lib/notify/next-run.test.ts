import type { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb } from '#lib/db/fresh-db.js';
import { asLearner, asOwner } from '#lib/db/migrate.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { fakeChannel } from './fake-channel';
import { memoryMarks } from './marks';
import { sendReminders } from './remind';
import { supabaseDeps } from './supabase';
import { noRemind, type Learner, type Rolled } from './tick';

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const LINH = '11111111-1111-1111-1111-111111111111';
const CHAT = 4242;

const json = (body: unknown) =>
	new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});

let db: PGlite;
beforeEach(async () => {
	db = await freshDb();
	await db.exec(`insert into auth.users (id) values ('${LINH}')`);
});
afterEach(() => db.close());

const upsert = (column: string, value: string | boolean) =>
	db.query(
		`insert into settings (learner_id, ${column}) values ($1, $2)
			on conflict (learner_id) do update set ${column} = excluded.${column}`,
		[LINH, value]
	);

const learnerAfterChanges = async (): Promise<Learner> => {
	await asLearner(db, LINH);
	await db.query(`insert into settings (learner_id, tz) values ($1, 'Asia/Ho_Chi_Minh')`, [LINH]);
	const before = await db.query('select reminder_time, remind_email from settings');
	expect(before.rows).toEqual([{ reminder_time: '21:00:00', remind_email: true }]);
	await upsert('reminder_time', '07:00');
	await upsert('remind_email', false);
	const token = await db
		.query<{ telegram_link_token: string }>('select telegram_link_token()')
		.then((r) => r.rows[0].telegram_link_token);
	await db.exec('set role service_role');
	await db.query('select claim_telegram_link($1, $2)', [token, CHAT]);
	await asOwner(db);
	const row = await db.query(
		'select learner_id, tz, reminder_time, remind_push, remind_email, remind_telegram from settings'
	);
	const client = createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch: async () => json(row.rows) }
	});
	const [learner] = await supabaseDeps(client, CURRICULUM, noRemind).learners();
	return learner;
};

const runAt = async (iso: string) => {
	const learner = await learnerAfterChanges();
	const rolled = {
		learner,
		day: '2026-11-23',
		state: { streak: { count: 3, freezes: 0, last: null } },
		events: []
	} as unknown as Rolled;
	const push = fakeChannel('push');
	const email = fakeChannel('email');
	const telegram = fakeChannel('telegram');
	const result = await sendReminders(
		new Date(iso),
		[rolled],
		[push, email, telegram],
		memoryMarks()
	);
	return { result, push, email, telegram };
};

describe('next Notify run after settings change', () => {
	it('Given_2100Email_When_0700EmailOffTelegramOn_Then_LearnerIs0700TelegramOnly', async () => {
		expect(await learnerAfterChanges()).toEqual({
			id: LINH,
			tz: 'Asia/Ho_Chi_Minh',
			remindAt: '07:00',
			channels: ['telegram']
		});
	});

	it('Given_That_When_Run0700Local_Then_OnlyTelegramSent', async () => {
		const { result, push, email, telegram } = await runAt('2026-11-24T00:00:00Z');
		expect(telegram.sent).toHaveLength(1);
		expect(email.sent).toHaveLength(0);
		expect(push.sent).toHaveLength(0);
		expect(result.sent).toEqual([LINH]);
	});

	it('Given_That_When_Run0644Local_Then_NotDue', async () => {
		const { result, telegram } = await runAt('2026-11-23T23:44:00Z');
		expect(result.skipped).toEqual([{ id: LINH, reason: 'not-due' }]);
		expect(telegram.sent).toHaveLength(0);
	});
});
