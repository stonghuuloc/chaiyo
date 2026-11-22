import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import WordsLink from './WordsLink.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (view: { count: number; hanzi: string[] }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WordsLink, { target, props: { view } }) as Record<string, unknown>;
	flushSync();
	return {
		heading: () => target!.querySelector('h2')?.textContent,
		link: () => target!.querySelector<HTMLAnchorElement>('[data-part=mywords-link]')!,
		hanzi: () => target!.querySelector('[data-part=mywords-hanzi]')
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('WordsLink', () => {
	it('Given_30_When_Mount_Then_HeadingCount30Hanzi8HrefWords', () => {
		// Arrange
		const hanzi = ['一', '二', '三', '四', '五', '六', '七', '八'];
		// Act
		const view = render({ count: 30, hanzi });
		// Assert
		expect(view.heading()).toBe('Từ của tôi');
		expect(view.link().textContent).toContain('30 từ đã học và đã lưu');
		expect(view.hanzi()?.textContent).toBe('一 二 三 四 五 六 七 八');
		expect(view.link().getAttribute('href')).toMatch(/\/practice\/words$/);
	});

	it('Given_0_When_Mount_Then_Count0NoHanziLinkKept', () => {
		// Arrange
		// Act
		const view = render({ count: 0, hanzi: [] });
		// Assert
		expect(view.link().textContent).toContain('0 từ đã học và đã lưu');
		expect(view.hanzi()).toBeNull();
		expect(view.link()).not.toBeNull();
	});
});
