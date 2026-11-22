import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/pills')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	player: { playToEnd: vi.fn(async () => true), pause: vi.fn() },
	play: vi.fn()
}));

const { default: Page } = await import('./+page.svelte');

const KEY = 'chaiyo-prefs-dev';

const content = (id: string, level: number) => ({
	contentSha: 'sha-1',
	lesson: {
		id,
		level,
		sections: {
			grammar: { ids: ['g1'], drills: [] },
			dialogue: { parts: [{ title: 'Gặp nhau', lines: ['s1', 's2'] }], questions: [] }
		}
	},
	words: [],
	chars: [],
	sentences: [
		{ id: 's1', hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Chào bạn!', speaker: 'redpanda', seg: [] },
		{ id: 's2', hanzi: '您好！', pinyin: 'nín hǎo', vi: 'Chào thầy!', speaker: 'takin', seg: [] }
	],
	grammar: [
		{
			id: 'g1',
			level,
			std: [],
			title: 'Chào hỏi: A + 好',
			pattern: '你 + 好',
			labels: ['người được chào', 'luôn có'],
			explain: 'Thêm 好.',
			examples: ['s2']
		}
	],
	questions: [],
	gateCoverage: {},
	thin: []
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
	hoisted.url.search = '';
	localStorage.clear();
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	vi.unstubAllGlobals();
});

const render = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
};

const pill = (k: string) =>
	target!.querySelector<HTMLButtonElement>(`[data-part="pill"][data-pill="${k}"]`);
const count = (part: string) => target!.querySelectorAll(`[data-part="${part}"]`).length;
const tab = (name: string) =>
	target!.querySelector<HTMLButtonElement>(`[data-part="tab"][data-tab="${name}"]`)!;

describe('dev pills harness', () => {
	it('Given_H3_When_Mount_Then_PinyinOff', async () => {
		// Arrange
		hoisted.url.search = '?lesson=h3-01';
		hoisted.lesson.mockImplementation(async (id: string) => content(id, 3));

		// Act
		render();

		// Assert
		await vi.waitFor(() => expect(pill('pinyin')?.getAttribute('aria-pressed')).toBe('false'));
		expect(hoisted.lesson).toHaveBeenCalledWith('h3-01');
		expect(count('line-pinyin')).toBe(0);
		expect(count('line-hanzi')).toBe(2);
	});

	it('Given_ToggleMeaning_When_SwitchTab_Then_StillOff', async () => {
		// Arrange
		hoisted.lesson.mockImplementation(async (id: string) => content(id, 1));
		render();
		await vi.waitFor(() => expect(pill('meaning')).not.toBeNull());

		// Act
		pill('meaning')!.click();
		flushSync();
		tab('grammar').click();
		flushSync();

		// Assert
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
		await vi.waitFor(() => expect(count('example-pinyin')).toBe(1));
		expect(pill('meaning')!.getAttribute('aria-pressed')).toBe('false');
		expect(count('example-vi')).toBe(0);
		expect(JSON.parse(target!.querySelector('[data-part="prefs"]')!.textContent!)).toEqual({
			pinyin: null,
			meaning: false,
			unsent: ['meaning']
		});
	});

	it('Given_Reset_When_Mount_Then_StorageCleared', async () => {
		// Arrange
		hoisted.url.search = '?reset';
		localStorage.setItem(KEY, JSON.stringify({ pinyin: false, meaning: false }));
		const replace = vi.fn();
		vi.stubGlobal('location', { pathname: '/dev/pills', replace });

		// Act
		render();

		// Assert
		await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/dev/pills'));
		expect(localStorage.getItem(KEY)).toBeNull();
		expect(hoisted.lesson).not.toHaveBeenCalled();
	});
});
