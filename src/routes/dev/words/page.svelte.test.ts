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
	listedIn: ['h1-01'],
	audio: `word/${id}`
});

const ids = ['你', '好', '您', '你们', '你好', '对不起', '没关系', '谢谢', '不客气', '再见'];

const content = {
	contentSha: 'sha-1',
	lesson: { id: 'h1-01', sections: { words: { ids } } },
	words: ids.map(word),
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
	it('Given_Bai1_When_WalkCardsAndChecks_Then_DoneAndEveryWordInLexicon', async () => {
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

		// Act
		for (let n = 1; n <= 14; n++) {
			await vi.waitFor(() => expect(counter()).toBe(`${n}/14`));
			if (button(m.words_next())) await press(m.words_next());
			else {
				target!.querySelector<HTMLButtonElement>('.body button[aria-pressed]')!.click();
				flushSync();
				await press(m.lesson_check());
				await press(m.lesson_continue());
			}
		}

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="done-text"]')?.textContent).toBe(
				m.words_done_text({ n: 10 })
			)
		);
		expect(target!.querySelector('[data-part="lexicon"]')!.textContent).toContain(ids.join(' '));
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
