import { isAdmin } from '#lib/admin/admin.js';
import { listReports } from '#lib/admin/reports.js';
import type { Shell } from '#lib/shell/template.js';
import { supabase } from '#lib/supabase.js';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	if (!(await isAdmin(supabase))) error(403);
	return {
		shell: { template: 'pushed', section: 'me' } satisfies Shell,
		reports: await listReports(supabase)
	};
};
