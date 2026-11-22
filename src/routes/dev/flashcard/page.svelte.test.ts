import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/audio/index.js', () => ({ play: vi.fn(async () => true) }));

const { default: Page } = await import('./+page.svelte');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

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

const part = (name: string) => target!.querySelector<HTMLElement>(`[data-part="${name}"]`);
const logs = () => [...target!.querySelectorAll('[data-part="log"] li')].map((x) => x.textContent);

const decideCurrent = async (before: number) => {
	part('flip')!.click();
	flushSync();
	part('remember')!.click();
	flushSync();
	await vi.waitFor(() => expect(logs()).toHaveLength(before + 1));
};

describe('dev flashcard harness', () => {
	it('Given_Mount_When_Render_Then_FirstCardFront', () => {
		// Arrange
		// Act
		render();

		// Assert
		expect(target!.textContent).toContain('学生');
		expect(part('speaker')).not.toBeNull();
		expect(logs()).toEqual([]);
	});

	it('Given_FirstCard_When_Decide_Then_LogsAndAdvances', async () => {
		// Arrange
		render();

		// Act
		await decideCurrent(0);

		// Assert
		expect(logs()[0]).toMatch(/^学生 · Nhớ · \d+ ms$/);
		expect(target!.textContent).toContain('你好');
		expect(part('speaker')).toBeNull();
	});

	it('Given_LastCard_When_Decide_Then_EndShownAndResetRestores', async () => {
		// Arrange
		render();

		// Act
		await decideCurrent(0);
		await decideCurrent(1);
		await decideCurrent(2);

		// Assert
		expect(part('end')?.textContent).toContain('Hết thẻ');
		part('reset')!.click();
		flushSync();
		expect(target!.textContent).toContain('学生');
		expect(logs()).toEqual([]);
	});
});
