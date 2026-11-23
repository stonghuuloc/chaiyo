import type { SupabaseClient } from '@supabase/supabase-js';
import type { BadgeId } from '#lib/study/index.js';

export const badgeLink = (origin: string, handle: string, id: BadgeId) =>
	`${origin}/u/${encodeURIComponent(handle)}?badge=${id}`;

export async function ownHandle(
	client: Pick<SupabaseClient, 'from'>,
	uid: string
): Promise<string | null> {
	const { data, error } = await client
		.from('profiles')
		.select('handle')
		.eq('learner_id', uid)
		.maybeSingle();
	if (error) throw error;
	return (data?.handle as string | undefined) ?? null;
}
