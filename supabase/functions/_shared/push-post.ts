import * as webpush from '@negrel/webpush';
import type { PushPost } from '#lib/notify/web-push.js';

export async function pushPost(): Promise<PushPost | null> {
	const keys = Deno.env.get('VAPID_KEYS');
	const subject = Deno.env.get('VAPID_SUBJECT');
	if (!keys || !subject) return null;
	const server = await webpush.ApplicationServer.new({
		contactInformation: subject,
		vapidKeys: await webpush.importVapidKeys(JSON.parse(keys))
	});
	return async (s, body) => {
		try {
			await server
				.subscribe({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } })
				.pushTextMessage(body, {});
			return 201;
		} catch (e) {
			if (e instanceof webpush.PushMessageError) return e.response.status;
			throw e;
		}
	};
}
