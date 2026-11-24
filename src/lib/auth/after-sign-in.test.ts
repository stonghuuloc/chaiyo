import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const result = vi.hoisted(() => ({ value: {} as unknown }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/supabase.js', () => {
	const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => result.value };
	return { supabase: { from: () => chain } };
});

import { afterSignIn, hrefFor } from './after-sign-in';

const session = { user: { id: 'u1' } } as Session;
const now = Date.parse('2026-11-11T03:00:00Z');

beforeEach(() => (result.value = {}));

describe('hrefFor', () => {
	it('turns restore into the login page with ?s=restore and keeps other ids', () => {
		expect(hrefFor('restore')).toBe('/login?s=restore');
		expect(hrefFor('/(app)/(tabs)/today')).toBe('/(app)/(tabs)/today');
	});

	it('Given_StoredInvite_When_LandingToday_Then_InviterProfileOnce', () => {
		const m = new Map([['chaiyo:invite', 'linh']]);
		const store = {
			getItem: (k: string) => m.get(k) ?? null,
			setItem: (k: string, v: string) => void m.set(k, v),
			removeItem: (k: string) => void m.delete(k)
		};
		expect(hrefFor('/(onboard)/welcome', store)).toBe('/(onboard)/welcome');
		expect(hrefFor('/(app)/(tabs)/today', store)).toBe('/(app)/u/[handle]');
		expect(hrefFor('/(app)/(tabs)/today', store)).toBe('/(app)/(tabs)/today');
	});
});

describe('afterSignIn', () => {
	it('reads the settings row and applies the landing rule', async () => {
		result.value = { data: { onboarded_at: null, delete_at: '2026-11-16T02:00:00Z' }, error: null };
		expect(await afterSignIn(session, now)).toBe('restore');
		result.value = { data: null, error: null };
		expect(await afterSignIn(session, now)).toBe('/(onboard)/welcome');
	});

	it('falls back to Today when the read fails', async () => {
		result.value = { data: null, error: new Error('boom') };
		expect(await afterSignIn(session, now)).toBe('/(app)/(tabs)/today');
	});
});
