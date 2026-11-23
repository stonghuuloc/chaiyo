import { publicProfile } from '#lib/social/public-profile.js';
import type { Shell } from '#lib/shell/template.js';
import { supabase } from '#lib/supabase.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => ({
	shell: { template: 'pushed', section: 'me' } satisfies Shell,
	profile: await publicProfile(supabase, params.handle)
});
