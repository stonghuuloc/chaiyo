import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { rememberInvite } from '#lib/auth/invite.js';
import { supabase } from '#lib/supabase.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
	const { data } = await supabase.auth.getSession();
	if (!data.session) rememberInvite(localStorage, params.handle);
	redirect(307, resolve('/(app)/u/[handle]', { handle: params.handle }));
};
