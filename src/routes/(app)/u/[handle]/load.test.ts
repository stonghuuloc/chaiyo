import { describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

describe('profile load', () => {
	it('Given_Handle_When_Load_Then_PushedMeShellAndProfile', async () => {
		rpc.mockResolvedValue({ data: [{ status: 'hidden' }], error: null });
		const { load } = await import('./+page');
		const data = await load({ params: { handle: 'loc' } } as Parameters<typeof load>[0]);
		expect(data).toEqual({
			shell: { template: 'pushed', section: 'me' },
			profile: { status: 'hidden' }
		});
		expect(rpc).toHaveBeenCalledWith('public_profile', { p_handle: 'loc' });
	});

	it('Given_RpcError_When_Load_Then_Rejects', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
		const { load } = await import('./+page');
		await expect(load({ params: { handle: 'loc' } } as Parameters<typeof load>[0])).rejects.toThrow(
			'boom'
		);
	});
});
