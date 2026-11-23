import { CURRICULUM } from '#lib/curriculum/index.js';
import { badgesView, initialState, type State } from '#lib/study/index.js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import MeBadges from './MeBadges.svelte';

const stamp = '2026-11-01T03:00:00Z';
const learner = (badges: string[], best: number, words: number): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (let i = 0; i < words; i++) state.lexicon[`w${i}`] = { saved: true, cards: {} };
	state.streak = { count: best, last: '2026-11-23', freezes: 1, best };
	for (const id of badges) state.badges[id as keyof State['badges']] = stamp;
	return state;
};
const reference = () => learner(['first', 'streak7'], 12, 12);

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
const render = (state: State) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(MeBadges, { target, props: { view: badgesView(state) } }) as Record<string, unknown>;
	flushSync();
	const cards = () => [...target!.querySelectorAll<HTMLAnchorElement>('ul a')];
	const card = (id: string) => target!.querySelector<HTMLAnchorElement>(`ul a[data-id=${id}]`)!;
	return {
		section: () => target!.querySelector('[data-part=me-badges]'),
		sub: () =>
			target!.querySelector('[data-part=me-badges] > p')?.textContent?.replace(/\s+/g, ' ').trim(),
		all: () => target!.querySelector<HTMLAnchorElement>('[data-part=me-badges] > div a')!,
		cards,
		card,
		ids: () => cards().map((c) => c.dataset.id),
		caption: (id: string) =>
			card(id).querySelector('small')?.textContent?.replace(/\s+/g, ' ').trim(),
		bar: (id: string) => card(id).querySelector<HTMLElement>('[data-part=bd-bar] i')
	};
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
});

describe('MeBadges', () => {
	it('Given_ReferenceLearner_When_Render_Then_Sub2of9NextStreak30', () => {
		const v = render(reference());
		expect(v.sub()).toBe('Có 2/9. Cái tiếp theo: Chuỗi 30 ngày.');
		expect(v.all().textContent).toContain('Xem hết');
		expect(v.all().getAttribute('href')).toMatch(/\/me\/badges$/);
		expect(v.ids().slice(0, 3)).toEqual(['first', 'streak7', 'streak30']);
	});

	it('Given_ReferenceLearner_When_Render_Then_NineLinksToBadges', () => {
		const v = render(reference());
		expect(v.cards()).toHaveLength(9);
		for (const c of v.cards()) expect(c.getAttribute('href')).toMatch(/\/me\/badges$/);
	});

	it('Given_ReferenceLearner_When_Render_Then_EarnedFirstWithDaCo', () => {
		const v = render(reference());
		expect(v.caption('first')).toBe('Đã có');
		expect(v.caption('streak7')).toBe('Đã có');
		expect(v.bar('first')).toBeNull();
		expect(v.card('first').textContent).toContain('Bước đầu tiên');
	});

	it('Given_Streak30Locked_When_Render_Then_12of30Bar40', () => {
		const v = render(reference());
		expect(v.caption('streak30')).toBe('12/30');
		expect(v.bar('streak30')!.style.width).toBe('40%');
	});

	it('Given_Hsk1Locked_When_Render_Then_HowTextNoBar', () => {
		const v = render(reference());
		expect(v.caption('hsk1')).toBe('Qua thi thử HSK 1');
		expect(v.caption('hsk2')).toBe('Qua thi thử HSK 2');
		expect(v.bar('hsk1')).toBeNull();
	});

	it('Given_AllEarned_When_Render_Then_Sub9of9DuBo', () => {
		const all = learner(
			[
				'first',
				'streak7',
				'streak30',
				'streak100',
				'words100',
				'words300',
				'write50',
				'hsk1',
				'hsk2'
			],
			100,
			300
		);
		const v = render(all);
		expect(v.sub()).toBe('Có 9/9. Đủ bộ rồi!');
		expect(v.cards()).toHaveLength(9);
	});

	it('Given_NoneEarned_When_Render_Then_NineBadgesAndNextStreak7', () => {
		const v = render(learner([], 3, 0));
		expect(v.sub()).toBe('Có 0/9. Cái tiếp theo: Chuỗi 7 ngày.');
		expect(v.cards()).toHaveLength(9);
		expect(v.caption('first')).toBe('Qua Bài 0');
	});
});
