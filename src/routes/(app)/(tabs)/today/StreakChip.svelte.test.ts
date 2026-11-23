import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import StreakChip from './StreakChip.svelte';
import type { WeekView } from './week';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountChip = (view: Pick<WeekView, 'count' | 'freezes'>) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(StreakChip, { target, props: { view: view as WeekView } }) as Record<string, unknown>;
	flushSync();
	return target.querySelector('[data-part=streak-chip]');
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('StreakChip', () => {
	it('Given_Chip12And1_When_Mount_Then_TextAndAccessibleName', () => {
		// Act
		const chip = mountChip({ count: 12, freezes: 1 });

		// Assert
		expect(chip?.getAttribute('role')).toBe('img');
		expect(chip?.getAttribute('aria-label')).toBe('Chuỗi 12 ngày, còn 1 lượt đóng băng');
		expect(chip?.textContent).toContain('12 ngày');
		expect(chip?.lastElementChild?.textContent).toBe('1');
		expect(chip?.querySelector('use[href="#i-fill-fire"]')).not.toBeNull();
		expect(chip?.querySelector('use[href="#i-regular-snowflake"]')).not.toBeNull();
	});
});
