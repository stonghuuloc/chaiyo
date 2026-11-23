import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { friendsBoard, rankBoard, withMe, type BoardRow } from './board';

const row = (name: string, streak: number, wordsWeek: number, me = false): BoardRow => ({
	handle: name.toLowerCase(),
	name,
	photo: null,
	lesson: 5,
	streak,
	wordsWeek,
	me
});
const ROWS = [row('Lan', 4, 25), row('Linh', 12, 9, true), row('Huy', 9, 17), row('Minh', 30, 14)];
const names = (mode: 'streak' | 'week', rows = ROWS) =>
	rankBoard(rows, mode).map((r) => `${r.row.name} ${r.value}`);

describe('friendsBoard', () => {
	it('Given_RpcRows_When_Read_Then_CamelCase', async () => {
		const rpc = vi.fn(async () => ({
			data: [
				{
					handle: 'minh',
					display_name: 'Minh',
					photo_url: 'https://a.googleusercontent.com/x',
					lesson: 7,
					streak: 30,
					words_week: 14,
					me: false
				}
			],
			error: null
		}));
		const rows = await friendsBoard({ rpc } as unknown as SupabaseClient);
		expect(rpc).toHaveBeenCalledWith('friends_board');
		expect(rows).toEqual([
			{
				handle: 'minh',
				name: 'Minh',
				photo: 'https://a.googleusercontent.com/x',
				lesson: 7,
				streak: 30,
				wordsWeek: 14,
				me: false
			}
		]);
	});

	it('Given_NullData_When_Read_Then_Empty', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: null }));
		expect(await friendsBoard({ rpc } as unknown as SupabaseClient)).toEqual([]);
	});

	it('Given_RpcError_Then_Throws', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
		await expect(friendsBoard({ rpc } as unknown as SupabaseClient)).rejects.toThrow('boom');
	});
});

describe('rankBoard', () => {
	it('Given_Streak_When_Rank_Then_Minh30Linh12Huy9Lan4', () => {
		expect(names('streak')).toEqual(['Minh 30', 'Linh 12', 'Huy 9', 'Lan 4']);
	});

	it('Given_Week_When_Rank_Then_Lan25Huy17Minh14Linh9', () => {
		expect(names('week')).toEqual(['Lan 25', 'Huy 17', 'Minh 14', 'Linh 9']);
	});

	it('Given_TieWithMe_Then_MeFirst', () => {
		expect(names('streak', [row('An', 12, 0), row('Linh', 12, 0, true)])).toEqual([
			'Linh 12',
			'An 12'
		]);
	});

	it('Given_TieOthers_Then_VietnameseNameOrder', () => {
		const rows = [row('Đức', 3, 0), row('Ân', 3, 0), row('Dung', 3, 0), row('An', 3, 0)];
		expect(names('streak', rows)).toEqual(['An 3', 'Ân 3', 'Dung 3', 'Đức 3']);
	});

	it('Given_SameName_Then_HandleOrder', () => {
		const rows = [
			{ ...row('An', 3, 0), handle: 'an2' },
			{ ...row('An', 3, 0), handle: 'an' }
		];
		expect(rankBoard(rows, 'streak').map((r) => r.row.handle)).toEqual(['an', 'an2']);
	});

	it('Given_4Rows_Then_Medals1to3Only', () => {
		expect(rankBoard(ROWS, 'streak').map((r) => [r.rank, r.medal])).toEqual([
			[1, true],
			[2, true],
			[3, true],
			[4, false]
		]);
	});
});

describe('withMe', () => {
	it('Given_Stats_When_WithMe_Then_OnlyMyRowChanges', () => {
		const out = withMe(ROWS, { streak: 13, wordsWeek: 11, lesson: 9 });
		expect(out.find((r) => r.me)).toMatchObject({ streak: 13, wordsWeek: 11, lesson: 9 });
		expect(out.filter((r) => !r.me)).toEqual(ROWS.filter((r) => !r.me));
	});

	it('Given_NoMeRow_When_WithMe_Then_Unchanged', () => {
		const others = ROWS.filter((r) => !r.me);
		expect(withMe(others, { streak: 13, wordsWeek: 11, lesson: 9 })).toEqual(others);
	});
});
