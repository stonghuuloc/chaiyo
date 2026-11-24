import { resolve } from '$app/paths';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '#lib/supabase.js';
import { takeInvite } from './invite.js';
import { landing } from './login.js';

export async function afterSignIn(session: Session, now: number) {
	const { data, error } = await supabase
		.from('settings')
		.select('onboarded_at, delete_at')
		.eq('learner_id', session.user.id)
		.maybeSingle();
	return error ? ('/(app)/(tabs)/today' as const) : landing(data, now);
}

export function hrefFor(
	l: ReturnType<typeof landing> | '/(onboard)/placement',
	store?: Parameters<typeof takeInvite>[0]
) {
	if (l === 'restore') return resolve('/login') + '?s=restore';
	const invite = l === '/(app)/(tabs)/today' && store ? takeInvite(store) : null;
	return invite ? resolve('/(app)/u/[handle]', { handle: invite }) : resolve(l);
}
