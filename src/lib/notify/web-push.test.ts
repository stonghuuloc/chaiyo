import { describe, expect, it, vi } from 'vitest';
import { REMINDER_PUSH, webPushChannel, type PushSub, type PushSubs } from './web-push';

const sub = (endpoint: string): PushSub => ({
	endpoint,
	p256dh: `${endpoint}-k`,
	auth: `${endpoint}-a`
});

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
	vi.fn(async (s: PushSub, _body: string) => {
		const v = statuses[s.endpoint] ?? 201;
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
		expect(post.mock.calls.map(([s]) => s.endpoint)).toEqual(['e1', 'e2']);
		const body =
			'{"title":"Chaiyo!","body":"Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!","url":"/today"}';
		expect(post.mock.calls.map(([, b]) => b)).toEqual([body, body]);
		expect(JSON.parse(body)).toEqual(REMINDER_PUSH);
		expect(list.mock.calls).toEqual([['lan']]);
	});

	it('Given_NoSubs_When_Send_Then_Resolves', async () => {
		const { subs } = inMemory({});
		const post = script({});
		await expect(
			webPushChannel({ subs, post }).send({ ...reminder, learnerId: 'huy' })
		).resolves.toBeUndefined();
		expect(post).not.toHaveBeenCalled();
	});

	it('Given_410_When_Send_Then_RemovedAndNextSendSkipsIt', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: 410 });
		const channel = webPushChannel({ subs, post });
		await expect(channel.send(reminder)).resolves.toBeUndefined();
		expect(remove.mock.calls).toEqual([['lan', 'e1']]);
		post.mockClear();
		await channel.send(reminder);
		expect(post.mock.calls.map(([s]) => s.endpoint)).toEqual(['e2']);
	});

	it('Given_404_When_Send_Then_Removed', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1')] });
		await webPushChannel({ subs, post: script({ e1: 404 }) }).send(reminder);
		expect(remove.mock.calls).toEqual([['lan', 'e1']]);
	});

	it('Given_500And201_When_Send_Then_KeepsRowTriesBothRejects', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: 500, e2: 201 });
		await expect(webPushChannel({ subs, post }).send(reminder)).rejects.toThrow(
			'push: 1 of 2 failed'
		);
		expect(post).toHaveBeenCalledTimes(2);
		expect(remove).not.toHaveBeenCalled();
	});

	it('Given_PostThrows_When_Send_Then_CountedAsFailure', async () => {
		const { subs, remove } = inMemory({ lan: [sub('e1'), sub('e2')] });
		const post = script({ e1: new Error('network'), e2: 201 });
		await expect(webPushChannel({ subs, post }).send(reminder)).rejects.toThrow(
			'push: 1 of 2 failed'
		);
		expect(post).toHaveBeenCalledTimes(2);
		expect(remove).not.toHaveBeenCalled();
	});
});
