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

	it('Given_Fetch404s_When_LoadH9_99_Then_RejectsNotFound_h9_99', async () => {
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
		expect(thrown).toBeInstanceOf(CatalogError);
		expect((thrown as CatalogError).code).toBe('not-found');
		expect((thrown as CatalogError).id).toBe('h9-99');
	});
});
