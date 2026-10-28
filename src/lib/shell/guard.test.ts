import { isRedirect } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { requireSession } from './guard';

describe('requireSession', () => {
	it('redirects to /login when there is no session', async () => {
		const error = await requireSession(async () => null).catch((e: unknown) => e);

		expect(isRedirect(error)).toBe(true);
		expect(error).toMatchObject({ status: 307, location: '/login' });
	});

	it('returns the session when signed in', async () => {
		const session = { access_token: 't' } as Session;

		await expect(requireSession(async () => session)).resolves.toEqual({ session });
	});
});
