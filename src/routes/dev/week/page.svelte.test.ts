import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Page from './+page.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	document.body.querySelectorAll('[role=dialog]').forEach((d) => d.remove());
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

	it('Given_Page_When_ClickChip_Then_RulesSheet', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();

		// Act
		target.querySelector<HTMLElement>('[data-part=streak-chip]')!.click();
		flushSync();

		// Assert
		expect(document.querySelector('[role=dialog] h2')?.textContent).toBe('Lượt đóng băng là gì?');
		expect(target.querySelectorAll('[data-part=scenario]')).toHaveLength(6);
	});
});
