import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { createCatalog } from '#lib/catalog/index.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/hub')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));

const { default: Page } = await import('./+page.svelte');
const h1 = await createCatalog(await fixtureSource()).lesson('h1-01');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountPage = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	return {
		seed: () => target!.querySelector<HTMLButtonElement>('button')!,
		words: () => target!.querySelector<HTMLAnchorElement>('[data-part=hub-row]'),
		cta: () => target!.querySelector<HTMLAnchorElement>('[data-part=hub-cta]')
	};
};

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

describe('/dev/hub', () => {
	it('Given_FreshDb_When_SeedFourWords_Then_WordsRowNowAndResumeCta', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(h1);
		const { seed, words, cta } = mountPage();
		await vi.waitFor(() => expect(seed().disabled).toBe(false));
		expect(cta()!.textContent).toContain('Bắt đầu: Từ mới');

		// Act
		seed().click();

		// Assert
		await vi.waitFor(() => {
			flushSync();
			expect(words()!.dataset.look).toBe('now');
		});
		expect(words()!.textContent).toContain(`4/10 từ · tiếp ở ${h1.words[4].hanzi}`);
		expect(cta()!.textContent).toContain('Tiếp tục: Từ mới');
	});

	it('Given_CatalogFails_When_Mount_Then_AlertNoHub', async () => {
		// Arrange
		hoisted.lesson.mockRejectedValue(new Error('offline: h1-01'));

		// Act
		const { words } = mountPage();

		// Assert
		await vi.waitFor(() => {
			flushSync();
			expect(target!.querySelector('[role=alert]')?.textContent).toBe('offline: h1-01');
		});
		expect(words()).toBeNull();
	});
});
