import { redirect } from '@sveltejs/kit';
import { isAuthRetryableFetchError, type AuthError, type Session } from '@supabase/supabase-js';

type SessionResult = { session: Session | null; error: AuthError | null };

// Retryable = refresh failed on the network; auth-js keeps the stored session, so stay in the app.
export async function requireSession(getSession: () => Promise<SessionResult>) {
	const { session, error } = await getSession();
	if (!session && !isAuthRetryableFetchError(error)) redirect(307, '/login');
	return { session };
}
