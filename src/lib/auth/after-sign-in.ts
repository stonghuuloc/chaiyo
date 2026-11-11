import { resolve } from '$app/paths';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase.js';
import { landing } from './login.js';

export async function afterSignIn(session: Session, now: number) {
	const { data, error } = await supabase
		.from('settings')
		.select('onboarded_at, delete_at')
		.eq('learner_id', session.user.id)
		.maybeSingle();
	return error ? ('/(app)/(tabs)/today' as const) : landing(data, now);
}

export const hrefFor = (l: ReturnType<typeof landing>) =>
	l === 'restore' ? resolve('/login') + '?s=restore' : resolve(l);
