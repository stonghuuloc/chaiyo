import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { searchLearners, setFollow } from './follow';

const client = (rpc: unknown) => ({ rpc }) as unknown as Pick<SupabaseClient, 'rpc'>;

describe('searchLearners', () => {
	it('Given_Rows_When_Search_Then_CamelCase', async () => {
		const rpc = vi.fn(async () => ({
			data: [
				{
					handle: 'ngoc',
					display_name: 'Nguyễn Thị Ngọc',
					photo_url: null,
					hsk: 2,
					lesson: 14,
					following: true
				}
			],
			error: null
		}));
		expect(await searchLearners(client(rpc), 'ngoc')).toEqual([
			{ handle: 'ngoc', name: 'Nguyễn Thị Ngọc', photo: null, hsk: 2, lesson: 14, following: true }
		]);
		expect(rpc).toHaveBeenCalledWith('search_learners', { p_q: 'ngoc' });
	});

	it('Given_BlankOrOneChar_Then_NoRpcEmpty', async () => {
		const rpc = vi.fn();
		for (const q of ['', ' ', 'n', '  n '])
			expect(await searchLearners(client(rpc), q)).toEqual([]);
		expect(rpc).not.toHaveBeenCalled();
	});

	it('Given_RpcError_When_Search_Then_Throws', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
		await expect(searchLearners(client(rpc), 'ngoc')).rejects.toThrow('boom');
	});

	it('Given_NullData_When_Search_Then_Empty', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: null }));
		expect(await searchLearners(client(rpc), 'ngoc')).toEqual([]);
	});
});

describe('setFollow', () => {
	it('Given_Handle_When_SetFollow_Then_PassesArgsReturnsTrue', async () => {
		const rpc = vi.fn(async () => ({ data: true, error: null }));
		expect(await setFollow(client(rpc), 'ngoc', true)).toBe(true);
		expect(rpc).toHaveBeenCalledWith('set_follow', { p_handle: 'ngoc', p_on: true });
	});

	it('Given_False_Then_ReturnsFalse', async () => {
		const rpc = vi.fn(async () => ({ data: false, error: null }));
		expect(await setFollow(client(rpc), 'nam', true)).toBe(false);
	});

	it('Given_RpcError_When_SetFollow_Then_Throws', async () => {
		const rpc = vi.fn(async () => ({ data: null, error: { message: 'nope' } }));
		await expect(setFollow(client(rpc), 'ngoc', false)).rejects.toThrow('nope');
	});
});
