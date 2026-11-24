import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { isAdmin } from './admin';

const client = (result: { data: unknown; error: unknown }) => {
	const rpc = vi.fn(async () => result);
	return { rpc, client: { rpc } as unknown as SupabaseClient };
};

describe('isAdmin', () => {
	it('Given_RpcTrue_Then_True', async () => {
		expect(await isAdmin(client({ data: true, error: null }).client)).toBe(true);
	});

	it('Given_RpcFalse_Then_False', async () => {
		expect(await isAdmin(client({ data: false, error: null }).client)).toBe(false);
	});

	it('Given_RpcError_Then_Throws', async () => {
		const c = client({ data: null, error: { message: 'permission denied', code: '42501' } });
		await expect(isAdmin(c.client)).rejects.toThrow('permission denied');
	});

	it('Given_Call_Then_RpcIsAdminNoArgs', async () => {
		const c = client({ data: true, error: null });
		await isAdmin(c.client);
		expect(c.rpc).toHaveBeenCalledTimes(1);
		expect(c.rpc).toHaveBeenCalledWith('is_admin');
	});
});
