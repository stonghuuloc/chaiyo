import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { supabaseDeps, supabaseMarks } from './supabase';
import { noRemind, type Rolled } from './tick';

const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const clientWith = (fetch: typeof globalThis.fetch) =>
	createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch }
	});
const rolled = {
	learner: { id: 'learner-a', tz: 'Asia/Ho_Chi_Minh', channels: [], remindAt: '21:00' },
	day: '2026-11-22',
	state: { streak: { count: 0, freezes: 0 } },
	events: [{ type: 'StreakReset', day: '2026-11-22' }]
} as unknown as Rolled;

describe('supabaseDeps', () => {
	it('Given_1001Settings_When_Learners_Then_TwoPagesOfRequests', async () => {
		// Arrange
		const urls: string[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			const url = new URL(String(input));
			urls.push(url.search);
			const n = Number(url.searchParams.get('offset')) === 0 ? 1000 : 1;
			return json(
				Array.from({ length: n }, (_, i) => ({
					learner_id: `l-${i}`,
					tz: 'Asia/Ho_Chi_Minh',
					reminder_time: '21:00:00',
					remind_push: false,
					remind_email: true,
					remind_telegram: false
				})),
				200
			);
		});
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		const learners = await deps.learners();

		// Assert
		expect(learners).toHaveLength(1001);
		expect(urls).toHaveLength(2);
		expect(urls[1]).toContain('offset=1000&limit=1000');
		expect(urls[0]).toContain('order=learner_id');
	});

	it('Given_FlagRows_When_Learners_Then_ChannelsFromTrueFlags', async () => {
		// Arrange
		const row = (id: string, push: boolean, email: boolean, telegram: boolean) => ({
			learner_id: id,
			tz: 'Asia/Ho_Chi_Minh',
			reminder_time: '21:00:00',
			remind_push: push,
			remind_email: email,
			remind_telegram: telegram
		});
		const fetch = vi.fn(async () =>
			json(
				[row('a', false, true, true), row('b', false, false, false), row('c', true, true, true)],
				200
			)
		);
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		const learners = await deps.learners();

		// Assert
		expect(learners.map((l) => l.channels)).toEqual([
			['email', 'telegram'],
			[],
			['push', 'email', 'telegram']
		]);
	});

	it('Given_ReminderTimeRow_When_Learners_Then_RemindAtHhMm', async () => {
		// Arrange
		const fetch = vi.fn(async () =>
			json(
				[
					{
						learner_id: 'a',
						tz: 'Asia/Ho_Chi_Minh',
						reminder_time: '07:30:00',
						remind_push: true,
						remind_email: false,
						remind_telegram: false
					}
				],
				200
			)
		);
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		const learners = await deps.learners();

		// Assert
		expect(learners.map((l) => l.remindAt)).toEqual(['07:30']);
	});

	it('Given_Learners_When_Read_Then_SelectNamesReminderTimeAndFlagColumns', async () => {
		// Arrange
		const urls: URL[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL) => {
			urls.push(new URL(String(input)));
			return json([], 200);
		});
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		await deps.learners();

		// Assert
		expect(urls[0].searchParams.get('select')?.replaceAll(' ', '')).toBe(
			'learner_id,tz,reminder_time,remind_push,remind_email,remind_telegram'
		);
	});

	it('Given_Rolled_When_Record_Then_UpsertIgnoresDuplicates', async () => {
		// Arrange
		const seen: { url: URL; init?: RequestInit }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			seen.push({ url: new URL(String(input)), init });
			return json(null, 201);
		});
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		await deps.record(rolled);

		// Assert
		const post = seen[0];
		expect(post.url.pathname).toBe('/rest/v1/streak_rollovers');
		expect(post.url.searchParams.get('on_conflict')).toBe('learner_id,day');
		expect(new Headers(post.init?.headers).get('prefer')).toContain('resolution=ignore-duplicates');
		expect(JSON.parse(String(post.init?.body))).toEqual({
			learner_id: 'learner-a',
			day: '2026-11-22',
			count: 0,
			freezes: 0,
			events: [{ type: 'StreakReset', day: '2026-11-22' }]
		});
	});

	it('Given_Server500_When_Record_Then_Throws', async () => {
		// Arrange
		const fetch = vi.fn(async () => json({ message: 'boom' }, 500));
		const deps = supabaseDeps(clientWith(fetch as typeof globalThis.fetch), CURRICULUM, noRemind);

		// Act
		const act = deps.record(rolled);

		// Assert
		await expect(act).rejects.toThrow('boom');
	});
});

describe('supabaseMarks', () => {
	it('Given_FreshDay_When_Claim_Then_TrueAndUpsertShape', async () => {
		// Arrange
		const seen: { url: URL; init?: RequestInit }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			seen.push({ url: new URL(String(input)), init });
			return json([{ learner_id: 'minh' }], 201);
		});
		const marks = supabaseMarks(clientWith(fetch as typeof globalThis.fetch));

		// Act
		const claimed = await marks.claim('minh', '2026-11-23');

		// Assert
		const post = seen[0];
		const prefer = new Headers(post.init?.headers).get('prefer');
		expect(claimed).toBe(true);
		expect(post.url.pathname).toBe('/rest/v1/reminders_sent');
		expect(post.url.searchParams.get('on_conflict')).toBe('learner_id,day');
		expect(prefer).toContain('resolution=ignore-duplicates');
		expect(prefer).toContain('return=representation');
		expect(JSON.parse(String(post.init?.body))).toEqual({
			learner_id: 'minh',
			day: '2026-11-23'
		});
	});

	it('Given_ExistingMarker_When_Claim_Then_False', async () => {
		// Arrange
		const fetch = vi.fn(async () => json([], 201));
		const marks = supabaseMarks(clientWith(fetch as typeof globalThis.fetch));

		// Act
		const claimed = await marks.claim('minh', '2026-11-23');

		// Assert
		expect(claimed).toBe(false);
	});

	it('Given_Server500_When_Claim_Then_Throws', async () => {
		// Arrange
		const fetch = vi.fn(async () => json({ message: 'boom' }, 500));
		const marks = supabaseMarks(clientWith(fetch as typeof globalThis.fetch));

		// Act
		const act = marks.claim('minh', '2026-11-23');

		// Assert
		await expect(act).rejects.toThrow('boom');
	});
});
