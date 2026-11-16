import { catalog } from '#lib/catalog/app.js';

export const load = async ({ params }: { params: { id: string } }) => ({
	lesson: await catalog.lesson(params.id)
});
