import type { Channel } from './channel';

export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type PushSubs = {
	list(learnerId: string): Promise<PushSub[]>;
	remove(learnerId: string, endpoint: string): Promise<void>;
};
export type PushPost = (s: PushSub, body: string) => Promise<number>;

export const REMINDER_PUSH = {
	title: 'Chaiyo!',
	body: 'Hôm nay bạn chưa học. Vài phút thôi để giữ chuỗi nhé!',
	url: '/today'
};

export function webPushChannel(o: {
	subs: PushSubs;
	post: PushPost;
	payload?: typeof REMINDER_PUSH;
}): Channel {
	const body = JSON.stringify(o.payload ?? REMINDER_PUSH);
	return {
		name: 'push',
		async send({ learnerId }) {
			const all = await o.subs.list(learnerId);
			let failed = 0;
			for (const s of all) {
				const status = await o.post(s, body).catch(() => 0);
				if (status === 404 || status === 410) await o.subs.remove(learnerId, s.endpoint);
				else if (status === 0 || status >= 400) failed++;
			}
			if (failed) throw new Error(`push: ${failed} of ${all.length} failed`);
		}
	};
}
