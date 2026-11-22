import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { MyWordRow } from '#lib/study/index.js';
import WordsList from './WordsList.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const row = (hanzi: string, over: Partial<MyWordRow> = {}): MyWordRow => ({
	hanzi,
	pinyin: `py-${hanzi}`,
	hanViet: `hv-${hanzi}`,
	nghia: `nghia-${hanzi}`,
	bars: 0,
	dueNote: null,
	source: 'lesson',
	...over
});

const render = (rows: MyWordRow[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WordsList, { target, props: { rows } }) as Record<string, unknown>;
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
});

describe('WordsList', () => {
	it('renders the count line for 30 rows', () => {
		// Arrange
		const rows = Array.from({ length: 30 }, (_, i) => row(`字${i}`));

		// Act
		const el = render(rows);

		// Assert
		expect(el.textContent).toContain('30 từ đã học và đã lưu');
		expect(el.querySelectorAll('li')).toHaveLength(30);
	});

	it('a row shows hanzi, pinyin, Hán Việt and nghĩa', () => {
		// Arrange / Act
		const el = render([row('你')]);

		// Assert
		const li = el.querySelector('li')!;
		expect(li.querySelector('[lang="zh"]')?.textContent).toBe('你');
		expect(li.textContent).toContain('py-你');
		expect(li.textContent).toContain('hv-你');
		expect(li.textContent).toContain('nghia-你');
	});

	it('a 2-bar row has aria label 2 and 2 filled segments', () => {
		// Arrange / Act
		const el = render([row('你', { bars: 2 })]);

		// Assert
		const meter = el.querySelector('[role="img"]')!;
		expect(meter.getAttribute('aria-label')).toBe('Độ nhớ: 2 trên 3');
		expect(meter.querySelectorAll('[data-filled="true"]')).toHaveLength(2);
		expect(meter.querySelectorAll('i')).toHaveLength(3);
	});

	it('the legend is the exact AC text', () => {
		// Arrange / Act
		const el = render([row('你')]);

		// Assert
		expect(el.textContent).toContain(
			'Cột = độ nhớ trên thẻ từ. Luyện đúng thì cột tăng, quên thì từ quay lại sớm hơn.'
		);
	});

	it('a blank-metadata row shows its hanzi only', () => {
		// Arrange / Act
		const el = render([row('你', { pinyin: '', hanViet: '', nghia: '' })]);

		// Assert
		const li = el.querySelector('li')!;
		expect(li.querySelector('[lang="zh"]')?.textContent).toBe('你');
		expect(
			li.querySelectorAll('[data-part="py"], [data-part="hv"], [data-part="nghia"]')
		).toHaveLength(0);
	});

	it('a self row shows tự thêm and a lesson row does not', () => {
		// Arrange / Act
		const el = render([row('你', { source: 'self' }), row('好')]);

		// Assert
		const [a, b] = [...el.querySelectorAll('li')];
		expect(a.textContent).toContain('tự thêm');
		expect(b.textContent).not.toContain('tự thêm');
	});
});
