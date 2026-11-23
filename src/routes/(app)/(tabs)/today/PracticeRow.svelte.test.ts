import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import type { TodayView } from '../practice/today';
import PracticeRow from './PracticeRow.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountRow = (view: TodayView | null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(PracticeRow, { target, props: { view } }) as Record<string, unknown>;
	flushSync();
	return {
		title: () => target!.querySelector('[data-part=practice-title]')?.textContent?.trim(),
		kinds: () => target!.querySelector('[data-part=practice-kinds]')?.textContent?.trim(),
		anchors: () => [...target!.querySelectorAll<HTMLAnchorElement>('a')],
		children: () => target!.children.length
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('PracticeRow', () => {
	it('Given_6The4Nghe2Viet_When_Render_Then_TitleKindsAndOneSessionLink', () => {
		// Arrange
		const view: TodayView = {
			chips: [
				{ skill: 'the', n: 6 },
				{ skill: 'nghe', n: 4 },
				{ skill: 'viet', n: 2 }
			],
			minutes: 3
		};

		// Act
		const row = mountRow(view);

		// Assert
		expect(row.title()).toBe('Luyện hôm nay · khoảng 3 phút');
		expect(row.kinds()).toBe('6 thẻ · 4 nghe · 2 viết');
		expect(row.anchors()).toHaveLength(1);
		const href = row.anchors()[0].getAttribute('href')!;
		expect(href).toMatch(/\/practice\/session$/);
		expect(href).not.toContain('?');
	});

	it('Given_NoNghe_When_Render_Then_KindsSkipZero', () => {
		// Arrange
		const view: TodayView = {
			chips: [
				{ skill: 'the', n: 6 },
				{ skill: 'viet', n: 2 }
			],
			minutes: 2
		};

		// Act
		const row = mountRow(view);

		// Assert
		expect(row.kinds()).toBe('6 thẻ · 2 viết');
	});

	it('Given_Null_When_Render_Then_Nothing', () => {
		// Arrange / Act
		const row = mountRow(null);

		// Assert
		expect(row.children()).toBe(0);
	});
});
