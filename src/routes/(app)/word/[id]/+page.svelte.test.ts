import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { PageProps } from './$types';
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

const pageProps = (id: string, word: WordView): PageProps => ({
	params: { id },
	data: {
		session: null,
		shell: { template: 'pushed', section: 'practice' },
		id,
		word,
		report: null
	}
});

const button = (root: HTMLElement): HTMLButtonElement => {
	const el = root.querySelector('button');
	if (!el) throw new Error('no button');
	return el;
};

const mountPage = (props: PageProps) => {
	const root = document.createElement('div');
	document.body.append(root);
	target = root;
	app = mount(Page, { target: root, props });
	flushSync();
	return { root, toggle: () => button(root) };
};

let target: HTMLElement | undefined;
let app: ReturnType<typeof mount> | undefined;

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
});

describe('word page', () => {
	it('Given_DataWordChanges_When_Rerender_Then_ToggleReset', () => {
		// Arrange
		const props = $state(pageProps('好', view('好', 'tốt, khỏe, hay')));
		const { root, toggle } = mountPage(props);
		toggle().click();
		flushSync();
		expect(toggle().textContent?.trim()).toBe('Thu gọn');
		// Act
		props.data = pageProps('你', view('你', 'bạn, anh, chị')).data;
		flushSync();
		// Assert
		expect(toggle().textContent?.trim()).toBe('Xem thêm 1 nghĩa ít gặp');
		expect(root.textContent).toContain('bạn, anh, chị');
	});

	it('Given_HomographIds_When_Navigate_Then_ToggleReset', () => {
		// Arrange
		const props = $state(pageProps('了', view('了', 'rồi, xong')));
		const { toggle } = mountPage(props);
		toggle().click();
		flushSync();
		// Act
		props.data = pageProps('了-liao3', view('了', 'hiểu, xong')).data;
		flushSync();
		// Assert
		expect(toggle().textContent?.trim()).toBe('Xem thêm 1 nghĩa ít gặp');
	});
});
