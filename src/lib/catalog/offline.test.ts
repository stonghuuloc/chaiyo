import { describe, expect, it } from 'vitest';
import { networkFirst } from '../../service-worker/network';
import { fakeFetch } from './fixtures/http';
import { httpSource } from './http';
import { CatalogError, createCatalog } from './index';

const ORIGIN = 'https://app.test';

function mapCache() {
	const map = new Map<string, Response>();
	return {
		map,
		put: async (req: RequestInfo | URL, res: Response) => {
			map.set(new Request(req).url, res);
		},
		match: async (req: RequestInfo | URL) => map.get(new Request(req).url)?.clone()
	};
}

// The page fetch as the SW answers it: network-first through the shared cache.
function swFetch(cache: ReturnType<typeof mapCache>, network: (url: string) => Promise<Response>) {
	return (url: string) =>
		networkFirst(
			new Request(ORIGIN + url),
			cache,
			(input) => network(new URL((input as Request).url).pathname),
			() => {}
		);
}

const offline = async (): Promise<Response> => {
	throw new TypeError('Failed to fetch');
};

describe('catalog through the service worker cache', () => {
	it('Given_H1_01OpenedOnline_When_ReloadOffline_Then_SameContentSha', async () => {
		// Arrange
		const cache = mapCache();
		const f = await fakeFetch();
		const online = await createCatalog(httpSource(swFetch(cache, f.fetch))).lesson('h1-01');

		// Act
		const again = await createCatalog(httpSource(swFetch(cache, offline))).lesson('h1-01');

		// Assert
		expect(again.contentSha).toBe(online.contentSha);
		expect(again.lesson.title).toBe('Xin chào');
		expect(again.words).toHaveLength(online.words.length);
	});

	it('Given_H0_00NeverOpened_When_LessonOffline_Then_CatalogErrorOffline', async () => {
		// Arrange
		const cache = mapCache();
		const f = await fakeFetch();
		await createCatalog(httpSource(swFetch(cache, f.fetch))).lesson('h1-01');

		// Act
		let thrown: unknown;
		try {
			await createCatalog(httpSource(swFetch(cache, offline))).lesson('h0-00');
		} catch (e) {
			thrown = e;
		}

		// Assert
		expect(thrown).toBeInstanceOf(CatalogError);
		expect((thrown as CatalogError).code).toBe('offline');
	});
});
