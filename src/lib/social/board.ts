import type { SupabaseClient } from '@supabase/supabase-js';
import type { PublicStats } from './stats';

export type BoardRow = {
	handle: string;
	name: string;
	photo: string | null;
	lesson: number;
	streak: number;
	wordsWeek: number;
	me: boolean;
};

export type BoardMode = 'streak' | 'week';

export type RankedRow = { row: BoardRow; rank: number; medal: boolean; value: number };

type Row = {
	handle: string;
	display_name: string;
	photo_url: string | null;
	lesson: number;
	streak: number;
	words_week: number;
	me: boolean;
};

export async function friendsBoard(client: Pick<SupabaseClient, 'rpc'>): Promise<BoardRow[]> {
	const { data, error } = await client.rpc('friends_board');
	if (error) throw new Error(error.message);
	return ((data as Row[] | null) ?? []).map((r) => ({
		handle: r.handle,
		name: r.display_name,
		photo: r.photo_url,
		lesson: r.lesson,
		streak: r.streak,
		wordsWeek: r.words_week,
		me: r.me
	}));
}

export const withMe = (
	rows: BoardRow[],
	stats: Pick<PublicStats, 'streak' | 'wordsWeek' | 'lesson'>
): BoardRow[] =>
	rows.map((r) =>
		r.me ? { ...r, streak: stats.streak, wordsWeek: stats.wordsWeek, lesson: stats.lesson } : r
	);

export function rankBoard(rows: BoardRow[], mode: BoardMode): RankedRow[] {
	const value = (r: BoardRow) => (mode === 'streak' ? r.streak : r.wordsWeek);
	return [...rows]
		.sort(
			(a, b) =>
				value(b) - value(a) ||
				Number(b.me) - Number(a.me) ||
				a.name.localeCompare(b.name, 'vi') ||
				a.handle.localeCompare(b.handle)
		)
		.map((row, i) => ({ row, rank: i + 1, medal: i < 3 && value(row) > 0, value: value(row) }));
}
