import { pagedRpc, REFERENCE_ROWS } from '#lib/admin/fixtures/reports.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));

const answer = (isAdmin: unknown, list: { data: unknown; error: unknown }) =>
	rpc.mockImplementation((name: string) =>
		name === 'is_admin'
			? { data: isAdmin, error: null }
			: pagedRpc((list.data as unknown[]) ?? null, list.error)
	);

const run = async () => {
	const { load } = await import('./+page');
	return load({} as Parameters<typeof load>[0]);
};

beforeEach(() => rpc.mockReset());

describe('admin reports load', () => {
	it('Given_Admin_Then_PushedMeShellAndReports', async () => {
		answer(true, { data: REFERENCE_ROWS, error: null });
		const data = (await run()) as { shell: unknown; reports: { id: string; word: string }[] };
		expect(data.shell).toEqual({ template: 'pushed', section: 'me' });
		expect(data.reports).toHaveLength(10);
		expect(data.reports[0]).toMatchObject({ id: REFERENCE_ROWS[0].id, word: '你好' });
		expect(rpc.mock.calls.map((c) => c[0])).toEqual(['is_admin', 'list_error_reports']);
	});

	it('Given_NotAdmin_Then_403AndNoListCall', async () => {
		answer(false, { data: REFERENCE_ROWS, error: null });
		await expect(run()).rejects.toMatchObject({ status: 403 });
		expect(rpc.mock.calls.map((c) => c[0])).toEqual(['is_admin']);
	});

	it('Given_IsAdminRpcFails_Then_ThrowsNot403', async () => {
		rpc.mockImplementation(async () => ({ data: null, error: { message: 'fetch failed' } }));
		await expect(run()).rejects.toThrow('fetch failed');
		await expect(run()).rejects.not.toMatchObject({ status: 403 });
	});

	it('Given_ListError_Then_Throws', async () => {
		answer(true, { data: null, error: { message: 'boom' } });
		await expect(run()).rejects.toThrow('boom');
	});

	it('Given_R1ResolvedInDb_When_Load_Then_R1Resolved', async () => {
		answer(true, {
			data: [
				{ ...REFERENCE_ROWS[0], status: 'resolved', resolved_at: '2026-11-24T10:05:00Z' },
				...REFERENCE_ROWS.slice(1)
			],
			error: null
		});
		const data = (await run()) as { reports: { id: string; status: string }[] };
		expect(data.reports[0]).toMatchObject({ id: REFERENCE_ROWS[0].id, status: 'resolved' });
		expect(data.reports.filter((r) => r.status === 'new')).toHaveLength(9);
	});
});
