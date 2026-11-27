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
