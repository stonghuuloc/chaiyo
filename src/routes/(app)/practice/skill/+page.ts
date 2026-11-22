import type { Shell } from '#lib/shell/template.js';
import type { PageLoad } from './$types';
import { skillKey, thiLevel } from './skills';

export const load: PageLoad = ({ url }) => ({
	shell: { template: 'pushed', section: 'practice' } satisfies Shell,
	k: skillKey(url.searchParams.get('k')),
	lv: thiLevel(url.searchParams.get('lv'))
});
