import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { adminUsage } from './usage';

const client = (result: { data: unknown; error: unknown }) => {
	const rpc = vi.fn(async () => result);
	return { rpc, client: { rpc } as unknown as SupabaseClient };
};

describe('adminUsage', () => {
	it('Given_Days30_Then_RpcArgs', async () => {
		const c = client({ data: {}, error: null });
		await adminUsage(c.client, 30);
		expect(c.rpc).toHaveBeenCalledTimes(1);
		expect(c.rpc).toHaveBeenCalledWith('admin_usage', { p_days: 30 });
	});

	it('Given_Data_Then_ReturnsIt', async () => {
		const data = {
			active: { today: 1, d7: 3, d30: 4 },
			gates: [{ lesson: 'h1-01', runs: 9, fails: 4 }],
			dropoff: [{ lesson: 'h1-01', started: 3, sections: { warmup: 3 } }]
		};
		expect(await adminUsage(client({ data, error: null }).client, 7)).toEqual(data);
	});

	it('Given_RpcError_Then_Throws', async () => {
		const c = client({ data: null, error: { message: 'not admin', code: '42501' } });
		await expect(adminUsage(c.client, 7)).rejects.toThrow('not admin');
	});
});
