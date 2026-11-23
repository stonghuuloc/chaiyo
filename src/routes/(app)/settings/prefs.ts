import type { SupabaseClient } from '@supabase/supabase-js';
import type { HanziStyle } from '#lib/shell/hanzi-style.js';

export type Prefs = { time: string; hanzi: HanziStyle; email: boolean };

type Client = Pick<SupabaseClient, 'from'>;

export function toPrefs(
	row: {
		reminder_time?: string | null;
		hanzi_style?: string | null;
		remind_email?: boolean | null;
	} | null
): Prefs {
	return {
		time: row?.reminder_time?.slice(0, 5) ?? '21:00',
		hanzi: row?.hanzi_style === 'xing' ? 'xing' : 'kai',
		email: row?.remind_email !== false
	};
}

export async function savePrefs(client: Client, uid: string, patch: Partial<Prefs>) {
	const row = {
		learner_id: uid,
		...('time' in patch && { reminder_time: patch.time }),
		...('hanzi' in patch && { hanzi_style: patch.hanzi }),
		...('email' in patch && { remind_email: patch.email })
	};
	const { error } = await client.from('settings').upsert(row, { onConflict: 'learner_id' });
	if (error) throw error;
}

export const serial = () => {
	let tail: Promise<unknown> = Promise.resolve();
	return <T>(job: () => Promise<T>) => {
		const next = tail.then(job, job);
		tail = next.catch(() => undefined);
		return next;
	};
};
