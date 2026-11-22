import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountPage = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
	return {
		pick: (name: string) => {
			const button = [
				...target!.querySelectorAll<HTMLButtonElement>('[data-part="scenario"]')
			].find((b) => b.textContent?.trim() === name);
			button!.click();
			flushSync();
		},
		dialog: () => document.querySelector('[role="dialog"]')
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	flushSync();
});

describe('dev streak popup page', () => {
	it('Given_Page_When_PickSameDay_Then_NoDialog', () => {
		// Arrange
		const page = mountPage();

		// Act
		page.pick('sameDay');

		// Assert
		expect(page.dialog()).toBeNull();
	});

	it('Given_Page_When_PickGift14_Then_GiftNote', () => {
		// Arrange
		const page = mountPage();

		// Act
		page.pick('gift14');

		// Assert
		expect(page.dialog()!.querySelector('[data-part="streak-note"]')!.textContent).toContain(
			'Được tặng 1 lượt đóng băng!'
		);
	});
});
