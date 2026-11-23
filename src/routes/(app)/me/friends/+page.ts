import type { Shell } from '#lib/shell/template.js';
import { friendsBoard } from '#lib/social/board.js';
import { supabase } from '#lib/supabase.js';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => ({
	shell: { template: 'pushed', section: 'me' } satisfies Shell,
	board: await friendsBoard(supabase)
});
