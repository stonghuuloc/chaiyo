import { createClient } from '@supabase/supabase-js';
import lessons from '#lib/curriculum/curriculum.json' with { type: 'json' };
import { supabaseAddresses } from '#lib/notify/address.js';
import { failedLines, reminderChannels } from '#lib/notify/channels.js';
import { emailFromEnv } from '#lib/notify/email.js';
import { handle } from '#lib/notify/handler.js';
import { supabasePushSubs } from '#lib/notify/push-store.js';
import { sendReminders } from '#lib/notify/remind.js';
import { supabaseDeps, supabaseMarks } from '#lib/notify/supabase.js';
import { supabaseTelegram } from '#lib/notify/telegram-store.js';
import { telegramFromEnv } from '#lib/notify/telegram.js';
import { tick } from '#lib/notify/tick.js';
import { webPushChannel } from '#lib/notify/web-push.js';
import { pushPost } from '../_shared/push-post.ts';

const post = await pushPost();

Deno.serve((req) =>
	handle(req, {
		secret: Deno.env.get('NOTIFY_SECRET'),
		run: (now) => {
			const client = createClient(
				Deno.env.get('SUPABASE_URL')!,
				Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
			);
			const channels = reminderChannels({
				push: post ? webPushChannel({ subs: supabasePushSubs(client), post }) : null,
				email: emailFromEnv((k) => Deno.env.get(k), {
					addressOf: supabaseAddresses(client).addressOf
				}),
				telegram: telegramFromEnv((k) => Deno.env.get(k), {
					chatOf: supabaseTelegram(client).chatOf,
					skipUnlinked: true
				})
			});
			return tick(
				now,
				supabaseDeps(client, { lessons }, (at, rolled) =>
					sendReminders(at, rolled, channels, supabaseMarks(client)).then((r) =>
						failedLines(r).forEach((l) => console.warn(l))
					)
				)
			);
		}
	})
);
