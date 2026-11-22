import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/warmup')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const { default: Page } = await import('./+page.svelte');

const ids = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'];
const pinyin = [
	'nǐ',
	'hǎo',
	'nín',
	'nǐmen',
	'nǐ hǎo',
	'duìbuqǐ',
	'méi guānxi',
	'xièxie',
	'bú kèqi',
	'zàijiàn'
];

const content = {
	contentSha: 'sha-1',
	lesson: { id: 'h1-01', order: 1, sections: { words: { ids } } },
	words: ids.map((id, i) => ({
		id,
		hanzi: id,
		pinyin: pinyin[i],
		level: 1,
		pos: ['n'],
		senses: [{ vi: `vi-${id}` }],
		examples: [],
		listedIn: ['h1-01'],
		audio: `word/${id}`
	})),
	chars: [],
	sentences: [],
	grammar: [],
	questions: [],
	gateCoverage: {},
	thin: []
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

beforeEach(() => {
	vi.stubGlobal('indexedDB', new IDBFactory());
	hoisted.lesson.mockReset();
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

describe('dev warmup harness', () => {
	it('Given_Seeded_When_WalkSixCards_Then_DoneWithScoreAndDueDates', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content);
		render();
		const button = (label: string) =>
			[...target!.querySelectorAll('button')].find((x) => x.textContent?.trim() === label);
		const press = async (label: string) => {
			const b = await vi.waitFor(() => {
				const x = button(label);
				if (!x || x.disabled) throw new Error(`no ${label}`);
				return x;
			});
			b.click();
			flushSync();
		};
		const counter = () => target!.querySelector('.tabular-nums')?.textContent?.trim();
		const seed = await vi.waitFor(() => {
			const x = target!.querySelector<HTMLButtonElement>('[data-part="seed"]');
			if (!x) throw new Error('no seed');
			return x;
		});

		// Act
		seed.click();
		for (let n = 1; n <= 6; n++) {
			await vi.waitFor(() => expect(counter()).toBe(`${n}/6`));
			target!.querySelector<HTMLButtonElement>('.body button[aria-pressed]')!.click();
			flushSync();
			await press(m.lesson_check());
			await press(m.lesson_continue());
		}

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="done-title"]')?.textContent).toBe(
				'Xong phần Khởi động'
			)
		);
		expect(target!.querySelector('[data-part="done-text"]')?.textContent).toMatch(/^\d\/6 đúng/);
		expect(target!.querySelectorAll('[data-part="lexicon"] li')).toHaveLength(10);
		expect(hoisted.lesson).toHaveBeenCalledWith('h1-01');
	});

	it('Given_CatalogFails_When_Mount_Then_ShowsFailure', async () => {
		// Arrange
		hoisted.lesson.mockRejectedValue(new Error('offline'));

		// Act
		render();

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="failure"]')!.textContent).toContain('offline')
		);
	});
});
