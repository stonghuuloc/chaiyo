import { isHttpError } from '@sveltejs/kit';
import { fakeFetch } from '#lib/catalog/fixtures/http.js';
import { CatalogError } from '#lib/catalog/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());

describe('lesson layout load', () => {
	it('Given_FetchServesBundles_When_LoadH1_01_Then_LessonXinChao_WithSha', async () => {
		// Arrange
		const f = await fakeFetch();
		vi.stubGlobal('fetch', f.fetch);
		// Dynamic import: a static one would run before the stub and make the no-request check vacuous.
		const { load } = await import('./+layout');
		const requestsBeforeLoad = [...f.urls];
		// Act
		const data = await load({ params: { id: 'h1-01' } });
		// Assert
		expect(requestsBeforeLoad).toEqual([]);
		expect(data.lesson.lesson.title).toBe('Xin chào');
		expect(data.lesson.words).toHaveLength(10);
		expect(data.lesson.contentSha).toMatch(/^[0-9a-f]{64}$/);
		expect(f.urls).toEqual(['/content/current.json', `/content/${f.sha}/h1-01.json`]);
	});

	it('Given_Fetch404s_When_LoadH9_99_Then_404', async () => {
		// Arrange
		const f = await fakeFetch();
		vi.stubGlobal('fetch', f.fetch);
		const { load } = await import('./+layout');
		// Act
		let thrown: unknown;
		try {
			await load({ params: { id: 'h9-99' } });
		} catch (e) {
			thrown = e;
		}
		// Assert
		expect(isHttpError(thrown, 404)).toBe(true);
	});

	it('Given_Fetch500_When_LoadH0_00_Then_MalformedPropagates', async () => {
		// Arrange
		const f = await fakeFetch();
		vi.stubGlobal('fetch', async (url: string) =>
			url === `/content/${f.sha}/h0-00.json` ? new Response('boom', { status: 500 }) : f.fetch(url)
		);
		const { load } = await import('./+layout');
		// Act
		let thrown: unknown;
		try {
			await load({ params: { id: 'h0-00' } });
		} catch (e) {
			thrown = e;
		}
		// Assert
		if (!(thrown instanceof CatalogError)) throw thrown;
		expect(thrown.code).toBe('malformed');
	});
	it('Given_BundleFetchRejects_When_LoadH0_00_Then_503Offline', async () => {
		// Arrange
		const f = await fakeFetch({
			[`/content/${(await fakeFetch()).sha}/h0-00.json`]: () => {
				throw new TypeError('Failed to fetch');
			}
		});
		vi.stubGlobal('fetch', f.fetch);
		const { load } = await import('./+layout');
		// Act
		let thrown: unknown;
		try {
			await load({ params: { id: 'h0-00' } });
		} catch (e) {
			thrown = e;
		}
		// Assert
		expect(isHttpError(thrown, 503)).toBe(true);
	});
});
