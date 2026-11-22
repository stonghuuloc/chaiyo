import { describe, expect, it } from 'vitest';
import { APP_SHELL, appShell, cachedPage } from './shell';

describe('appShell', () => {
	it('Given_ContentPaths_When_AppShell_Then_DroppedOrderKept', () => {
		// Arrange
		const sha = 'a'.repeat(64);
		const paths = [
			'/_app/a.js',
			'/content/current.json',
			`/content/${sha}/h1-01.json`,
			'/fonts/lessons/ukai-h1-01.woff2',
			'/'
		];

		// Act
		const got = appShell(paths);

		// Assert
		expect(got).toEqual(['/_app/a.js', '/fonts/lessons/ukai-h1-01.woff2', '/']);
	});

	it('Given_NoContentPath_When_AppShell_Then_SameItems', () => {
		// Arrange
		const paths = ['/_app/a.js', '/'];

		// Act
		const got = appShell(paths);

		// Assert
		expect(got).toEqual(paths);
		expect(appShell([])).toEqual([]);
	});
});

describe('cachedPage', () => {
	const store = (entries: Record<string, string>) => ({
		match: async (req: RequestInfo | URL) => {
			const path = new URL(req instanceof Request ? req.url : String(req), 'https://app.test')
				.pathname;
			return path in entries ? new Response(entries[path]) : undefined;
		}
	});

	it('Given_PageCached_When_CachedPage_Then_PageServed', async () => {
		// Arrange
		const cache = store({ '/lesson/h1-01': 'lesson', [APP_SHELL]: 'shell' });

		// Act
		const res = await cachedPage(cache, new Request('https://app.test/lesson/h1-01'), APP_SHELL);

		// Assert
		expect(await res?.text()).toBe('lesson');
	});

	it('Given_PageMissing_When_CachedPage_Then_ShellServed', async () => {
		// Arrange
		const cache = store({ [APP_SHELL]: 'shell' });

		// Act
		const res = await cachedPage(cache, new Request('https://app.test/lesson/h0-00'), APP_SHELL);

		// Assert
		expect(APP_SHELL).toBe('/today');
		expect(await res?.text()).toBe('shell');
	});

	it('Given_NothingCached_When_CachedPage_Then_Undefined', async () => {
		// Arrange
		const cache = store({});

		// Act
		const res = await cachedPage(cache, new Request('https://app.test/lesson/h0-00'), APP_SHELL);

		// Assert
		expect(res).toBeUndefined();
	});
});
