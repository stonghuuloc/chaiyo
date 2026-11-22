import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

const page = vi.hoisted(() => ({
	status: 503,
	error: { message: 'offline' } as { message: string } | null
}));
vi.mock('$app/state', () => ({ page }));
vi.mock('$app/paths', () => ({ resolve: (id: string) => id }));

const { default: ErrorPage } = await import('./+error.svelte');

let app: ReturnType<typeof mount> | undefined;
afterEach(() => {
	if (app) unmount(app);
	app = undefined;
	document.body.innerHTML = '';
});

describe('lesson error page', () => {
	it('Given_503_When_Render_Then_CanMangCopyAndTodayLink', () => {
		// Arrange
		page.status = 503;
		page.error = { message: 'offline' };

		// Act
		app = mount(ErrorPage, { target: document.body });
		flushSync();

		// Assert
		const box = document.querySelector('[data-part="lesson-offline"]');
		expect(box?.querySelector('h1')?.textContent).toBe('Bài này cần mạng.');
		expect(box?.textContent).toContain('Kết nối mạng rồi mở lại bài.');
		const link = box?.querySelector('a');
		expect(link?.textContent).toBe('Về Hôm nay');
		expect(link?.getAttribute('href')).toBe('/(app)/(tabs)/today');
	});

	it('Given_500_When_Render_Then_NoOfflineCopy_ErrorShown', () => {
		// Arrange
		page.status = 500;
		page.error = { message: 'boom' };

		// Act
		app = mount(ErrorPage, { target: document.body });
		flushSync();

		// Assert
		expect(document.querySelector('[data-part="lesson-offline"]')).toBeNull();
		expect(document.body.textContent).toContain('500');
		expect(document.body.textContent).toContain('boom');
	});
});
