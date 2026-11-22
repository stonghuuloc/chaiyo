import type { Shell } from '#lib/shell/template.js';
import type { PageLoad } from './$types';
import { skillParam } from './cards';

export const load: PageLoad = ({ url }) => ({
	shell: { template: 'focus' } satisfies Shell,
	skill: skillParam(url.searchParams.get('skill'))
});
