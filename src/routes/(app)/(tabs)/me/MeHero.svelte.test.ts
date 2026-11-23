import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import MeHero from './MeHero.svelte';
import type { MeLevel } from './level';
import type { MeStats } from './me';

const stats = (o: Partial<Pick<MeStats, 'lessons' | 'words'>> = {}): MeStats => ({
	level: 1,
	lessons: o.lessons ?? { have: 0, need: 40 },
	words: o.words ?? { have: 12, need: 300 },
	streak: { count: 12, freezes: 1, best: 12 },
	skills: []
});

const lv = (o: Partial<MeLevel> = {}): MeLevel => ({
	level: 1,
	pct: 0,
	cur: 1,
	band: 1,
	last: 40,
	next: 2,
	...o
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (s: MeStats, l: MeLevel = lv()) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(MeHero, { target, props: { stats: s, lv: l } }) as Record<string, unknown>;
	flushSync();
	const text = (part: string) =>
		target!.querySelector(`[data-part=${part}]`)?.textContent?.replace(/\s+/g, ' ').trim();
	const rows = () => [...target!.querySelectorAll('[data-part=me-prog] > div')];
	return {
		text,
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

	it('Given_Hsk1Pct0_When_Render_Then_SealKickerTitle', () => {
		// Arrange
		const l = lv();

		// Act
		const view = render(stats(), l);

		// Assert
		const level = target!.querySelector('[data-part=me-level]')!;
		const seal = level.firstElementChild!;
		expect(seal.querySelector('small')!.textContent).toBe('HSK');
		expect(seal.querySelector('b')!.textContent).toBe('1');
		expect(level.querySelector('p')!.textContent).toBe('Cấp đang học');
		expect(level.querySelector('h2')!.textContent).toBe('HSK 1 · 0%');
		expect(view.text('me-level')).toContain('HSK 1 · 0%');
	});

	it.each([
		[1, 1, 'Vừa vào cấp, đang học Bài 1. Khởi đầu ngon rồi đó!'],
		[2, 11, 'Đang học Bài 11. Đi được một đoạn rồi, cứ đều đều nhé.'],
		[3, 31, 'Đang học Bài 31. Gần tới đích rồi!'],
		[4, null, 'Học xong cả cấp, giờ chỉ còn thi thử thôi!']
	] as const)('Given_Band%i_When_Render_Then_LineText', (band, cur, line) => {
		// Arrange
		const l = lv({ band, cur });

		// Act
		const view = render(stats(), l);

		// Assert
		expect(view.text('me-line')).toBe(line);
	});

	it('Given_Hsk1_When_Render_Then_GoalText', () => {
		// Arrange
		const l = lv();

		// Act
		const view = render(stats(), l);

		// Assert
		expect(view.text('me-goal')).toBe('Mốc tiếp theo: Thi thử HSK 1 sau Bài 40, đỗ là mở HSK 2.');
		expect(target!.querySelector('[data-part=me-goal] b')!.textContent).toBe('Thi thử HSK 1');
		expect(target!.querySelector('[data-part=me-goal] use[href="#i-fill-diploma"]')).not.toBeNull();
	});

	it('Given_Hsk5_When_Render_Then_GoalCertText', () => {
		// Arrange
		const l = lv({ level: 5, last: 136, next: null });

		// Act
		const view = render(stats(), l);

		// Assert
		expect(view.text('me-goal')).toBe(
			'Mốc tiếp theo: Thi thử HSK 5 sau Bài 136, đỗ là mở chứng chỉ.'
		);
	});

	it('Given_Hero_When_Render_Then_OrderLevelProgGoalStreak', () => {
		// Arrange / Act
		render(stats());

		// Assert
		const parts = [...target!.querySelector('[data-part=me-hero]')!.children].map((e) =>
			e.getAttribute('data-part')
		);
		expect(parts).toEqual(['me-level', 'me-prog', 'me-goal', 'me-streak']);
	});

	it('Given_Hero_When_Render_Then_SealHasNoShadowClass', () => {
		// Arrange / Act
		render(stats());

		// Assert
		const seal = target!.querySelector('[data-part=me-level]')!.firstElementChild!;
		expect(seal.className).not.toMatch(/shadow/);
	});
});
