import { join } from 'node:path';
import { buildBundle } from '../../content/import/bundle';
import { importContent } from '../../content/import/import';
import { createMemorySink } from '../../content/import/sink';
import { fixtureRefs } from '../../content/lint/fixtures/refs';
import { CatalogError, type CatalogSource } from '../index';

export async function fixtureSource(): Promise<CatalogSource> {
	const sink = createMemorySink();
	const res = await importContent(join(__dirname, '../../content/import/fixtures/ok'), sink, {
		refs: fixtureRefs
	});
	if ('errors' in res) throw new Error(JSON.stringify(res.errors));
	const content = sink.content!;
	const bundles = new Map(content.lessons.map((l) => [l.id, buildBundle(content, l.id)]));
	return {
		current: async () => content.sha,
		bundle: async (sha, id) => {
			if (sha !== content.sha) throw new CatalogError('malformed', id);
			const bundle = bundles.get(id);
			if (!bundle) throw new CatalogError('not-found', id);
			return bundle;
		}
	};
}
