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
	const pick = (key: string) => {
		[...target!.querySelectorAll<HTMLButtonElement>('[data-part=scenario]')]
			.find((b) => b.textContent === key)!
			.click();
		flushSync();
	};
	return {
		pick,
		buttons: () => target!.querySelectorAll('[data-part=scenario]').length,
		kinds: () => target!.querySelector('[data-part=practice-kinds]')?.textContent?.trim(),
		now: () => target!.querySelector('[data-part=road-row][data-status=now]')?.textContent?.trim(),
		done: () => target!.querySelectorAll('[data-part=road-row][data-status=done]').length,
		locked: () => target!.querySelectorAll('[data-part=road-row][data-status=locked]').length,
		friends: () => target!.querySelectorAll('[data-part=friend]').length
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('/dev/today-rows', () => {
	it('Given_Page_When_PickEachScenario_Then_MatchingRows', () => {
		// Arrange
		const page = mountPage();
		expect(page.buttons()).toBe(7);

		// Act / Assert
		page.pick('ac3');
		expect(page.kinds()).toBe('6 thẻ · 4 nghe · 2 viết');

		page.pick('empty');
		expect(page.kinds()).toBeUndefined();

		page.pick('start');
		expect(page.now()).toMatch(/^Bài 0/);
		expect(page.locked()).toBe(3);

		page.pick('ac6');
		expect(page.now()).toMatch(/^Bài 1/);
		expect(page.locked()).toBe(2);

		page.pick('end');
		expect(page.done()).toBe(4);
		expect(page.locked()).toBe(0);

		page.pick('friends3');
		expect(page.friends()).toBe(3);

		page.pick('friends0');
		expect(page.friends()).toBe(0);
	});
});
