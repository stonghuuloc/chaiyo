import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hoisted = vi.hoisted(() => ({
	lesson: vi.fn(),
	url: new URL('http://localhost/dev/dialogue')
}));
vi.mock('$app/state', () => ({ page: { url: hoisted.url } }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));
vi.mock('#lib/catalog/app.js', () => ({ catalog: { lesson: hoisted.lesson } }));
vi.mock('#lib/audio/index.js', () => ({
	player: { playToEnd: vi.fn(async () => true), pause: vi.fn() }
}));

const { default: Page } = await import('./+page.svelte');

const content = {
	contentSha: 'sha-1',
	lesson: {
		id: 'h1-01',
		sections: {
			dialogue: { parts: [{ title: 'Gặp nhau', lines: ['s1'] }], questions: [] }
		}
	},
	words: [],
	chars: [],
	sentences: [
		{ id: 's1', hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Chào bạn!', speaker: 'redpanda', seg: [] }
	],
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

describe('dev dialogue harness', () => {
	it('Given_Bai1_When_PlayPartAndContinue_Then_NoAnswerAttemptListed', async () => {
		// Arrange
		hoisted.lesson.mockResolvedValue(content);
		render();
		const cta = () =>
			[...target!.querySelectorAll<HTMLButtonElement>('.actions button')].at(0) ?? null;
		await vi.waitFor(() => {
			if (cta()?.textContent?.trim() !== 'Nghe đoạn hội thoại') throw new Error('not ready');
		});

		// Act
		cta()!.click();
		await vi.waitFor(() => {
			if (cta()?.textContent?.trim() !== 'Trả lời câu hỏi') throw new Error('not played');
		});
		cta()!.click();

		// Assert
		await vi.waitFor(() =>
			expect(target!.querySelector('[data-part="attempts"] tbody')!.textContent).toContain(
				'dlg-h1-01-1–null'
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
