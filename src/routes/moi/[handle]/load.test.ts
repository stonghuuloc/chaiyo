import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ value: null as unknown }));
vi.mock('#lib/supabase.js', () => ({
	supabase: { auth: { getSession: async () => ({ data: { session: session.value } }) } }
}));

import { load } from './+page';

const run = async (handle: string) => {
	try {
		await load({ params: { handle } } as Parameters<typeof load>[0]);
	} catch (e) {
		return e as { status?: number; location?: string };
	}
};

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => void store.set(k, v),
	removeItem: (k: string) => void store.delete(k)
});

beforeEach(() => store.clear());

describe('moi redirect', () => {
	it('Given_LoggedOut_When_MoiLinh_Then_307ToULinhAndInviteKept', async () => {
		session.value = null;
		const thrown = await run('linh');
		expect(thrown?.status).toBe(307);
		expect(thrown?.location).toMatch(/\/u\/linh$/);
		expect(localStorage.getItem('chaiyo:invite')).toBe('linh');
	});

	it('Given_LoggedIn_When_MoiLinh_Then_NoInviteStored', async () => {
		session.value = { user: { id: 'u1' } };
		const thrown = await run('linh');
		expect(thrown?.status).toBe(307);
		expect(localStorage.getItem('chaiyo:invite')).toBeNull();
	});
});
