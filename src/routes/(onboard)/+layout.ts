import { supabase } from '#lib/supabase.js';
import { requireSession } from '#lib/shell/guard.js';

export const load = () =>
	requireSession(async () => {
		const { data, error } = await supabase.auth.getSession();
		return { session: data.session, error };
	});
