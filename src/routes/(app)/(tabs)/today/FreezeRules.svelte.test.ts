import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FreezeRules from './FreezeRules.svelte';
import { freezeRules } from './rules';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountRules = (open: boolean, onclose = vi.fn()) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(FreezeRules, {
		target,
		props: { open, view: freezeRules({ count: 12, freezes: 1 }), onclose }
	}) as Record<string, unknown>;
	flushSync();
	return { onclose, dialog: () => document.querySelector('[role=dialog]') };
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	document.body.querySelectorAll('[role=dialog]').forEach((d) => d.remove());
});

describe('FreezeRules', () => {
	it('Given_Open12And1_When_Mount_Then_TitleHaveSlotsAnd4Rules', () => {
		// Act
		const { dialog } = mountRules(true);

		// Assert
		const d = dialog()!;
		expect(d.querySelector('h2')?.textContent).toBe('Lượt đóng băng là gì?');
		expect(d.textContent).toContain('Bạn đang có 1/2 lượt');
		expect(d.querySelectorAll('[data-part=freeze-slot]')).toHaveLength(2);
		expect(d.querySelectorAll('[data-part=freeze-slot][data-held]')).toHaveLength(1);
		expect(d.querySelectorAll('[data-part=freeze-rule]')).toHaveLength(4);
	});

	it('Given_Open_When_ClickHieuRoi_Then_OncloseOnce', () => {
		// Arrange
		const { dialog, onclose } = mountRules(true);
		const ok = [...dialog()!.querySelectorAll('button')].find(
			(b) => b.textContent?.trim() === 'Hiểu rồi'
		)!;

		// Act
		ok.click();

		// Assert
		expect(onclose).toHaveBeenCalledTimes(1);
	});

	it('Given_Closed_When_Mount_Then_NoDialog', () => {
		// Act
		const { dialog } = mountRules(false);

		// Assert
		expect(dialog()).toBeNull();
	});
});
