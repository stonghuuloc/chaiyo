import { remindUrl, type Channel } from './channel';

export type PushSub = { endpoint: string; p256dh: string; auth: string };
export type PushSubs = {
	list(learnerId: string): Promise<PushSub[]>;
	remove(learnerId: string, endpoint: string): Promise<void>;
};
export type PushPost = (s: PushSub, body: string) => Promise<number>;

const PUSH_HOSTS = [
	'fcm.googleapis.com',
	'push.services.mozilla.com',
	'notify.windows.com',
	'push.apple.com'
];

export function isPushEndpoint(endpoint: string): boolean {
	try {
		const u = new URL(endpoint);
		return (
			u.protocol === 'https:' &&
			u.port === '' &&
			!u.username &&
			!u.password &&
			PUSH_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
		);
	} catch {
		return false;
	}
}

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
	const payload = o.payload ?? REMINDER_PUSH;
	return {
		name: 'push',
		async send({ learnerId, open }) {
			const body = JSON.stringify({ ...payload, url: remindUrl(payload.url, open) });
			const all = await o.subs.list(learnerId);
			let failed = 0;
			let ok = 0;
			for (const s of all) {
				if (!isPushEndpoint(s.endpoint)) {
					await o.subs.remove(learnerId, s.endpoint);
					continue;
				}
				const status = await o.post(s, body).catch(() => 0);
				if (status === 404 || status === 410) await o.subs.remove(learnerId, s.endpoint);
				else if (status === 0 || status >= 400) failed++;
				else ok++;
			}
			if (!ok)
				throw new Error(
					failed ? `push: ${failed} of ${all.length} failed` : 'push: no device reached'
				);
		}
	};
}
