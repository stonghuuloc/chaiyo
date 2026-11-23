import { createClient } from '@supabase/supabase-js';
import { supabaseAddresses } from '#lib/notify/address.js';
import { emailFromEnv } from '#lib/notify/email.js';
import { handlePushTest } from '#lib/notify/push-test.js';

const client = createClient(
	Deno.env.get('SUPABASE_URL')!,
	Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const channel = emailFromEnv((k) => Deno.env.get(k), {
	addressOf: supabaseAddresses(client).addressOf
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
		name: 'email',
		now: () => new Date()
	})
);
