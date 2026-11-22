import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('/dev/practice', () => {
	it('Given_Page_When_PickClear_Then_ClearCopy', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();
		const buttons = [...target.querySelectorAll<HTMLButtonElement>('[data-part=scenario]')];
		expect(target.textContent).toContain('khoảng 3 phút');

		// Act
		buttons.find((b) => b.textContent === 'clear')!.click();
		flushSync();

		// Assert
		expect(target.textContent).toContain('Hôm nay xong bài rồi!');
		expect(target.querySelector('a')).toBeNull();
	});
});
