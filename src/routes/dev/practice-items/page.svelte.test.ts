import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mounted } from '../../../test/FakeVietStrokes.svelte';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/practice-items')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));
vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../test/FakeVietStrokes.svelte')
);

const { default: Page } = await import('./+page.svelte');

const hanzi = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢'];
const content = {
	contentSha: 'sha-1',
	words: hanzi.map((h, i) => ({
		id: `w${i}`,
		hanzi: h,
		pinyin: `py${i}`,
		senses: [{ vi: `nghĩa ${i}` }],
		audio: `words/${i}`
	}))
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	hoisted.lesson.mockReset();
	hoisted.lesson.mockResolvedValue(content);
	hoisted.url.search = '';
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	mounted.length = 0;
});

const render = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
};

const cta = () => target!.querySelector<HTMLButtonElement>('[data-part="cta"]')!;
const rows = () => [...target!.querySelectorAll('[data-part="results"] tbody tr')];

const settleItem = async (word: string, hit: boolean) => {
	const isViet = await vi.waitFor(() => {
		if (target!.querySelector('[data-part="fake-strokes"]')) return true;
		if (target!.querySelector('button[aria-pressed]')) return false;
		throw new Error('no item');
	});
	if (isViet) {
		for (let guard = 0; cta().disabled && guard < 10; guard++) {
			mounted.at(-1)!.oncomplete?.({ mistakes: hit ? 0 : 5 });
			flushSync();
		}
	} else {
		const options = [...target!.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
		const pick = options.find((b) => (b.textContent?.trim() === word) === hit)!;
		pick.click();
	}
	flushSync();
	cta().click();
	flushSync();
};

describe('dev practice-items harness', () => {
	it('Given_Harness_When_MissFirstItem_Then_ItemReturnsMarkedAtEnd', async () => {
		// Arrange
		render();
		await vi.waitFor(() => expect(cta()).not.toBeNull());

		// Act
		await settleItem('你', false);
		for (const w of ['好', '您', '你们', '你好', '对不起']) await settleItem(w, true);
		expect(target!.textContent).toContain('gặp lại');
		await settleItem('你', true);

		// Assert
		const table = rows().map((r) => r.textContent);
		expect(table).toHaveLength(7);
		expect(table[0]).toContain('practice:nghe:你false');
		expect(table[6]).toContain('practice:nghe:你#againtruetrue');
		expect(target!.querySelector('[data-part="finished"]')).not.toBeNull();
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
	});

	it('Given_Harness_When_AllHits_Then_ResultsTableHasSixRows', async () => {
		// Arrange
		render();
		await vi.waitFor(() => expect(cta()).not.toBeNull());

		// Act
		for (const w of ['你', '好', '您', '你们', '你好', '对不起']) await settleItem(w, true);

		// Assert
		expect(rows()).toHaveLength(6);
		expect(rows().every((r) => r.textContent!.includes('true'))).toBe(true);
	});

	it('Given_MissParam_When_FirstAppearance_Then_ForcedMiss', async () => {
		// Arrange
		hoisted.url.search = '?miss=你';
		render();
		await vi.waitFor(() => expect(cta()).not.toBeNull());

		// Act
		await settleItem('你', true);

		// Assert
		expect(rows()[0].textContent).toContain('practice:nghe:你falsefalse');
	});
});
