import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { createCatalog } from '#lib/catalog/index.js';
import { fixtureSource } from '#lib/catalog/fixtures/source.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/primer')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url, params: {} } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));

const { default: Page } = await import('./+page.svelte');
const h0 = await createCatalog(await fixtureSource()).lesson('h0-00');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountPage = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	return {
		seed: () => target!.querySelector<HTMLButtonElement>('button')!,
		rows: () => [...target!.querySelectorAll<HTMLAnchorElement>('[data-part=hub-row]')],
		cta: () => target!.querySelector<HTMLAnchorElement>('[data-part=hub-cta]')
	};
};

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
	hoisted.url.search = '';
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

describe('/dev/primer', () => {
	it('Given_DevPrimer_When_Mounted_Then_HubRows', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(h0);
		const { seed, rows, cta } = mountPage();

		// Act
		await vi.waitFor(() => expect(seed().disabled).toBe(false));
		flushSync();

		// Assert
		expect(hoisted.lesson).toHaveBeenCalledWith('h0-00');
		expect(rows().map((r) => r.textContent)).toEqual([
			expect.stringContaining('Thanh điệu'),
			expect.stringContaining('Vận mẫu'),
			expect.stringContaining('Thanh mẫu'),
			expect.stringContaining('Quy tắc viết'),
			expect.stringContaining('Biến điệu')
		]);
		expect(cta()!.textContent).toContain('Bắt đầu: Thanh điệu');
	});

	it('Given_FreshDb_When_Seed5of5_Then_GateCta', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(h0);
		const { seed, cta } = mountPage();
		await vi.waitFor(() => expect(seed().disabled).toBe(false));

		// Act
		seed().click();

		// Assert
		await vi.waitFor(() => {
			flushSync();
			expect(cta()!.textContent).toContain('Làm bài kiểm tra');
		});
		expect(cta()!.getAttribute('href')).toMatch(/\/lesson\/h0-00\/gate$/);
	});

	it('Given_SectionParam_When_Mounted_Then_CardChipsShown', async () => {
		// Arrange
		hoisted.url.search = '?section=tones';
		const lesson = structuredClone(h0);
		if (!('kind' in lesson.lesson)) throw new Error('h0-00 is not a Primer');
		for (const sec of Object.values(lesson.lesson.sections))
			sec.drills = [
				{
					id: 'd1',
					type: 'choice',
					tests: {},
					prompt: { kind: 'syllable', text: 'mā' },
					optionKind: 'pinyin',
					options: ['mā', 'má'],
					answer: 0
				}
			];
		hoisted.lesson.mockResolvedValue(lesson);

		// Act
		mountPage();

		// Assert
		await vi.waitFor(() => {
			flushSync();
			expect(target!.querySelectorAll('[data-part=chip]').length).toBeGreaterThan(0);
		});
		expect(target!.querySelector('[data-part=hub-row]')).toBeNull();
	});
});
