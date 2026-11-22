import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({
	resolve: (id: string, p?: { id: string }) => id.replace('[id]', p?.id ?? '')
}));

const { default: Page } = await import('./+page.svelte');

let app: ReturnType<typeof mount> | undefined;
afterEach(() => {
	if (app) unmount(app);
	app = undefined;
	vi.unstubAllGlobals();
	document.body.innerHTML = '';
});

describe('dev lesson harness', () => {
	it('Given_CachedBundle_When_Reset_Then_DroppedCountShown', async () => {
		// Arrange
		const entries = new Set(['https://app.test/content/current.json', 'https://app.test/today']);
		vi.stubGlobal('caches', {
			keys: async () => ['shell-1'],
			open: async () => ({
				keys: async () => [...entries].map((u) => new Request(u)),
				delete: async (r: Request) => entries.delete(r.url)
			})
		});
		app = mount(Page, { target: document.body });
		flushSync();

		// Act
		document.querySelector<HTMLButtonElement>('[data-part="reset"]')!.click();
		await vi.waitFor(() => expect(document.querySelector('[data-part="dropped"]')).not.toBeNull());

		// Assert
		expect(document.querySelector('[data-part="dropped"]')?.textContent).toBe('dropped 1');
		expect([...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/dev/lesson/h1-01',
			'/dev/lesson/h0-00'
		]);
	});
});
