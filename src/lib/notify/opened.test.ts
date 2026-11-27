import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { markReminderOpened, rememberReminder, takeReminder } from './opened';

const UUID = '3f2b8c1e-9a4d-4e57-8b6a-1c2d3e4f5a6b';
const clientWith = (error: { message: string } | null = null) => {
	const rpc = vi.fn(async () => ({ data: null, error }));
	return { rpc, client: { rpc } as unknown as SupabaseClient };
};

describe('markReminderOpened', () => {
	it('Given_Uuid_Then_OneRpc', async () => {
		const c = clientWith();

		await markReminderOpened(c.client, UUID);

		expect(c.rpc).toHaveBeenCalledTimes(1);
		expect(c.rpc).toHaveBeenCalledWith('mark_reminder_opened', { p_id: UUID });
	});

	it.each([null, '', 'abc', `${UUID}x`])('Given_%s_Then_NoRpc', async (value) => {
		const c = clientWith();

		await markReminderOpened(c.client, value);

		expect(c.rpc).not.toHaveBeenCalled();
	});

	it('Given_RpcError_Then_Throws', async () => {
		const c = clientWith({ message: 'boom' });

		await expect(markReminderOpened(c.client, UUID)).rejects.toThrow('boom');
	});
});

const memory = () => {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		removeItem: (k: string) => void m.delete(k)
	};
};

describe('remembered reminder', () => {
	it('Given_Uuid_When_RememberThenTakeTwice_Then_UuidThenNull', () => {
		const s = memory();
		rememberReminder(s, UUID);
		expect(takeReminder(s)).toBe(UUID);
		expect(takeReminder(s)).toBeNull();
	});

	it.each([null, 'abc', 'https://evil.example'])('Given_%s_When_Remember_Then_NothingKept', (v) => {
		const s = memory();
		rememberReminder(s, v);
		expect(takeReminder(s)).toBeNull();
	});
});
