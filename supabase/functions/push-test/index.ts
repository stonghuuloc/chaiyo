import { createClient } from '@supabase/supabase-js';
import * as webpush from '@negrel/webpush';
import { handlePushTest } from '#lib/notify/push-test.js';
import { supabasePushSubs } from '#lib/notify/push-store.js';
import { webPushChannel, type PushPost } from '#lib/notify/web-push.js';

const client = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

async function pushPost(): Promise<PushPost | null> {
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

const post = await pushPost();

Deno.serve((req) =>
	handlePushTest(req, {
		async uid(auth) {
			const jwt = auth?.replace(/^Bearer /i, '');
			if (!jwt) return null;
			const { data } = await client.auth.getUser(jwt);
			return data.user?.id ?? null;
		},
		channel: post ? webPushChannel({ subs: supabasePushSubs(client), post }) : null,
		now: () => new Date()
	})
);
