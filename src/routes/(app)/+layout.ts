import { learnerLedger } from '#lib/learner/index.js';
import { markReminderOpened } from '#lib/notify/opened.js';
import { openReports } from '#lib/report/index.js';
import { supabase } from '#lib/supabase.js';
import { requireSession } from '#lib/shell/guard.js';

export const load = ({ url, untrack }) =>
	requireSession(async () => {
		const { data, error } = await supabase.auth.getSession();
		if (data.session) {
			void learnerLedger(data.session).catch(() => undefined);
			void openReports(data.session).catch(() => undefined);
			void markReminderOpened(
				supabase,
				untrack(() => url.searchParams.get('remind'))
			).catch(() => undefined);
		}
		return { session: data.session, error };
	});
