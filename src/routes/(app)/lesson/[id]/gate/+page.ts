import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { learnerLedger } from '#lib/learner/index.js';
import type { Shell } from '#lib/shell/template.js';
import { gateOpen } from '../hub';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
	const { session } = await parent();
	if (!session) return { shell: { template: 'focus' } satisfies Shell };
	const state = await learnerLedger(session).then(
		(l) => l.state(),
		() => null
	);
	if (state && !gateOpen(state, params.id))
		redirect(307, resolve('/(app)/lesson/[id]', { id: params.id }));
	return { shell: { template: 'focus' } satisfies Shell };
};
