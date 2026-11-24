import { publicProfile } from '#lib/social/public-profile.js';
import type { Shell } from '#lib/shell/template.js';
import { supabase } from '#lib/supabase.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	const profile = await publicProfile(supabase, params.handle);
	const asked = url.searchParams.get('badge');
	const badge =
		profile.status === 'visible' ? (profile.badges.find((id) => id === asked) ?? null) : null;
	return { shell: { template: 'pushed', section: 'me' } satisfies Shell, profile, badge };
};
