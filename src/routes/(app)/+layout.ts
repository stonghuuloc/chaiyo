import { learnerLedger } from '#lib/learner/index.js';
import { openReports } from '#lib/report/index.js';
import { supabase } from '#lib/supabase.js';
import { requireSession } from '#lib/shell/guard.js';

export const load = () =>
	requireSession(async () => {
		const { data, error } = await supabase.auth.getSession();
		if (data.session) {
			void learnerLedger(data.session).catch(() => undefined);
			void openReports(data.session).catch(() => undefined);
		}
		return { session: data.session, error };
	});
