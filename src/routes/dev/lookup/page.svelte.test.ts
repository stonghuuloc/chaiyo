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

vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../../test/FakeStrokes.svelte'));
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(),
	player: { playToEnd: vi.fn(async () => true), pause: vi.fn() }
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
	vi.restoreAllMocks();
});

describe('dev lookup page', () => {
	it('Given_LookupMisses_When_TapChar_Then_ErrorShown', async () => {
		// Arrange
		hoisted.lookup.mockRejectedValue(new Error('not-found: s-h1-01-01:0'));
		const root = await mountPage();
		// Act
		firstChar(root).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
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
		firstChar(root).dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
		await settle();
		// Assert
		expect(hoisted.lookup).toHaveBeenCalledWith('s-h1-01-01', 0);
		expect(document.body.querySelector('[data-part="lookup-hanzi"]')?.textContent).toBe('你好');
	});

	describe('lesson screens', () => {
		const hit = {
			hanzi: '你好',
			pinyin: 'nǐ hǎo',
			hanviet: 'nhĩ hảo',
			meaning: 'xin chào',
			sentenceId: 's-h1-01-01',
			start: 0
		};

		const tap = async (el: Element) => {
			el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
			await settle();
		};

		const panel = () => document.body.querySelector<HTMLElement>('[data-part="lookup-panel"]');

		it('Given_DialogueLine_When_TapHanzi_Then_Panel', async () => {
			// Arrange
			hoisted.lookup.mockResolvedValue(hit);
			const root = await mountPage();
			// Act
			await tap(root.querySelector('[data-part="dev-dialogue"] [data-i]')!);
			// Assert
			expect(panel()).not.toBeNull();
		});

		it('Given_GrammarExample_When_TapHanzi_Then_Panel', async () => {
			// Arrange
			hoisted.lookup.mockResolvedValue(hit);
			const root = await mountPage();
			// Act
			await tap(root.querySelector('[data-part="dev-grammar"] [data-i]')!);
			// Assert
			expect(panel()).not.toBeNull();
		});

		it('Given_WordExample_When_TapHanzi_Then_Panel', async () => {
			// Arrange
			hoisted.lookup.mockResolvedValue(hit);
			const root = await mountPage();
			// Act
			await tap(root.querySelector('[data-part="dev-word"] [data-part="example"] [data-i]')!);
			// Assert
			expect(panel()).not.toBeNull();
		});

		it('Given_Panel_When_Open_Then_DoesNotOverlapLineRect', async () => {
			// Arrange
			hoisted.lookup.mockResolvedValue(hit);
			vi.stubGlobal('innerHeight', 667);
			const rect = { top: 430, bottom: 500 } as DOMRect;
			vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(rect);
			const root = await mountPage();
			// Act
			await tap(root.querySelector('[data-part="dev-dialogue"] [data-i]')!);
			// Assert
			const top = parseFloat(panel()!.style.top);
			const end = top + parseFloat(panel()!.style.maxHeight);
			expect(end).toBeLessThanOrEqual(rect.top);
		});
	});
});
