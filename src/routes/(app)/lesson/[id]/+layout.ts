import { error } from '@sveltejs/kit';
import { catalog } from '#lib/catalog/app.js';
import { CatalogError } from '#lib/catalog/index.js';

export const load = async ({ params }: { params: { id: string } }) => {
	try {
		return { lesson: await catalog.lesson(params.id) };
	} catch (e) {
		if (e instanceof CatalogError && e.code === 'not-found')
			throw error(404, `no lesson ${params.id}`);
		if (e instanceof CatalogError && e.code === 'offline') throw error(503, 'offline');
		throw e;
	}
};
