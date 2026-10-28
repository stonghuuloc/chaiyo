import { supabase } from '#lib/supabase.js';
import { requireSession } from '#lib/shell/guard.js';

export const load = () =>
	requireSession(async () => (await supabase.auth.getSession()).data.session);
