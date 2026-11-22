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

describe('/dev/today', () => {
	it('Given_Page_When_PickFreezeUsed_Then_FreezeUsedScene', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();
		const buttons = [...target.querySelectorAll<HTMLButtonElement>('[data-part=scenario]')];
		expect(buttons).toHaveLength(7);

		// Act
		buttons.find((b) => b.textContent === 'freezeUsed')!.click();
		flushSync();

		// Assert
		expect(target.querySelector('[data-part=scene]')?.getAttribute('data-scene')).toBe(
			'freeze-used'
		);
	});
});
