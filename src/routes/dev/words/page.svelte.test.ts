import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/words')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../../test/FakeStrokes.svelte'));
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const { default: Page } = await import('./+page.svelte');

const word = (id: string) => ({
	id,
	hanzi: id,
	pinyin: `p-${id}`,
	level: 1,
	pos: ['n'],
	senses: [{ vi: `vi-${id}` }],
	examples: [],
	listedIn: ['h1-01']
});

const content = {
	contentSha: 'sha-1',
	lesson: { id: 'h1-01', sections: { words: { ids: ['你'] } } },
	words: [word('你')],
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

describe('dev words harness', () => {
	it('Given_Bai1_When_FinishCard_Then_DoneAndWordInLexicon', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content);
		render();
		const cta = await vi.waitFor(() => {
			const b = [...target!.querySelectorAll('button')].find(
				(x) => x.textContent?.trim() === m.words_next()
			);
			if (!b) throw new Error('no cta');
			return b;
		});

		// Act
		cta.click();

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="done-text"]')?.textContent).toBe(
				m.words_done_text({ n: 1 })
			)
		);
		expect(target!.querySelector('[data-part="lexicon"]')!.textContent).toContain('你');
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
