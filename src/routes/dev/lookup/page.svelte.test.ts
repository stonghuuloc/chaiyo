import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, tick, unmount } from 'svelte';
import { createCatalog } from '#lib/catalog/index.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	lookup: vi.fn(),
	url: new URL('http://localhost/dev/lookup')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({
	catalog: {
		lesson: hoisted.lesson,
		lookup: hoisted.lookup,
		find: async () => ({ word: null, char: null })
	}
}));

const { default: Page } = await import('./+page.svelte');
const h1 = await createCatalog(await fixtureSource()).lesson('h1-01');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	for (let i = 0; i < 10; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
};

const mountPage = async () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	await settle();
	return target;
};

const firstChar = (root: HTMLElement) =>
	root.querySelector<HTMLElement>('[data-id="s-h1-01-01"] [data-i="0"]')!;

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset().mockResolvedValue(h1);
	hoisted.lookup.mockReset();
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

describe('dev lookup page', () => {
	it('Given_LookupMisses_When_TapChar_Then_ErrorShown', async () => {
		// Arrange
		hoisted.lookup.mockRejectedValue(new Error('not-found: s-h1-01-01:0'));
		const root = await mountPage();
		// Act
		firstChar(root).click();
		await settle();
		// Assert
		expect(root.textContent).toContain('not-found: s-h1-01-01:0');
	});

	it('Given_LookupHits_When_TapChar_Then_SheetOpens', async () => {
		// Arrange
		hoisted.lookup.mockResolvedValue({
			hanzi: '你好',
			pinyin: 'nǐ hǎo',
			hanviet: 'nhĩ hảo',
			meaning: 'xin chào',
			sentenceId: 's-h1-01-01',
			start: 0
		});
		const root = await mountPage();
		// Act
		firstChar(root).click();
		await settle();
		// Assert
		expect(hoisted.lookup).toHaveBeenCalledWith('s-h1-01-01', 0);
		expect(document.body.querySelector('[data-part="lookup-hanzi"]')?.textContent).toBe('你好');
	});
});
