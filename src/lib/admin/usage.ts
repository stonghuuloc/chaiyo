import type { SupabaseClient } from '@supabase/supabase-js';

export type Usage = {
	active: { today: number; d7: number; d30: number };
	gates: { lesson: string; runs: number; fails: number }[];
	dropoff: { lesson: string; started: number; sections: Record<string, number> }[];
};

export async function adminUsage(
	client: Pick<SupabaseClient, 'rpc'>,
	days: 7 | 30
): Promise<Usage> {
	const { data, error } = await client.rpc('admin_usage', { p_days: days });
	if (error) throw new Error(error.message);
	return data as Usage;
}
