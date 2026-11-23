import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import MeProfile from './MeProfile.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (photo: string | null = null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(MeProfile, {
		target,
		props: { name: 'Tống Lộc', photo, month: 10, year: 2026 }
	}) as Record<string, unknown>;
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('MeProfile', () => {
	it('Given_Name_When_Render_Then_H1AndJoined', () => {
		// Arrange / Act
		const view = render();

		// Assert
		expect(view.querySelector('h1')!.textContent?.trim()).toBe('Tống Lộc');
		expect(view.querySelector('h1 + p')!.textContent?.trim()).toBe('Học từ tháng 10/2026');
	});

	it('Given_NoPhoto_When_Render_Then_InitialsTL', () => {
		// Arrange / Act
		const view = render();

		// Assert
		expect(view.querySelector('span[aria-hidden=true]')!.textContent?.trim()).toBe('TL');
		expect(view.querySelector('img')).toBeNull();
	});

	it('Given_Photo_When_Render_Then_Img', () => {
		// Arrange / Act
		const view = render('https://example.com/a.png');

		// Assert
		const img = view.querySelector('img')!;
		expect(img.getAttribute('src')).toBe('https://example.com/a.png');
		expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
		expect(view.querySelector('span[aria-hidden=true]')).toBeNull();
	});

	it('Given_Row_When_Render_Then_EditLinkToSettings', () => {
		// Arrange / Act
		const view = render();

		// Assert
		const a = view.querySelector('a')!;
		expect(a.getAttribute('href')).toMatch(/\/settings$/);
		expect(a.getAttribute('aria-label')).toBe('Sửa hồ sơ');
	});
});
