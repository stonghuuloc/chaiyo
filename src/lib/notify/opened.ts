import type { SupabaseClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function markReminderOpened(
	client: Pick<SupabaseClient, 'rpc'>,
	value: string | null
): Promise<void> {
	if (value === null || !UUID.test(value)) return;
	const { error } = await client.rpc('mark_reminder_opened', { p_id: value });
	if (error) throw new Error(error.message);
}

const KEY = 'chaiyo:remind';

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const isReminderId = (value: string | null): value is string =>
	value !== null && UUID.test(value);

export function rememberReminder(store: Store, value: string | null) {
	if (isReminderId(value)) store.setItem(KEY, value);
}

export function takeReminder(store: Store): string | null {
	const value = store.getItem(KEY);
	store.removeItem(KEY);
	return isReminderId(value) ? value : null;
}
