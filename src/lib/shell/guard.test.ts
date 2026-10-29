import { isRedirect } from '@sveltejs/kit';
import { AuthApiError, AuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { requireSession } from './guard';

const session: Session = {
	access_token: 'access',
	refresh_token: 'refresh',
	expires_in: 3600,
	token_type: 'bearer',
	user: {
		id: 'u1',
		aud: 'authenticated',
		app_metadata: {},
		user_metadata: {},
		created_at: '2026-10-29T00:00:00Z'
	}
};

const redirectOf = (p: Promise<unknown>) => p.then(() => null).catch((e: unknown) => e);

describe('requireSession', () => {
	it('redirects to /login when there is no session', async () => {
		const error = await redirectOf(requireSession(async () => ({ session: null, error: null })));

		expect(isRedirect(error)).toBe(true);
		expect(error).toMatchObject({ status: 307, location: '/login' });
	});

	it('redirects to /login when the refresh token is rejected', async () => {
		const rejected = new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found');

		const error = await redirectOf(
			requireSession(async () => ({ session: null, error: rejected }))
		);

		expect(error).toMatchObject({ status: 307, location: '/login' });
	});

	it('stays in the app when the refresh fails on the network', async () => {
		const offline = new AuthRetryableFetchError('Failed to fetch', 0);

		await expect(requireSession(async () => ({ session: null, error: offline }))).resolves.toEqual({
			session: null
		});
	});

	it('returns the session when signed in', async () => {
		await expect(requireSession(async () => ({ session, error: null }))).resolves.toEqual({
			session
		});
	});
});
