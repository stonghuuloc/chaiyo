import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { WordView } from './word-view';
import Page from './+page.svelte';

const view = (hanzi: string, vi: string): WordView => ({
	hanzi,
	pinyin: 'hǎo',
	groups: [
		{
			pos: 'adj',
			senses: [
				{ vi, rare: false, example: null },
				{ vi: 'thân, thân thiết (hai người)', rare: true, example: null }
			]
		}
	],
	rare: 1
});

let target: HTMLElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('word page', () => {
	it('Given_DataWordChanges_When_Rerender_Then_ToggleReset', () => {
		// Arrange
		const props = $state({ data: { id: '好', word: view('好', 'tốt, khỏe, hay') } });
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target, props: props as never }) as Record<string, unknown>;
		flushSync();
		const toggle = () => target!.querySelector('button')!;
		toggle().click();
		flushSync();
		expect(toggle().textContent?.trim()).toBe('Thu gọn');
		// Act
		props.data = { id: '你', word: view('你', 'bạn, anh, chị') };
		flushSync();
		// Assert
		expect(toggle().textContent?.trim()).toBe('Xem thêm 1 nghĩa ít gặp');
		expect(target.textContent).toContain('bạn, anh, chị');
	});

	it('Given_HomographIds_When_Navigate_Then_ToggleReset', () => {
		// Arrange
		const props = $state({ data: { id: '了', word: view('了', 'rồi, xong') } });
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Page, { target, props: props as never }) as Record<string, unknown>;
		flushSync();
		const toggle = () => target!.querySelector('button')!;
		toggle().click();
		flushSync();
		// Act
		props.data = { id: '了-liao3', word: view('了', 'hiểu, xong') };
		flushSync();
		// Assert
		expect(toggle().textContent?.trim()).toBe('Xem thêm 1 nghĩa ít gặp');
	});
});
