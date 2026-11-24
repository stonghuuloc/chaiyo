import { REFERENCE_NOW, REFERENCE_ROWS } from '#lib/admin/fixtures/reports.js';
import { listReports } from '#lib/admin/reports.js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

vi.mock('#lib/supabase.js', () => ({ supabase: { rpc: vi.fn() } }));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), snapshot: vi.fn() }));

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const text = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim();

const render = async () => {
	const reports = await listReports({
		rpc: async () => ({ data: REFERENCE_ROWS, error: null })
	} as never);
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, {
		target,
		props: {
			data: { session: null, shell: { template: 'pushed', section: 'me' }, reports }
		} as never
	}) as Record<string, unknown>;
	flushSync();
	const t = target;
	return {
		root: t,
		title: () => text(t.querySelector('[data-part=top-bar] span')),
		back: () => t.querySelector('[data-part=top-bar] a')?.getAttribute('href'),
		badge: () => t.querySelector('[data-part=admin-badge]'),
		h1: () => text(t.querySelector('h1')),
		tabs: () =>
			[...t.querySelectorAll('[data-part=report-tabs] button')].map((b) => [
				text(b),
				b.getAttribute('aria-pressed')
			]),
		chips: () =>
			[...t.querySelectorAll('[data-part=report-chips] button')].map((b) => [
				text(b),
				b.getAttribute('aria-pressed')
			]),
		cards: () => [...t.querySelectorAll('[data-part=report-list] > li')],
		order: () =>
			[...t.querySelectorAll('[data-part], h1')].map((e) =>
				e.tagName === 'H1' ? 'h1' : (e as HTMLElement).dataset.part
			)
	};
};

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(REFERENCE_NOW);
});

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
	vi.useRealTimers();
});

describe('/admin/reports', () => {
	it('Given_Ten_Then_TopBarBadgeHeadingInOrder', async () => {
		const v = await render();
		expect(v.title()).toBe('Báo lỗi nội dung');
		expect(v.back()).toMatch(/\/me$/);
		expect(text(v.badge())).toBe('Quản trị');
		expect(v.badge()?.querySelector('use')?.getAttribute('href')).toBe('#i-fill-shield');
		expect(v.h1()).toBe('Người học báo lỗi');
		expect(v.order().filter((p) => !p?.match(/^(report-)?card/))).toEqual([
			'top-bar',
			'admin-badge',
			'h1',
			'report-tabs',
			'report-chips',
			'report-list'
		]);
	});

	it('Given_Ten_Then_TabsMoi10DaXuLy0MoiPressed', async () => {
		const v = await render();
		expect(v.tabs()).toEqual([
			['Mới 10', 'true'],
			['Đã xử lý 0', 'false']
		]);
	});

	it('Given_Ten_Then_ChipTextsInOrderAllPressed', async () => {
		const v = await render();
		expect(v.chips()).toEqual([
			['Tất cả · 10', 'true'],
			['Nghĩa sai · 3', 'false'],
			['Pinyin sai · 2', 'false'],
			['Âm thanh lỗi · 3', 'false'],
			['Khác · 2', 'false']
		]);
	});

	it('Given_Ten_Then_TenCardsR1First', async () => {
		const v = await render();
		const cards = v.cards();
		expect(cards).toHaveLength(10);
		expect(cards.map((c) => (c as HTMLElement).dataset.id)).toEqual(
			REFERENCE_ROWS.map((r) => r.id)
		);
	});

	it('Given_R1_Then_HanziTitleTagWhoNote', async () => {
		const [r1] = (await render()).cards();
		const hz = r1.querySelector('[data-part=card-hanzi]')!;
		expect(text(hz)).toBe('你好');
		expect(hz.classList).toContain('text-[30px]');
		expect(text(r1.querySelector('b'))).toBe('Từ mới · Bài 1');
		expect(text(r1.querySelector('[data-part=card-tag]'))).toBe('Pinyin sai');
		expect(text(r1.querySelector('[data-part=card-who]'))).toBe('Lan · 12 phút trước');
		const note = r1.querySelector('[data-part=card-note]')!;
		expect(text(note)).toBe('Thẻ ghi nǐ hǎo nhưng audio đọc ní hǎo.');
		expect(note.classList).toContain('text-ink');
	});

	it('Given_R2_Then_NguoiHocAndNoNoteFaint', async () => {
		const r2 = (await render()).cards()[1];
		expect(text(r2.querySelector('b'))).toBe('Từ mới');
		expect(text(r2.querySelector('[data-part=card-who]'))).toBe('Người học · 1 giờ trước');
		const note = r2.querySelector('[data-part=card-note]')!;
		expect(text(note)).toBe('Không có ghi chú');
		expect(note.classList).toContain('text-faint-pencil');
	});

	it('Given_R4_Then_IconBoxAndBai1XinChao', async () => {
		const r4 = (await render()).cards()[3];
		const box = r4.querySelector('[data-part=card-icon]')!;
		expect(box.querySelector('use')?.getAttribute('href')).toBe('#i-fill-book-open-text');
		expect(box.classList).toContain('size-10');
		expect(text(r4.querySelector('b'))).toBe('Bài 1 · Xin chào');
		expect(text(r4.querySelector('[data-part=card-tag]'))).toBe('Khác');
	});

	it('Given_R5R7R8_Then_LongHanziYesterdayDaysOther', async () => {
		const cards = (await render()).cards();
		const hz = cards[4].querySelector('[data-part=card-hanzi]')!;
		expect(hz.classList).toContain('text-[22px]');
		expect(text(cards[4].querySelector('[data-part=card-who]'))).toBe('Người học · Hôm qua');
		expect(text(cards[6].querySelector('[data-part=card-who]'))).toBe('Người học · 2 ngày trước');
		expect(text(cards[7].querySelector('[data-part=card-tag]'))).toBe('Khác');
	});

	it('Given_Page_Then_NoRedNoLinksInCards', async () => {
		const v = await render();
		const html = v.root.innerHTML;
		expect(html).not.toMatch(/lantern-red|shadow-/);
		const list = v.root.querySelector('[data-part=report-list]')!;
		expect(list.querySelectorAll('a, button')).toHaveLength(0);
	});
});
