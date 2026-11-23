import { describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

describe('friends load', () => {
	it('Given_Load_Then_PushedMeShellAndBoard', async () => {
		rpc.mockResolvedValue({
			data: [
				{
					handle: 'linh',
					display_name: 'Linh',
					photo_url: null,
					lesson: 3,
					streak: 12,
					words_week: 9,
					me: true
				}
			],
			error: null
		});
		const { load } = await import('./+page');
		const data = await load({} as Parameters<typeof load>[0]);
		expect(data).toEqual({
			shell: { template: 'pushed', section: 'me' },
			board: [
				{
					handle: 'linh',
					name: 'Linh',
					photo: null,
					lesson: 3,
					streak: 12,
					wordsWeek: 9,
					me: true
				}
			]
		});
		expect(rpc).toHaveBeenCalledWith('friends_board');
	});

	it('Given_RpcError_When_Load_Then_Rejects', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
		const { load } = await import('./+page');
		await expect(load({} as Parameters<typeof load>[0])).rejects.toThrow('boom');
	});
});
