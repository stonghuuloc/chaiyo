import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bai1 } from '#lib/study/fixtures/bai1.js';

const hoisted = vi.hoisted(() => ({ url: new URL('http://localhost/dev/my-words') }));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));

const { default: Page } = await import('./+page.svelte');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const render = (search = '') => {
	hoisted.url.search = search;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
});

const total = Object.keys(bai1().lexicon).length;

describe('dev my-words harness', () => {
	it('renders one row per bai1 entry in due-first order', () => {
		// Arrange / Act
		const el = render();

		// Assert
		expect(el.querySelectorAll('li')).toHaveLength(total);
		expect(el.querySelector('[data-part="note"]')?.textContent).toBe('cần ôn hôm nay');
		expect(el.textContent).toContain(`${total} từ đã học và đã lưu`);
	});

	it('shows a blank-metadata row with its hanzi', () => {
		// Arrange / Act
		const el = render();

		// Assert
		const blank = [...el.querySelectorAll('li')].filter(
			(li) => !li.querySelector('[data-part="py"]')
		);
		expect(blank).toHaveLength(1);
	});

	it('?extra adds 2 rows', () => {
		// Arrange / Act
		const el = render('?extra=1');

		// Assert
		expect(el.querySelectorAll('li')).toHaveLength(total + 2);
		expect(el.textContent).toContain('chưa ôn');
		expect(el.textContent).toContain('tự thêm');
	});
});
