import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import WeekStrip from './WeekStrip.svelte';
import type { Mark, WeekView } from './week';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const view = (marks: Mark[], line: string): WeekView => ({
	count: 12,
	freezes: 1,
	cells: marks.map((mark, i) => ({
		day: `2026-11-${16 + i}`,
		label: LABELS[i],
		mark,
		today: i === 4
	})),
	line
});

const mountStrip = (v: WeekView) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(WeekStrip, { target, props: { view: v } }) as Record<string, unknown>;
	flushSync();
	return {
		heading: () => target!.querySelector('h2')?.textContent?.trim(),
		cells: () => [...target!.querySelectorAll('[data-part=week-strip] > li')],
		line: () => target!.querySelector('[data-part=streak-line]')?.textContent?.trim()
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('WeekStrip', () => {
	it('Given_Ac4View_When_Mount_Then_SevenCellsWithMarksAndLine', () => {
		// Arrange
		const line =
			'T4 bạn nghỉ nên app dùng 1 lượt đóng băng. Học xong một phần bài hôm nay là chuỗi lên 13.';
		const v = view(['tick', 'tick', 'freeze', 'tick', 'today', 'later', 'later'], line);

		// Act
		const strip = mountStrip(v);

		// Assert
		expect(strip.heading()).toBe('Tuần này');
		expect(strip.cells().map((c) => c.getAttribute('data-mark'))).toEqual([
			'tick',
			'tick',
			'freeze',
			'tick',
			'today',
			'later',
			'later'
		]);
		expect(strip.cells().map((c) => c.hasAttribute('data-today'))).toEqual([
			false,
			false,
			false,
			false,
			true,
			false,
			false
		]);
		expect(strip.cells()[2].querySelector('use[href="#i-regular-snowflake"]')).not.toBeNull();
		expect(strip.cells()[0].querySelector('use[href="#i-bold-check"]')).not.toBeNull();
		expect(strip.cells()[2].textContent).toContain('T4');
		expect(strip.cells()[2].textContent).toContain('đóng băng');
		expect(strip.line()).toBe(line);
	});

	it('Given_Ac5View_When_Mount_Then_T6TickAndCountedLine', () => {
		// Arrange
		const line = 'Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!';
		const v = view(['tick', 'tick', 'freeze', 'tick', 'tick', 'later', 'later'], line);

		// Act
		const strip = mountStrip(v);

		// Assert
		expect(strip.cells()[4].getAttribute('data-mark')).toBe('tick');
		expect(strip.cells()[4].querySelector('use[href="#i-bold-check"]')).not.toBeNull();
		expect(strip.line()).toBe(line);
	});
});
