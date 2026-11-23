import { describe, expect, it, vi } from 'vitest';
import type { Channel } from './channel';
import { handlePushTest } from './push-test';

const NOW = new Date('2026-11-23T14:05:00Z');
const post = (auth?: string) =>
	new Request('http://x/functions/v1/push-test', {
		method: 'POST',
		headers: auth ? { authorization: auth } : {}
	});
const channel = (send: Channel['send']): Channel => ({ name: 'push', send });
const cors = (r: Response) => r.headers.get('access-control-allow-origin');

describe('handlePushTest', () => {
	it('Given_Options_When_Handle_Then_204Cors', async () => {
		const res = await handlePushTest(new Request('http://x', { method: 'OPTIONS' }), {
			uid: async () => null,
			channel: null,
			now: () => NOW
		});
		expect(res.status).toBe(204);
		expect(cors(res)).toBe('*');
		expect(res.headers.get('access-control-allow-headers')).toBe(
			'authorization, x-client-info, apikey, content-type'
		);
	});

	it('Given_NoUser_When_Handle_Then_401', async () => {
		const res = await handlePushTest(post(), {
			uid: async () => null,
			channel: channel(vi.fn()),
			now: () => NOW
		});
		expect(res.status).toBe(401);
		expect(cors(res)).toBe('*');
	});

	it('Given_NoChannel_When_Handle_Then_503', async () => {
		const res = await handlePushTest(post('Bearer t'), {
			uid: async () => 'lan',
			channel: null,
			now: () => NOW
		});
		expect(res.status).toBe(503);
		expect(await res.json()).toEqual({ error: 'push not configured' });
		expect(cors(res)).toBe('*');
	});

	it('Given_User_When_Handle_Then_SendsCallerReminder200', async () => {
		const send = vi.fn(async () => {});
		const uid = vi.fn(async () => 'lan');
		const res = await handlePushTest(post('Bearer tok'), {
			uid,
			channel: channel(send),
			now: () => NOW
		});
		expect(uid).toHaveBeenCalledWith('Bearer tok');
		expect(send).toHaveBeenCalledWith({ learnerId: 'lan', day: '2026-11-23' });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
		expect(cors(res)).toBe('*');
	});

	it('Given_SendRejects_When_Handle_Then_502', async () => {
		const res = await handlePushTest(post('Bearer t'), {
			uid: async () => 'lan',
			channel: channel(async () => {
				throw new Error('push: 1 of 1 failed');
			}),
			now: () => NOW
		});
		expect(res.status).toBe(502);
		expect(await res.json()).toEqual({ error: 'push: 1 of 1 failed' });
		expect(cors(res)).toBe('*');
	});
});
