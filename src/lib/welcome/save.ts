import type { SupabaseClient } from '@supabase/supabase-js';
import type { Welcome } from './welcome';

export async function saveWelcome(
	s: Pick<Welcome, 'name' | 'photo' | 'time' | 'push' | 'emailOn' | 'telegram'>,
	{
		client,
		learnerId,
		now,
		tz
	}: { client: Pick<SupabaseClient, 'from'>; learnerId: string; now: Date; tz: string }
) {
	const stamp = now.toISOString();
	const profile = await client
		.from('profiles')
		.upsert(
			{ learner_id: learnerId, display_name: s.name.trim(), photo_url: s.photo },
			{ onConflict: 'learner_id' }
		);
	if (profile.error) throw profile.error;
	const settings = await client.from('settings').upsert(
		{
			learner_id: learnerId,
			tz,
			reminder_time: s.time,
			remind_push: s.push,
			remind_email: s.emailOn,
			remind_telegram: s.telegram,
			onboarded_at: stamp,
			updated_at: stamp
		},
		{ onConflict: 'learner_id' }
	);
	if (settings.error) throw settings.error;
}
