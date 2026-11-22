import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));

const { default: Page } = await import('./+page.svelte');

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('dev skill harness', () => {
	it('Given_Harness_When_Render_Then_ThreeEntriesThreeNotes', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);

		// Act
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();

		// Assert
		const ks = [...target.querySelectorAll('section[data-k]')].map((s) => s.getAttribute('data-k'));
		expect(ks).toEqual(['noi', 'doan', 'thi']);
		expect(target.querySelectorAll('section[data-k] [data-part="demo-note"]')).toHaveLength(3);
	});

	it('Given_Harness_Then_DoanLevelNotes', () => {
		// Arrange
		target = document.createElement('div');
		document.body.append(target);

		// Act
		app = mount(Page, { target }) as Record<string, unknown>;
		flushSync();

		// Assert
		const notes = [
			...target.querySelectorAll('section[data-doan-level] [data-part="demo-note"]')
		].map((n) => n.textContent);
		expect(notes).toEqual([
			'Mở khi bạn tới HSK 3. Bạn đang ở HSK 1.',
			'Mở khi bạn tới HSK 3. Bạn đang ở HSK 2.',
			'Chưa có trong bản demo: cần AI chấm bài viết.'
		]);
		expect(target.querySelectorAll('[data-part="demo-note"]')).toHaveLength(6);
	});
});
