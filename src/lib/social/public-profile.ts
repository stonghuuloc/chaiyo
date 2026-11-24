import type { SupabaseClient } from '@supabase/supabase-js';
import { BADGES, type BadgeId } from '#lib/study/index.js';

export type PublicProfile =
	| { status: 'missing' }
	| { status: 'hidden' }
	| {
			status: 'visible';
			name: string;
			photo: string | null;
			handle: string;
			streak: number;
			wordsKnown: number;
			hsk: number;
			lesson: number;
			badges: BadgeId[];
			following: boolean;
			me: boolean;
	  };

type Row = {
	status: 'missing' | 'hidden' | 'visible';
	display_name: string;
	photo_url: string | null;
	handle: string;
	streak: number;
	words_known: number;
	hsk: number;
	lesson: number;
	badges: string[];
	following: boolean;
	me: boolean;
};

export async function publicProfile(
	client: Pick<SupabaseClient, 'rpc'>,
	handle: string
): Promise<PublicProfile> {
	const { data, error } = await client.rpc('profile_view', { p_handle: handle });
	if (error) throw new Error(error.message);
	const row = (data as Row[] | null)?.[0];
	if (row?.status === 'hidden') return { status: 'hidden' };
	if (!row || row.status !== 'visible') return { status: 'missing' };
	return {
		status: 'visible',
		name: row.display_name,
		photo: row.photo_url,
		handle: row.handle,
		streak: row.streak,
		wordsKnown: row.words_known,
		hsk: row.hsk,
		lesson: row.lesson,
		badges: BADGES.map(([id]) => id).filter((id) => row.badges.includes(id)),
		following: row.following,
		me: row.me
	};
}
