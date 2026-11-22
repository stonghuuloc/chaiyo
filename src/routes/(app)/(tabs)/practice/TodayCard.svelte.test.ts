import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import TodayCard from './TodayCard.svelte';
import type { TodayView } from './today';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountCard = (view: TodayView | null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(TodayCard, { target, props: { view } }) as Record<string, unknown>;
	flushSync();
	return {
		title: () => target!.querySelector('[data-part=today-title]')?.textContent?.trim(),
		chips: () =>
			[...target!.querySelectorAll('[data-part=today-chip]')].map((c) => c.textContent?.trim()),
		anchors: () => [...target!.querySelectorAll<HTMLAnchorElement>('a')],
		red: () => target!.querySelectorAll('.bg-lantern-red'),
		text: () => target!.textContent
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('TodayCard', () => {
	it('Given_MixView_When_Mount_Then_TitleChipsAndOneStartAnchor', () => {
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
		const card = mountCard(view);

		// Assert
		expect(card.title()).toBe('Luyện hôm nay · khoảng 3 phút');
		expect(card.chips()).toEqual(['6 thẻ từ', '4 nghe', '2 viết chữ']);
		expect(card.anchors()).toHaveLength(1);
		expect(card.anchors()[0].getAttribute('href')).toMatch(/\/practice\/session$/);
		expect(card.red()).toHaveLength(1);
	});

	it('Given_NullView_When_Mount_Then_ClearCopyNoStartNoChip', () => {
		// Arrange / Act
		const card = mountCard(null);

		// Assert
		expect(card.text()).toContain('Hôm nay xong bài rồi!');
		expect(card.text()).toContain('Chưa có từ nào sắp quên.');
		expect(card.anchors()).toHaveLength(0);
		expect(card.chips()).toHaveLength(0);
	});

	it('Given_ViewWithoutNghe_When_Mount_Then_TwoChips', () => {
		// Arrange
		const view: TodayView = {
			chips: [
				{ skill: 'the', n: 5 },
				{ skill: 'viet', n: 2 }
			],
			minutes: 2
		};

		// Act
		const card = mountCard(view);

		// Assert
		expect(card.chips()).toEqual(['5 thẻ từ', '2 viết chữ']);
	});
});
