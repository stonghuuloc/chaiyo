import { redirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';

export async function requireSession(getSession: () => Promise<Session | null>) {
	const session = await getSession();
	if (!session) redirect(307, '/login');
	return { session };
}
