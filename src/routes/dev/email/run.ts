import { m } from '#lib/paraglide/messages.js';

export async function runEmail(
	invoke: () => Promise<{ error: { message: string } | null }>
): Promise<string> {
	const { error } = await invoke();
	return m.chy48s2_result({ state: error ? error.message : 'ok' });
}
