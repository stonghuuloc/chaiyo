import { createClient } from '@supabase/supabase-js';
import { handlePushTest } from '#lib/notify/push-test.js';
import { supabaseTelegram } from '#lib/notify/telegram-store.js';
import { telegramFromEnv } from '#lib/notify/telegram.js';

const client = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const channel = telegramFromEnv((k) => Deno.env.get(k), {
	chatOf: supabaseTelegram(client).chatOf
});

Deno.serve((req) =>
	handlePushTest(req, {
		async uid(auth) {
			const jwt = auth?.replace(/^Bearer /i, '');
			if (!jwt) return null;
			const { data } = await client.auth.getUser(jwt);
			return data.user?.id ?? null;
		},
		channel,
		name: 'telegram',
		now: () => new Date()
	})
);
