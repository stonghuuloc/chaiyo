import { learnerLedger } from '#lib/learner/index.js';
import { markReminderOpened, rememberReminder, takeReminder } from '#lib/notify/opened.js';
import { openReports } from '#lib/report/index.js';
import { supabase } from '#lib/supabase.js';
import { requireSession } from '#lib/shell/guard.js';

export const load = ({ url, untrack }) => {
	const remind = untrack(() => url.searchParams.get('remind'));
	return requireSession(async () => {
		const { data, error } = await supabase.auth.getSession();
		if (data.session) {
			void learnerLedger(data.session).catch(() => undefined);
			void openReports(data.session).catch(() => undefined);
			const stored = takeReminder(localStorage);
			void markReminderOpened(supabase, remind ?? stored).catch(() => undefined);
		} else rememberReminder(localStorage, remind);
		return { session: data.session, error };
	});
};
