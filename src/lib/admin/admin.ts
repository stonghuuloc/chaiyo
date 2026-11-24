import type { SupabaseClient } from '@supabase/supabase-js';

export async function isAdmin(client: Pick<SupabaseClient, 'rpc'>): Promise<boolean> {
	const { data, error } = await client.rpc('is_admin');
	return !error && data === true;
}
