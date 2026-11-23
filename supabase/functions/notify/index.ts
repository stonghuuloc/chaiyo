import { createClient } from '@supabase/supabase-js';
import lessons from '#lib/curriculum/curriculum.json' with { type: 'json' };
import { handle } from '#lib/notify/handler.js';
import { sendReminders } from '#lib/notify/remind.js';
import { supabaseDeps, supabaseMarks } from '#lib/notify/supabase.js';
import { tick } from '#lib/notify/tick.js';

Deno.serve((req) =>
	handle(req, {
		secret: Deno.env.get('NOTIFY_SECRET'),
		run: (now) => {
			const client = createClient(
				Deno.env.get('SUPABASE_URL')!,
				Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
			);
			return tick(
				now,
				supabaseDeps(client, { lessons }, (at, rolled) =>
					sendReminders(at, rolled, [], supabaseMarks(client)).then(() => undefined)
				)
			);
		}
	})
);
