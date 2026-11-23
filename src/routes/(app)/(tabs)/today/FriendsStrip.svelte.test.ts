import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import FriendsStrip, { type Friend } from './FriendsStrip.svelte';

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const three: Friend[] = [
	{ id: 'a', name: 'Minh', streak: 30, lesson: 14 },
	{ id: 'b', name: 'Lan', streak: 4, lesson: 6 },
	{ id: 'c', name: 'Huy', streak: 9, lesson: 9 }
];

const mountStrip = (friends: Friend[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(FriendsStrip, { target, props: { friends } }) as Record<string, unknown>;
	flushSync();
	return {
		section: () => target!.querySelectorAll('[data-part=friends]').length,
		items: () => [...target!.querySelectorAll<HTMLElement>('[data-part=friend]')],
		texts: () =>
			[...target!.querySelectorAll<HTMLElement>('[data-part=friend]')].map((f) =>
				f.textContent!.replace(/\s+/g, ' ').trim()
			)
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('FriendsStrip', () => {
	it('Given_ThreeFriends_When_Render_Then_NameDaysLesson', () => {
		// Arrange / Act
		const strip = mountStrip(three);

		// Assert
		expect(strip.items()).toHaveLength(3);
		expect(strip.texts()).toEqual([
			'M Minh 30 ngày Bài 14',
			'L Lan 4 ngày Bài 6',
			'H Huy 9 ngày Bài 9'
		]);
	});

	it('Given_FourFriends_When_Render_Then_OnlyThree', () => {
		// Arrange
		const four = [...three, { id: 'd', name: 'Mai', streak: 2, lesson: 3 }];

		// Act
		const strip = mountStrip(four);

		// Assert
		expect(strip.items()).toHaveLength(3);
		expect(strip.texts().join('|')).not.toContain('Mai');
	});

	it('Given_NoFriends_When_Render_Then_NoSection', () => {
		// Arrange / Act
		const strip = mountStrip([]);

		// Assert
		expect(strip.section()).toBe(0);
	});
});
