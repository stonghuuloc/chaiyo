import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import MeHero from './MeHero.svelte';
import type { MeStats } from './me';

const stats = (o: Partial<Pick<MeStats, 'lessons' | 'words'>> = {}): MeStats => ({
	level: 1,
	lessons: o.lessons ?? { have: 0, need: 40 },
	words: o.words ?? { have: 12, need: 300 },
	streak: { count: 12, freezes: 1, best: 12 },
	skills: []
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (s: MeStats) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(MeHero, { target, props: { stats: s } }) as Record<string, unknown>;
	flushSync();
	const rows = () => [...target!.querySelectorAll('[data-part=me-prog] > div')];
	return {
		rowTexts: () =>
			rows().map((r) => [r.children[0], r.children[1]].map((e) => e.textContent?.trim())),
		fills: () => rows().map((r) => r.querySelector<HTMLElement>('i')!.style.width),
		streak: () => target!.querySelector('[data-part=me-streak]')!,
		streakTexts: () =>
			[...target!.querySelectorAll('[data-part=me-streak] > span')].map((e) =>
				e.textContent?.replace(/\s+/g, ' ').trim()
			)
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('MeHero', () => {
	it('Given_Stats_When_Render_Then_RowTextsAndValues', () => {
		// Arrange
		const s = stats();

		// Act
		const view = render(s);

		// Assert
		expect(view.rowTexts()).toEqual([
			['Bài học', '0/40'],
			['Từ vựng', '12/300']
		]);
	});

	it('Given_420of300_When_Render_Then_FillWidth100', () => {
		// Arrange
		const s = stats({ words: { have: 420, need: 300 } });

		// Act
		const view = render(s);

		// Assert
		expect(view.rowTexts()[1]).toEqual(['Từ vựng', '420/300']);
		expect(view.fills()[1]).toBe('100%');
	});

	it('Given_0of40_When_Render_Then_FillWidth0', () => {
		// Arrange
		const s = stats();

		// Act
		const view = render(s);

		// Assert
		expect(view.fills()[0]).toBe('0%');
		expect(view.fills()[1]).toBe('4%');
	});

	it('Given_Stats_When_Render_Then_StreakTextsAndIcons', () => {
		// Arrange
		const s = stats();

		// Act
		const view = render(s);

		// Assert
		expect(view.streakTexts()).toEqual(['12 ngày liền', 'Còn 1 lượt đóng băng', 'Kỷ lục 12 ngày']);
		expect(view.streak().querySelector('use[href="#i-fill-fire"]')).not.toBeNull();
		expect(view.streak().querySelector('use[href="#i-fill-snowflake"]')).not.toBeNull();
	});
});
