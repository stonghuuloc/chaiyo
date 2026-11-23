import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { base64UrlToBytes, disablePush, enablePush } from './subscribe';

const KEY =
	'BEl62iUYgUivxIkv69yViEuiBIa-ib37J8xYjE6XSbpmsAeJjDaZnzKCc1l6dQmFVyfmXclMiDaM2p9tJhJ3CzQ';
const UID = 'lan';

type Req = { method: string; url: URL; body: unknown };
function harness() {
	const requests: Req[] = [];
	const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		requests.push({
			method: init?.method ?? 'GET',
			url: new URL(String(input)),
			body: init?.body ? JSON.parse(String(init.body)) : undefined
		});
		return new Response(null, { status: 201 });
	});
	const client = createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch }
	});
	const to = (table: string, method: string) =>
		requests.filter((r) => r.method === method && r.url.pathname === `/rest/v1/${table}`);
	return { requests, client, to };
}

function fakeRegistration(existing = false) {
	const unsubscribe = vi.fn(async () => true);
	const subscription = {
		endpoint: 'https://push.example.test/e1',
		toJSON: () => ({
			endpoint: 'https://push.example.test/e1',
			keys: { p256dh: 'pk', auth: 'ak' }
		}),
		unsubscribe
	};
	const subscribe = vi.fn<(o: PushSubscriptionOptionsInit) => Promise<typeof subscription>>(
		async () => subscription
	);
	const getSubscription = vi.fn(async () => (existing ? subscription : null));
	const registration = {
		pushManager: { subscribe, getSubscription }
	} as unknown as ServiceWorkerRegistration;
	return { registration, subscribe, unsubscribe, getSubscription };
}

const granted = async () => 'granted' as const;

describe('enablePush', () => {
	it('Given_Granted_When_Enable_Then_SubscribesUpsertsRowAndFlag', async () => {
		const h = harness();
		const r = fakeRegistration();
		const result = await enablePush({
			registration: r.registration,
			client: h.client,
			uid: UID,
			key: KEY,
			requestPermission: granted
		});
		expect(result).toBe('on');
		const opts = r.subscribe.mock.calls[0][0];
		expect(opts.userVisibleOnly).toBe(true);
		expect(Array.from(new Uint8Array(opts.applicationServerKey as ArrayBuffer))).toEqual(
			Array.from(base64UrlToBytes(KEY))
		);
		const rows = h.to('push_subscriptions', 'POST');
		expect(rows).toHaveLength(1);
		expect(rows[0].body).toEqual({
			learner_id: UID,
			endpoint: 'https://push.example.test/e1',
			p256dh: 'pk',
			auth: 'ak'
		});
		expect(rows[0].url.searchParams.get('on_conflict')).toBe('learner_id,endpoint');
		const flag = h.to('settings', 'POST');
		expect(flag).toHaveLength(1);
		expect(flag[0].body).toEqual({ learner_id: UID, remind_push: true });
	});

	it('Given_SameEndpointTwice_When_Enable_Then_OnBothTimes', async () => {
		const h = harness();
		const r = fakeRegistration();
		const run = () =>
			enablePush({
				registration: r.registration,
				client: h.client,
				uid: UID,
				key: KEY,
				requestPermission: granted
			});
		expect(await run()).toBe('on');
		expect(await run()).toBe('on');
		expect(h.to('push_subscriptions', 'POST')).toHaveLength(2);
	});

	it('Given_Denied_When_Enable_Then_NoWrites', async () => {
		const h = harness();
		const r = fakeRegistration();
		const result = await enablePush({
			registration: r.registration,
			client: h.client,
			uid: UID,
			key: KEY,
			requestPermission: async () => 'denied'
		});
		expect(result).toBe('denied');
		expect(h.requests).toHaveLength(0);
		expect(r.subscribe).not.toHaveBeenCalled();
	});

	it('Given_Default_When_Enable_Then_Denied', async () => {
		const h = harness();
		const result = await enablePush({
			registration: fakeRegistration().registration,
			client: h.client,
			uid: UID,
			key: KEY,
			requestPermission: async () => 'default'
		});
		expect(result).toBe('denied');
		expect(h.requests).toHaveLength(0);
	});

	it('Given_NoPushManager_When_Enable_Then_Unsupported', async () => {
		const h = harness();
		const requestPermission = vi.fn(granted);
		const result = await enablePush({
			registration: {} as ServiceWorkerRegistration,
			client: h.client,
			uid: UID,
			key: KEY,
			requestPermission
		});
		expect(result).toBe('unsupported');
		expect(h.requests).toHaveLength(0);
		expect(requestPermission).not.toHaveBeenCalled();
	});

	it('Given_NoKey_When_Enable_Then_Unsupported', async () => {
		const h = harness();
		const result = await enablePush({
			registration: fakeRegistration().registration,
			client: h.client,
			uid: UID,
			key: '',
			requestPermission: granted
		});
		expect(result).toBe('unsupported');
		expect(h.requests).toHaveLength(0);
	});
});

describe('disablePush', () => {
	it('Given_Subscribed_When_Disable_Then_UnsubscribesDeletesAndFlagOff', async () => {
		const h = harness();
		const r = fakeRegistration(true);
		await disablePush({ registration: r.registration, client: h.client, uid: UID });
		expect(r.unsubscribe).toHaveBeenCalledTimes(1);
		const del = h.to('push_subscriptions', 'DELETE');
		expect(del).toHaveLength(1);
		expect(del[0].url.searchParams.get('learner_id')).toBe('eq.lan');
		expect(del[0].url.searchParams.get('endpoint')).toBe('eq.https://push.example.test/e1');
		expect(h.to('settings', 'POST')[0].body).toEqual({ learner_id: UID, remind_push: false });
	});

	it('Given_NoSubscription_When_Disable_Then_OnlyFlagOff', async () => {
		const h = harness();
		const r = fakeRegistration(false);
		await disablePush({ registration: r.registration, client: h.client, uid: UID });
		expect(r.unsubscribe).not.toHaveBeenCalled();
		expect(h.to('push_subscriptions', 'DELETE')).toHaveLength(0);
		expect(h.to('settings', 'POST')[0].body).toEqual({ learner_id: UID, remind_push: false });
	});
});

describe('base64UrlToBytes', () => {
	it('Given_Key_When_Decode_Then_65Bytes', () => {
		const bytes = base64UrlToBytes(KEY);
		expect(bytes).toHaveLength(65);
		expect(bytes[0]).toBe(0x04);
	});
});
