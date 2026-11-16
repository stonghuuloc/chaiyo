import { catalog } from '#lib/catalog/app.js';
import type { ReportContext } from '#lib/report/types.js';
import type { Shell } from '#lib/shell/template.js';
import type { PageLoad } from './$types';
import { loadWord } from './word-view';

// The view drops the sha; the catalog still has the bundle sha for this word.
const reportFor = async (id: string): Promise<ReportContext> => {
	const { contentSha } = await catalog.word(id);
	if (!contentSha) throw new Error(`word ${id} has no content sha`);
	return { lesson: null, step: null, word: id, contentSha };
};

export const load: PageLoad = async ({ params, url }) => {
	const word = await loadWord(catalog, params.id, url.searchParams.get('lesson'));
	const report = 'notFound' in word ? null : await reportFor(params.id);
	return {
		shell: { template: 'pushed', section: 'practice' } satisfies Shell,
		id: params.id,
		word,
		report
	};
};
