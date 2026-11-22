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
		expect(target.querySelectorAll('[data-part="demo-note"]')).toHaveLength(3);
	});
});
