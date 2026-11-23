import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

const NGOC = {
	status: 'visible',
	display_name: 'Nguyễn Thị Ngọc',
	photo_url: null,
	handle: 'ngoc',
	streak: 9,
	words_known: 120,
	hsk: 2,
	lesson: 14,
	badges: ['streak7', 'first'],
	following: false,
	me: false
};

const run = async (handle: string, query = '') => {
	const { load } = await import('./+page');
	return (await load({
		params: { handle },
		url: new URL(`https://chaiyo.app/u/${handle}${query}`)
	} as Parameters<typeof load>[0])) as { badge: string | null };
};

beforeEach(() => rpc.mockReset());

describe('profile load', () => {
	it('Given_Handle_When_Load_Then_PushedMeShellAndProfile', async () => {
		rpc.mockResolvedValue({ data: [{ status: 'hidden' }], error: null });
		const data = await run('loc');
		expect(data).toEqual({
			shell: { template: 'pushed', section: 'me' },
			profile: { status: 'hidden' },
			badge: null
		});
		expect(rpc).toHaveBeenCalledWith('profile_view', { p_handle: 'loc' });
	});

	it('Given_RpcError_When_Load_Then_Rejects', async () => {
		rpc.mockResolvedValue({ data: null, error: { message: 'boom' } });
		await expect(run('loc')).rejects.toThrow('boom');
	});

	it('Given_VisibleEarnedBadge_Then_BadgeKept', async () => {
		rpc.mockResolvedValue({ data: [NGOC], error: null });
		expect((await run('ngoc', '?badge=streak7')).badge).toBe('streak7');
	});

	it('Given_NotEarnedOrUnknown_Then_Null', async () => {
		rpc.mockResolvedValue({ data: [NGOC], error: null });
		expect((await run('ngoc', '?badge=streak30')).badge).toBeNull();
		expect((await run('ngoc', '?badge=zzz')).badge).toBeNull();
	});

	it('Given_Hidden_Then_NullNoBadge', async () => {
		rpc.mockResolvedValue({ data: [{ status: 'hidden' }], error: null });
		const data = await run('loc', '?badge=streak7');
		expect(data.badge).toBeNull();
		expect(JSON.stringify(data)).not.toContain('streak7');
	});

	it('Given_Missing_Then_Null', async () => {
		rpc.mockResolvedValue({ data: [{ status: 'missing' }], error: null });
		const data = await run('khongco', '?badge=streak7');
		expect(data.badge).toBeNull();
		expect(JSON.stringify(data)).not.toContain('streak7');
	});

	it('Given_NoQuery_Then_Null', async () => {
		rpc.mockResolvedValue({ data: [NGOC], error: null });
		expect((await run('ngoc')).badge).toBeNull();
	});
});
