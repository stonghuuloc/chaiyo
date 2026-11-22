import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/paraglide/messages.js';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/listen')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const { default: Page } = await import('./+page.svelte');

const content = {
	contentSha: 'sha-1',
	lesson: {
		id: 'h1-01',
		sections: {
			listenSpeak: {
				items: [
					{
						id: 'q-h1-01-l02',
						type: 'choice',
						tests: {},
						prompt: { kind: 'audio', ref: '你好' },
						optionKind: 'hanzi',
						options: ['你好', '你们'],
						answer: 0
					}
				]
			}
		}
	},
	words: [],
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

describe('dev listen harness', () => {
	it('Given_Bai1_When_AnswerChoice_Then_AttemptListedWithStepPickAndCorrect', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content);
		render();
		const option = await vi.waitFor(() => {
			const b = [...target!.querySelectorAll('button')].find(
				(x) => x.textContent?.trim() === '你好'
			);
			if (!b) throw new Error('no option');
			return b;
		});

		// Act
		option.click();
		flushSync();
		const cta = () =>
			[...target!.querySelectorAll('button')].find((b) =>
				[m.lesson_check(), m.lesson_continue()].some((l) => l === b.textContent!.trim())
			)!;
		cta().click();
		flushSync();
		cta().click();

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="attempts"] tbody')!.textContent).toContain(
				'q-h1-01-l02你好true'
			)
		);
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
