import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import Done from './Done.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountDone = (text?: string) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Done, {
		target,
		props: {
			title: 'Xong phần Ngữ pháp',
			text,
			next: { label: 'Phần tiếp theo', href: '/lesson/h1-01/dialogue' }
		}
	}) as Record<string, unknown>;
	flushSync();
	return (part: string) => target!.querySelector(`[data-part="${part}"]`);
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('Done', () => {
	it('Given_TitleTextNext_When_Mount_Then_TitleTextAndNextLink', () => {
		// Arrange / Act
		const part = mountDone('Mẫu A + 好 đã vào phần ôn tập.');

		// Assert
		expect(part('done-title')!.textContent).toBe('Xong phần Ngữ pháp');
		expect(part('done-text')!.textContent).toBe('Mẫu A + 好 đã vào phần ôn tập.');
		const link = part('done-next')!.querySelector('a')!;
		expect(link.getAttribute('href')).toBe('/lesson/h1-01/dialogue');
		expect(link.textContent).toContain('Phần tiếp theo');
	});

	it('Given_NoText_When_Mount_Then_NoTextLine', () => {
		// Arrange / Act
		const part = mountDone();

		// Assert
		expect(part('done-text')).toBeNull();
	});
});
