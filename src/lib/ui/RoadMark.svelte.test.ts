import { flushSync, mount, unmount } from 'svelte';
import type { RoadStatus } from '#lib/study/index.js';
import { afterEach, describe, expect, it } from 'vitest';
import RoadMark from './RoadMark.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const render = (props: { status: RoadStatus; size?: 'sm' | 'lg' }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(RoadMark, { target, props }) as Record<string, unknown>;
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('RoadMark', () => {
	it.each([
		['done', '#i-bold-check', false],
		['now', null, true],
		['open', null, true],
		['locked', '#i-fill-lock-simple', false]
	] as const)('Given_Status_When_Render_Then_LockCheckOrDot (%s)', (status, icon, dot) => {
		// Arrange / Act
		const root = render({ status });

		// Assert
		const mark = root.querySelector('[data-part=road-mark]')!;
		expect(mark.getAttribute('data-status')).toBe(status);
		expect(mark.classList.contains('size-7')).toBe(true);
		expect(mark.querySelector('use')?.getAttribute('href') ?? null).toBe(icon);
		expect(mark.querySelector('i') !== null).toBe(dot);
	});

	it('Given_LargeSize_When_Render_Then_36pxMark', () => {
		// Arrange / Act
		const root = render({ status: 'now', size: 'lg' });

		// Assert
		const mark = root.querySelector('[data-part=road-mark]')!;
		expect(mark.classList.contains('size-9')).toBe(true);
		expect(mark.classList.contains('size-7')).toBe(false);
	});
});
