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

describe('/dev/week', () => {
	it('Given_Page_When_PickAc5_Then_CountedLine', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();
		const buttons = [...target.querySelectorAll<HTMLButtonElement>('[data-part=scenario]')];
		expect(buttons).toHaveLength(6);

		// Act
		buttons.find((b) => b.textContent === 'ac5')!.click();
		flushSync();

		// Assert
		expect(target.querySelector('[data-part=streak-line]')?.textContent?.trim()).toBe(
			'Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!'
		);
		expect(target.querySelector('[data-part=streak-chip]')).not.toBeNull();
	});
});
