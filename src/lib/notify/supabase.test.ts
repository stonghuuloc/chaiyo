import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/study/fixtures/curriculum';
import { supabaseDeps } from './supabase';
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
	learner: { id: 'learner-a', tz: 'Asia/Ho_Chi_Minh' },
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
				Array.from({ length: n }, (_, i) => ({ learner_id: `l-${i}`, tz: 'Asia/Ho_Chi_Minh' })),
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
