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

describe('dev freeze popup page', () => {
	it('Given_Page_When_PickAc3_Then_FreezeCard', () => {
		// Arrange
		const page = mountPage();

		// Act
		page.pick('ac3');

		// Assert
		expect(page.dialog()!.querySelector('h2')!.textContent).toBe('Chuỗi vẫn còn nguyên!');
	});

	it('Given_Page_When_PickSeen_Then_NoDialog', () => {
		// Arrange
		const page = mountPage();

		// Act
		page.pick('seen');

		// Assert
		expect(page.dialog()).toBeNull();
	});
});
