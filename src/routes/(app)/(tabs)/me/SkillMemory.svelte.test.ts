import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SkillMemory from './SkillMemory.svelte';
import type { SkillMem } from './me';

const niHaoXie: SkillMem[] = [
	{ skill: 'the', firm: 1, shaky: 1, unseen: 1, size: 3 },
	{ skill: 'nghe', firm: 0, shaky: 1, unseen: 2, size: 3 },
	{ skill: 'viet', firm: 0, shaky: 0, unseen: 3, size: 3 }
];
const empty: SkillMem[] = niHaoXie.map((s) => ({
	skill: s.skill,
	firm: 0,
	shaky: 0,
	unseen: 0,
	size: 0
}));

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (skills: SkillMem[]) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(SkillMemory, { target, props: { skills } }) as Record<string, unknown>;
	flushSync();
	const rows = () => [...target!.querySelectorAll('[data-part=me-memory] li')];
	return {
		title: () => target!.querySelector('h2')?.textContent?.trim(),
		sub: () => target!.querySelector('[data-part=me-memory] > p')?.textContent?.trim(),
		link: () => target!.querySelector<HTMLAnchorElement>('[data-part=me-memory] a')!,
		rows,
		labels: () => rows().map((r) => r.firstElementChild!.textContent?.trim()),
		icons: () => rows().map((r) => r.firstElementChild!.querySelector('use')?.getAttribute('href')),
		counts: () => rows().map((r) => r.querySelector('small')?.textContent?.trim()),
		bars: () => rows().map((r) => r.querySelector('[role=img]')!),
		widths: () =>
			rows().map((r) =>
				[...r.querySelectorAll<HTMLElement>('[role=img] i')].map((i) => i.style.width)
			)
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
});

describe('SkillMemory', () => {
	it('Given_Skills_When_Render_Then_ThreeRowsInOrderWithIcons', () => {
		// Arrange
		// Act
		const view = render(niHaoXie);

		// Assert
		expect(view.title()).toBe('Độ nhớ theo kỹ năng');
		expect(view.sub()).toBe('Kỹ năng nào bar ngắn là đang đuối, luyện thêm nhé.');
		expect(view.labels()).toEqual(['Thẻ từ', 'Nghe', 'Viết chữ']);
		expect(view.icons()).toEqual(['#i-fill-cards', '#i-fill-headphones', '#i-fill-pen']);
	});

	it('Given_NiHaoXie_When_Render_Then_CountTextsAndAriaLabels', () => {
		// Arrange
		// Act
		const view = render(niHaoXie);

		// Assert
		expect(view.counts()).toEqual([
			'1 nhớ chắc · 1 còn lơ mơ · 1 chưa luyện',
			'0 nhớ chắc · 1 còn lơ mơ · 2 chưa luyện',
			'0 nhớ chắc · 0 còn lơ mơ · 3 chưa luyện'
		]);
		expect(view.bars().map((b) => b.getAttribute('aria-label'))).toEqual([
			'Thẻ từ: 1 nhớ chắc, 1 còn lơ mơ, 1 chưa luyện',
			'Nghe: 0 nhớ chắc, 1 còn lơ mơ, 2 chưa luyện',
			'Viết chữ: 0 nhớ chắc, 0 còn lơ mơ, 3 chưa luyện'
		]);
	});

	it('Given_NiHaoXie_When_Render_Then_SegmentWidths', () => {
		// Arrange
		// Act
		const view = render(niHaoXie);

		// Assert
		const [firm, shaky] = view.widths()[0];
		expect(parseFloat(firm)).toBeCloseTo(33.33, 1);
		expect(parseFloat(shaky)).toBeCloseTo(33.33, 1);
		expect(view.widths()[2]).toEqual(['0%', '0%']);
	});

	it('Given_EmptyLexicon_When_Render_Then_ZeroWidths', () => {
		// Arrange
		// Act
		const view = render(empty);

		// Assert
		expect(view.widths()).toEqual([
			['0%', '0%'],
			['0%', '0%'],
			['0%', '0%']
		]);
		expect(view.counts()[0]).toBe('0 nhớ chắc · 0 còn lơ mơ · 0 chưa luyện');
	});

	it('Given_Section_When_Render_Then_LinkToPracticeWords', () => {
		// Arrange
		// Act
		const view = render(niHaoXie);

		// Assert
		expect(view.link().getAttribute('href')).toMatch(/\/practice\/words$/);
		expect(view.link().textContent?.trim()).toBe('Từ của tôi');
	});
});
