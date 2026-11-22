import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Pills from './Pills.svelte';
import { DisplayPrefs } from './prefs.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('Pills', () => {
	it('Given_Prefs_When_ClickMeaning_Then_AriaPressedFalseAndToggleCalled', () => {
		// Arrange
		const prefs = new DisplayPrefs({ level: 1, key: 'k' });
		const toggle = vi.spyOn(prefs, 'toggle');
		target = document.createElement('div');
		document.body.append(target);
		app = mount(Pills, { target, props: { prefs } }) as Record<string, unknown>;
		const pill = (k: string) =>
			target!.querySelector<HTMLButtonElement>(`[data-part="pill"][data-pill="${k}"]`)!;
		const before = [pill('pinyin').ariaPressed, pill('meaning').ariaPressed];

		// Act
		pill('meaning').click();
		flushSync();

		// Assert
		expect(before).toEqual(['true', 'true']);
		expect(pill('meaning').getAttribute('aria-pressed')).toBe('false');
		expect(pill('pinyin').getAttribute('aria-pressed')).toBe('true');
		expect(toggle).toHaveBeenCalledWith('meaning');
		expect([pill('pinyin').textContent!.trim(), pill('meaning').textContent!.trim()]).toEqual([
			'Pinyin',
			'Nghĩa'
		]);
		expect(target.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Hiển thị');
	});
});
