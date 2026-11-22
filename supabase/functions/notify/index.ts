import { createClient } from '@supabase/supabase-js';
import lessons from '#lib/curriculum/curriculum.json' with { type: 'json' };
import { handle } from '#lib/notify/handler';
import { supabaseDeps } from '#lib/notify/supabase';
import { noRemind, tick } from '#lib/notify/tick';

Deno.serve((req) =>
	handle(req, {
		secret: Deno.env.get('NOTIFY_SECRET'),
		run: (now) =>
			tick(
				now,
				supabaseDeps(
					createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!),
					{ lessons },
					noRemind
				)
			)
	})
);
