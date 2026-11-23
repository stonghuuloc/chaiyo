import type { SupabaseClient } from '@supabase/supabase-js';

export function supabaseAddresses(client: SupabaseClient): {
	addressOf(id: string): Promise<string | null>;
} {
	return {
		async addressOf(id) {
			const { data, error } = await client.auth.admin.getUserById(id);
			if (error) throw new Error(error.message);
			return data.user?.email ?? null;
		}
	};
}
