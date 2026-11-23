import { m } from '#lib/paraglide/messages.js';

export type PushDeps = {
	key: string | undefined;
	enable(): Promise<'unsupported' | 'denied' | 'on'>;
	disable(): Promise<void>;
	invoke(): Promise<{ error: { message: string } | null }>;
};

export async function runPush(action: 'on' | 'off' | 'test', d: PushDeps): Promise<string> {
	if (!d.key) return m.chy48s1_no_key();
	if (action === 'on') return m.chy48s1_state({ state: await d.enable() });
	if (action === 'off') {
		await d.disable();
		return m.chy48s1_state({ state: 'off' });
	}
	const { error } = await d.invoke();
	return m.chy48s1_state({ state: error ? error.message : 'ok' });
}
