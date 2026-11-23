import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = { name: string; photo: string | null; hidden: boolean };

type Client = Pick<SupabaseClient, 'from'>;

export async function loadProfile(client: Client, uid: string): Promise<Profile> {
	const { data, error } = await client
		.from('profiles')
		.select('display_name, photo_url, hidden')
		.eq('learner_id', uid)
		.maybeSingle();
	if (error) throw error;
	return {
		name: data?.display_name ?? '',
		photo: data?.photo_url ?? null,
		hidden: data?.hidden === true
	};
}

export async function saveProfile(client: Client, uid: string, patch: Partial<Profile>) {
	const row = {
		learner_id: uid,
		...('name' in patch && { display_name: patch.name }),
		...('photo' in patch && { photo_url: patch.photo }),
		...('hidden' in patch && { hidden: patch.hidden })
	};
	const { error } = await client.from('profiles').upsert(row, { onConflict: 'learner_id' });
	if (error) throw error;
}

export function leaveName(saved: string, typed: string) {
	const value = typed.trim();
	return !value || value === saved ? { value: saved, write: false } : { value, write: true };
}
