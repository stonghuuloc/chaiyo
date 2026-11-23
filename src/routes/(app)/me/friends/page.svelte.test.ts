import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import type { BoardRow } from '#lib/social/board.js';
import { initialState } from '#lib/study/index.js';
import Page from './+page.svelte';

const nav = vi.hoisted(() => ({ afterNavigate: vi.fn(), snapshot: vi.fn() }));
vi.mock('$app/navigation', () => nav);

const ledger = {
	state: () => initialState({ curriculum: CURRICULUM }),
	subscribe: () => () => {}
} as unknown as Ledger;
const opened = vi.hoisted(() => vi.fn());
vi.mock('#lib/learner/index.js', () => ({
	learnerLedger: async (...args: unknown[]) => (opened(...args), ledger)
}));

const row = (name: string, streak: number, wordsWeek: number, me = false): BoardRow => ({
	handle: name.toLowerCase(),
	name,
	photo: null,
	lesson: 7,
	streak,
	wordsWeek,
	me
});
const LINH = row('Linh', 12, 9, true);
const BOARD = [row('Lan', 4, 25), LINH, row('Huy', 9, 17), row('Minh', 30, 14)];

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const render = async (board: BoardRow[], session: { user: { id: string } } | null = null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, {
		target,
		props: { data: { session, shell: { template: 'pushed', section: 'me' }, board } } as never
	}) as Record<string, unknown>;
	for (let i = 0; i < 3; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
	return target;
};

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = undefined;
	target = undefined;
	opened.mockClear();
});

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();
const items = (root: HTMLElement) => [...root.querySelectorAll('ul > li')];
const names = (root: HTMLElement) => items(root).map((li) => text(li.querySelector('b')));
const values = (root: HTMLElement) =>
	items(root).map((li) => text(li.querySelector('[data-part="value"]')));
const toggle = (root: HTMLElement, label: string) =>
	[...root.querySelectorAll<HTMLButtonElement>('[role="group"] button')].find(
		(b) => b.textContent?.trim() === label
	)!;

describe('friends board page', () => {
	it('Given_4Rows_When_Render_Then_OrderMinhLinhHuyLan', async () => {
		const root = await render(BOARD);
		expect(names(root)).toEqual(['Minh', 'LinhBạn', 'Huy', 'Lan']);
		expect(text(root.querySelector('span.font-display'))).toBe('Bạn bè');
	});

	it('Given_4Rows_Then_Medals1to3AndNumber4', async () => {
		const root = await render(BOARD);
		const ranks = items(root).map((li) => li.querySelector('[data-part="rank"]')!);
		expect(ranks.slice(0, 3).map((r) => r.getAttribute('aria-label'))).toEqual([
			'Hạng 1',
			'Hạng 2',
			'Hạng 3'
		]);
		expect(
			ranks
				.slice(0, 3)
				.every((r) => r.querySelector('use')?.getAttribute('href') === '#i-fill-medal')
		).toBe(true);
		expect(ranks[3].getAttribute('aria-label')).toBeNull();
		expect(text(ranks[3])).toBe('4');
	});

	it('Given_MeRow_Then_TagBanNoLinkNoLesson', async () => {
		const root = await render(BOARD);
		const me = items(root)[1];
		expect(text(me.querySelector('b span'))).toBe('Bạn');
		expect(me.querySelector('a')).toBeNull();
		expect(me.textContent).not.toContain('Bài');
	});

	it('Given_Others_Then_LinkToUHandleAndBaiN', async () => {
		const root = await render(BOARD);
		const minh = items(root)[0];
		expect(minh.querySelector('a')?.getAttribute('href')).toBe('/u/minh');
		expect(text(minh.querySelector('small'))).toBe('Bài 7');
	});

	it('Given_Streak_Then_NNgayWithFire', async () => {
		const root = await render(BOARD);
		expect(values(root)).toEqual(['30 ngày', '12 ngày', '9 ngày', '4 ngày']);
		expect(
			items(root).every(
				(li) => li.querySelector('[data-part="value"] use')?.getAttribute('href') === '#i-fill-fire'
			)
		).toBe(true);
	});

	it('Given_ClickTuTrongTuan_Then_ReRankedNTu', async () => {
		const root = await render(BOARD);
		const streak = toggle(root, 'Chuỗi ngày');
		const week = toggle(root, 'Từ trong tuần');
		expect([streak.ariaPressed, week.ariaPressed]).toEqual(['true', 'false']);
		week.click();
		flushSync();
		expect([streak.getAttribute('aria-pressed'), week.getAttribute('aria-pressed')]).toEqual([
			'false',
			'true'
		]);
		expect(names(root)).toEqual(['Lan', 'Huy', 'Minh', 'LinhBạn']);
		expect(values(root)).toEqual(['25 từ', '17 từ', '14 từ', '9 từ']);
		expect(root.querySelector('[data-part="value"] svg')).toBeNull();
	});

	it('Given_Lead_Then_Count3', async () => {
		const root = await render(BOARD);
		expect(text(root.querySelector('p'))).toBe('Bạn đứng ở bảng của 3 người bạn theo dõi.');
	});

	it('Given_Empty_Then_TitleBodyToggleNoList', async () => {
		const root = await render([LINH]);
		expect(text(root.querySelector('h2'))).toBe('Chưa có ai trong bảng');
		expect(text(root.querySelector('h2 + p'))).toBe(
			'Học một mình hơi buồn, rủ bạn vào đua cho vui nhé!'
		);
		expect(root.querySelectorAll('[role="group"] button')).toHaveLength(2);
		expect(root.querySelector('ul')).toBeNull();
		expect(root.textContent).not.toContain('Bạn đứng ở bảng');
	});

	it('Given_OnlyHiddenFollowed_Then_Empty', async () => {
		const root = await render([]);
		expect(text(root.querySelector('h2'))).toBe('Chưa có ai trong bảng');
		expect(root.querySelector('ul')).toBeNull();
	});

	it('Given_Photo_Then_ImgAvatarElseInitial', async () => {
		const root = await render([
			{ ...row('Minh', 30, 14), photo: 'https://a.googleusercontent.com/x' },
			LINH
		]);
		const [minh, me] = items(root);
		expect(minh.querySelector('img')?.getAttribute('src')).toBe(
			'https://a.googleusercontent.com/x'
		);
		expect(text(me.querySelector('[data-part="avatar"]'))).toBe('L');
	});

	it('Given_LedgerOpens_Then_MyRowFromLocalState', async () => {
		const root = await render(BOARD, { user: { id: 'u1' } });
		expect(opened).toHaveBeenCalledTimes(1);
		expect(names(root)).toEqual(['Minh', 'Huy', 'Lan', 'LinhBạn']);
		expect(values(root)[3]).toBe('0 ngày');
	});
});
