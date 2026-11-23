import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { supabaseAddresses } from './address';

const LAN = '11111111-1111-1111-1111-111111111111';
const json = (body: unknown, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
const clientWith = (fetch: typeof globalThis.fetch) =>
	createClient('http://127.0.0.1:56321', 'test-key', {
		auth: { persistSession: false },
		global: { fetch }
	});

describe('supabaseAddresses', () => {
	it('Given_Lan_When_AddressOf_Then_AdminPathAndEmail', async () => {
		// Arrange
		const fetch = vi.fn(async () => json({ id: LAN, email: 'lan@example.com' }, 200));

		// Act
		const email = await supabaseAddresses(clientWith(fetch)).addressOf(LAN);

		// Assert
		expect(email).toBe('lan@example.com');
		expect(fetch).toHaveBeenCalledTimes(1);
		const [url] = fetch.mock.calls[0] as unknown as [string];
		expect(new URL(url).pathname.endsWith(`/auth/v1/admin/users/${LAN}`)).toBe(true);
	});

	it('Given_UserWithoutEmail_When_AddressOf_Then_Null', async () => {
		const fetch = vi.fn(async () => json({ id: LAN }, 200));

		const email = await supabaseAddresses(clientWith(fetch)).addressOf(LAN);

		expect(email).toBeNull();
	});

	it('Given_404_When_AddressOf_Then_Throws', async () => {
		const fetch = vi.fn(async () => json({ msg: 'User not found', code: 404 }, 404));

		const act = supabaseAddresses(clientWith(fetch)).addressOf(LAN);

		await expect(act).rejects.toThrow();
	});
});
