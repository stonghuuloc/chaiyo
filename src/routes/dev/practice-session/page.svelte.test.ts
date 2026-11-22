import 'fake-indexeddb/auto';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/practice-session')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(async () => true),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));
vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../test/FakeVietStrokes.svelte')
);

const { default: Page } = await import('./+page.svelte');

const hanzi = [
	'你',
	'好',
	'您',
	'你们',
	'你好',
	'对不起',
	'没关系',
	'谢谢',
	'再见',
	'不客气',
	'老师',
	'同学'
];
const content = {
	contentSha: 'sha-1',
	words: hanzi.map((h, i) => ({
		id: `w${i}`,
		hanzi: h,
		pinyin: `py${i}`,
		senses: [{ vi: `nghĩa ${i}` }],
		audio: `words/${i}`
	}))
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	hoisted.lesson.mockReset();
	hoisted.lesson.mockResolvedValue(content);
	hoisted.url.search = '';
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

const render = () => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target }) as Record<string, unknown>;
	flushSync();
};

const item = () => target!.querySelector<HTMLElement>('[data-part="item"]');
const rows = () => [...target!.querySelectorAll('[data-part="attempts"] tbody tr')];

const answerNghe = async (hit: boolean) => {
	const el = await vi.waitFor(() => {
		const found = item();
		if (!found) throw new Error('no item');
		return found;
	});
	const id = el.dataset.id;
	const word = id!.split(':')[2].replace('#again', '');
	const options = [...el.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')];
	options.find((b) => (b.firstElementChild?.textContent?.trim() === word) === hit)!.click();
	flushSync();
	target!.querySelector<HTMLButtonElement>('[data-part="cta"] button')!.click();
	flushSync();
	await vi.waitFor(() => expect(item()?.dataset.id).not.toBe(id));
};

describe('dev practice-session harness', () => {
	it('Given_SkillNghe_When_Open_Then_FirstItemIsNghe', async () => {
		// Arrange
		hoisted.url.search = '?skill=nghe';

		// Act
		render();
		await vi.waitFor(() => expect(item()).not.toBeNull());

		// Assert
		expect(item()!.dataset.kind).toBe('nghe');
		expect(target!.querySelector('[data-part="session-run"]')!.getAttribute('data-of')).toBe('4');
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
	});

	it('Given_Harness_When_AllAnswered_Then_DoneScreenAndReadout', async () => {
		// Arrange
		hoisted.url.search = '?skill=nghe';
		render();
		await vi.waitFor(() => expect(item()).not.toBeNull());

		// Act
		await answerNghe(false);
		for (let i = 0; i < 4; i++) await answerNghe(true);

		// Assert
		expect(target!.querySelector('[data-part="done"]')).not.toBeNull();
		const table = rows().map((r) => r.textContent);
		expect(table).toHaveLength(5);
		expect(table[0]).toContain('false4');
		expect(table[4]).toContain('#againtrue4');
	});
});
