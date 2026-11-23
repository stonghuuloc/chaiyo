import { createClient } from '@supabase/supabase-js';
import { handlePushTest } from '#lib/notify/push-test.js';
import { supabasePushSubs } from '#lib/notify/push-store.js';
import { webPushChannel } from '#lib/notify/web-push.js';
import { pushPost } from '../_shared/push-post.ts';

const client = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

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
		name: 'push',
		now: () => new Date()
	})
);
