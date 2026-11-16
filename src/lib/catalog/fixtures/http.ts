import { fixtureSource } from './source';

type Handler = (url: string) => Response | Promise<Response>;

/**
 * A fetch double over the fixture bundles: `/content/current.json`, and
 * `/content/<sha>/{h1-01,h0-00}.json`. Unknown URLs answer 404. `overrides`
 * replaces a route by exact URL, for the error-table negatives.
 */
export async function fakeFetch(overrides: Record<string, Handler> = {}) {
	const source = await fixtureSource();
	const sha = await source.current();
	const routes = new Map<string, Handler>([
		['/content/current.json', () => Response.json({ sha })]
	]);
	for (const id of ['h1-01', 'h0-00']) {
		const bundle = await source.bundle(sha, id);
		routes.set(`/content/${sha}/${id}.json`, () => Response.json(bundle));
	}
	for (const [url, handler] of Object.entries(overrides)) routes.set(url, handler);

	const urls: string[] = [];
	const fetch = async (url: string): Promise<Response> => {
		urls.push(url);
		const handler = routes.get(url);
		return handler ? handler(url) : new Response('not found', { status: 404 });
	};
	return { fetch, urls, sha };
}
