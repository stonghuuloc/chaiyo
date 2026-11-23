import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { supabasePushSubs } from './push-store';

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

describe('supabasePushSubs', () => {
	it('Given_Lan_When_List_Then_UrlFiltersLearner', async () => {
		const requests: { method: string; url: URL }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push({ method: init?.method ?? 'GET', url: new URL(String(input)) });
			return json([{ endpoint: 'e1', p256dh: 'k1', auth: 'a1' }], 200);
		});
		const subs = await supabasePushSubs(clientWith(fetch)).list('lan');
		expect(subs).toEqual([{ endpoint: 'e1', p256dh: 'k1', auth: 'a1' }]);
		expect(requests).toHaveLength(1);
		expect(requests[0].method).toBe('GET');
		expect(requests[0].url.pathname).toBe('/rest/v1/push_subscriptions');
		expect(requests[0].url.searchParams.get('select')).toBe('endpoint,p256dh,auth');
		expect(requests[0].url.searchParams.get('learner_id')).toBe('eq.lan');
	});

	it('Given_E1_When_Remove_Then_DeleteFiltersLearnerAndEndpoint', async () => {
		const requests: { method: string; url: URL }[] = [];
		const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
			requests.push({ method: init?.method ?? 'GET', url: new URL(String(input)) });
			return new Response(null, { status: 204 });
		});
		await supabasePushSubs(clientWith(fetch)).remove('lan', 'e1');
		expect(requests).toHaveLength(1);
		expect(requests[0].method).toBe('DELETE');
		expect(requests[0].url.searchParams.get('learner_id')).toBe('eq.lan');
		expect(requests[0].url.searchParams.get('endpoint')).toBe('eq.e1');
	});

	it('Given_ErrorBody_When_List_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'boom' }, 500));
		await expect(supabasePushSubs(clientWith(fetch)).list('lan')).rejects.toThrow('boom');
	});

	it('Given_ErrorBody_When_Remove_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ message: 'nope' }, 500));
		await expect(supabasePushSubs(clientWith(fetch)).remove('lan', 'e1')).rejects.toThrow('nope');
	});
});
