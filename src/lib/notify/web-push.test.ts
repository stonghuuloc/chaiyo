import { describe, expect, it, vi } from 'vitest';
import {
	REMINDER_PUSH,
	isPushEndpoint,
	webPushChannel,
	type PushPost,
	type PushSub,
	type PushSubs
} from './web-push';

const ep = (n: string) => `https://fcm.googleapis.com/fcm/send/${n}`;

const sub = (n: string): PushSub => ({ endpoint: ep(n), p256dh: `${n}-k`, auth: `${n}-a` });

function inMemory(initial: Record<string, PushSub[]>) {
	const rows = new Map(Object.entries(initial));
	const list = vi.fn(async (id: string) => [...(rows.get(id) ?? [])]);
	const remove = vi.fn(async (id: string, endpoint: string) => {
		rows.set(
			id,
			(rows.get(id) ?? []).filter((s) => s.endpoint !== endpoint)
		);
	});
	const subs: PushSubs = { list, remove };
	return { subs, list, remove };
}

const script = (statuses: Record<string, number | Error>) =>
	vi.fn<PushPost>(async (s) => {
		const v = statuses[s.endpoint.split('/').pop()!] ?? 201;
		if (v instanceof Error) throw v;
		return v;
	});

const reminder = { learnerId: 'lan', day: '2026-11-23' };

describe('webPushChannel', () => {
	it('Given_TwoSubs_When_Send_Then_TwoPostsWithPayload', async () => {
		const { subs, list } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({});
		const channel = webPushChannel({ subs, post });
		await channel.send(reminder);
		expect(channel.name).toBe('push');
		expect(post).toHaveBeenCalledTimes(2);
		expect(post.mock.calls.map(([s]) => s.endpoint)).toEqual([ep('e1'), ep('e2')]);
		const body =
			'{"title":"Chaiyo!","body":"Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!","url":"/today"}';
		expect(post.mock.calls.map(([, b]) => b)).toEqual([body, body]);
		expect(JSON.parse(body)).toEqual(REMINDER_PUSH);
		expect(list.mock.calls).toEqual([['lan']]);
	});

	it('Given_NoSubs_When_Send_Then_RejectsNoDeviceReached', async () => {
		const { subs } = inMemory({});
		const post = script({});
		await expect(
			webPushChannel({ subs, post }).send({ ...reminder, learnerId: 'huy' })
		).rejects.toThrow('push: no device reached');
		expect(post).not.toHaveBeenCalled();
	});

	it('Given_410_When_Send_Then_RemovedAndNextSendSkipsIt', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: 410 });
		const channel = webPushChannel({ subs, post });
		await expect(channel.send(reminder)).resolves.toBeUndefined();
		expect(remove.mock.calls).toEqual([['lan', ep('e1')]]);
		post.mockClear();
		await channel.send(reminder);
		expect(post.mock.calls.map(([s]) => s.endpoint)).toEqual([ep('e2')]);
	});

	it('Given_404_When_Send_Then_Removed', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1')] });
		await expect(
			webPushChannel({ subs, post: script({ e1: 404 }) }).send(reminder)
		).rejects.toThrow('push: no device reached');
		expect(remove.mock.calls).toEqual([['lan', ep('e1')]]);
	});

	it('Given_500And201_When_Send_Then_KeepsRowTriesBothResolves', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: 500, e2: 201 });
		await expect(webPushChannel({ subs, post }).send(reminder)).resolves.toBeUndefined();
		expect(post).toHaveBeenCalledTimes(2);
		expect(remove).not.toHaveBeenCalled();
	});

	it('Given_PostThrowsAnd201_When_Send_Then_Resolves', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: new Error('network'), e2: 201 });
		await expect(webPushChannel({ subs, post }).send(reminder)).resolves.toBeUndefined();
		expect(post).toHaveBeenCalledTimes(2);
		expect(remove).not.toHaveBeenCalled();
	});

	it('Given_EveryPostFails_When_Send_Then_Rejects', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: 500, e2: new Error('network') });
		await expect(webPushChannel({ subs, post }).send(reminder)).rejects.toThrow(
			'push: 2 of 2 failed'
		);
		expect(remove).not.toHaveBeenCalled();
	});

	it('Given_NonPushEndpoints_When_Send_Then_NoPostAndRowsRemoved', async () => {
		const bad = [
			'http://fcm.googleapis.com/fcm/send/x',
			'https://localhost/x',
			'https://10.0.0.5/x',
			'https://169.254.169.254/latest/meta-data',
			'https://fcm.googleapis.com.evil.example/x',
			'https://user:pw@fcm.googleapis.com/x',
			'https://fcm.googleapis.com:8443/x',
			'not a url'
		];
		const { subs, remove } = inMemory({
			lan: bad.map((endpoint) => ({ endpoint, p256dh: 'k', auth: 'a' }))
		});
		const post = script({});

		await expect(webPushChannel({ subs, post }).send(reminder)).rejects.toThrow(
			'push: no device reached'
		);

		expect(post).not.toHaveBeenCalled();
		expect(remove.mock.calls.map(([, e]) => e)).toEqual(bad);
	});

	it('Given_KnownPushServices_When_IsPushEndpoint_Then_True', () => {
		for (const e of [
			'https://fcm.googleapis.com/fcm/send/abc',
			'https://updates.push.services.mozilla.com/wpush/v2/abc',
			'https://wns2-par02p.notify.windows.com/w/?token=abc',
			'https://web.push.apple.com/abc'
		])
			expect(isPushEndpoint(e)).toBe(true);
	});
});

describe('webPushChannel reminder token', () => {
	const sentBody = async (r: { learnerId: string; day: string; open?: string }) => {
		const { subs } = inMemory({ lan: [sub('e1')] });
		const post = script({});
		await webPushChannel({ subs, post }).send(r);
		return post.mock.calls[0][1];
	};

	it('Given_OpenToken_When_Send_Then_UrlHasRemindParam', async () => {
		const body = await sentBody({ ...reminder, open: 'u-1' });

		expect(JSON.parse(body)).toEqual({ ...REMINDER_PUSH, url: '/today?remind=u-1' });
	});

	it('Given_NoToken_When_Send_Then_BodyUnchanged', async () => {
		expect(await sentBody(reminder)).toBe(
			'{"title":"Chaiyo!","body":"Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!","url":"/today"}'
		);
	});

	it('Given_Message_Then_EveryUrlOnAppOriginOrRelative', async () => {
		const { url } = JSON.parse(await sentBody({ ...reminder, open: 'u-1' }));

		expect(new URL(url, 'https://chaiyo.vercel.app').origin).toBe('https://chaiyo.vercel.app');
	});
});
