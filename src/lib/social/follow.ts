import type { SupabaseClient } from '@supabase/supabase-js';

export type FoundLearner = {
	handle: string;
	name: string;
	photo: string | null;
	hsk: number;
	lesson: number;
	following: boolean;
};

type Row = {
	handle: string;
	display_name: string;
	photo_url: string | null;
	hsk: number;
	lesson: number;
	following: boolean;
};

export async function searchLearners(
	client: Pick<SupabaseClient, 'rpc'>,
	q: string
): Promise<FoundLearner[]> {
	if (q.trim().length < 2) return [];
	const { data, error } = await client.rpc('search_learners', { p_q: q });
	if (error) throw new Error(error.message);
	return ((data as Row[] | null) ?? []).map((r) => ({
		handle: r.handle,
		name: r.display_name,
		photo: r.photo_url,
		hsk: r.hsk,
		lesson: r.lesson,
		following: r.following
	}));
}

export async function setFollow(
	client: Pick<SupabaseClient, 'rpc'>,
	handle: string,
	on: boolean
): Promise<boolean> {
	const { data, error } = await client.rpc('set_follow', { p_handle: handle, p_on: on });
	if (error) throw new Error(error.message);
	return data === true;
}
