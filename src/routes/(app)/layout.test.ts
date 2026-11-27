import { beforeEach, describe, expect, it, vi } from 'vitest';

const UUID = '3f2b8c1e-9a4d-4e57-8b6a-1c2d3e4f5a6b';
const mocks = vi.hoisted(() => ({
	getSession: vi.fn(),
	rpc: vi.fn()
}));

vi.mock('#lib/supabase.js', () => ({
	supabase: { auth: { getSession: mocks.getSession }, rpc: mocks.rpc }
}));
vi.mock('#lib/learner/index.js', () => ({ learnerLedger: vi.fn(async () => undefined) }));
vi.mock('#lib/report/index.js', () => ({ openReports: vi.fn(async () => undefined) }));

import { load } from './+layout';

const event = (search: string) =>
	({
		url: new URL(`https://chaiyo.test/today${search}`),
		untrack: <T>(fn: () => T) => fn()
	}) as unknown as Parameters<typeof load>[0];
const session = { user: { id: 'lan' } };

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => void store.set(k, v),
	removeItem: (k: string) => void store.delete(k)
});

beforeEach(() => {
	store.clear();
	mocks.getSession.mockReset();
	mocks.rpc.mockReset();
	mocks.rpc.mockResolvedValue({ data: null, error: null });
});

describe('(app) layout load', () => {
	it('Given_SessionAndRemind_Then_MarkCalledOnce', async () => {
		mocks.getSession.mockResolvedValue({ data: { session }, error: null });

		await load(event(`?remind=${UUID}`));

		expect(mocks.rpc).toHaveBeenCalledTimes(1);
		expect(mocks.rpc).toHaveBeenCalledWith('mark_reminder_opened', { p_id: UUID });
	});

	it('Given_SessionAndNoRemind_Then_NoMark', async () => {
		mocks.getSession.mockResolvedValue({ data: { session }, error: null });

		await load(event(''));

		expect(mocks.rpc).not.toHaveBeenCalled();
	});

	it('Given_NoSession_Then_RedirectNoMark', async () => {
		mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });

		await expect(load(event(`?remind=${UUID}`))).rejects.toMatchObject({ status: 307 });
		expect(mocks.rpc).not.toHaveBeenCalled();
	});

	it('Given_RpcRejects_Then_LoadResolves', async () => {
		mocks.getSession.mockResolvedValue({ data: { session }, error: null });
		mocks.rpc.mockRejectedValue(new Error('network'));

		await expect(load(event(`?remind=${UUID}`))).resolves.toEqual({ session });
	});

	it('Given_NoSessionWithRemind_When_LaterSignedIn_Then_MarkedOnce', async () => {
		mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
		await load(event(`?remind=${UUID}`)).catch(() => undefined);
		expect(mocks.rpc).not.toHaveBeenCalled();

		mocks.getSession.mockResolvedValue({ data: { session }, error: null });
		await load(event(''));
		await load(event(''));

		expect(mocks.rpc).toHaveBeenCalledTimes(1);
		expect(mocks.rpc).toHaveBeenCalledWith('mark_reminder_opened', { p_id: UUID });
	});
});
