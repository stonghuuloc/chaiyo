import { catalog } from '#lib/catalog/app.js';
import type { Shell } from '#lib/shell/template.js';
import type { PageLoad } from './$types';
import { loadWord } from './word-view';

export const load: PageLoad = async ({ params, url }) => ({
	shell: { template: 'pushed', section: 'practice' } satisfies Shell,
	id: params.id,
	word: await loadWord(catalog, params.id, url.searchParams.get('lesson'))
});
