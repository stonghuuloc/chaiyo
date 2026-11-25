import { pagedRpc, REFERENCE_NOW, REFERENCE_ROWS } from '#lib/admin/fixtures/reports.js';
import { listReports } from '#lib/admin/reports.js';
import { flushSync, mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({ supabase: { rpc } }));
vi.mock('$app/navigation', () => ({ afterNavigate: vi.fn(), snapshot: vi.fn() }));

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const text = (e: Element | null | undefined) => e?.textContent?.replace(/\s+/g, ' ').trim();

const render = async (rows: unknown[] = REFERENCE_ROWS) => {
	const reports = await listReports({
		rpc: () => pagedRpc(rows)
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
		toast: () => text(t.querySelector('[role=status]')),
		button: (label: string) =>
			[...t.querySelectorAll('button')].find((b) => text(b)?.startsWith(label)) as
				HTMLButtonElement | undefined,
		resolveBtn: (n: number) =>
			t.querySelector<HTMLButtonElement>(
				`[data-id="${REFERENCE_ROWS[n - 1].id}"] [data-part=resolve]`
			),
		ids: () =>
			[...t.querySelectorAll('[data-part=report-list] > li')].map(
				(c) => (c as HTMLElement).dataset.id
			),
		order: () =>
			[...t.querySelectorAll('[data-part], h1')].map((e) =>
				e.tagName === 'H1' ? 'h1' : (e as HTMLElement).dataset.part
			)
	};
};

const settle = async () => {
	for (let i = 0; i < 6; i++) await Promise.resolve();
	flushSync();
};

const tap = async (el: Element | null | undefined) => {
	(el as HTMLElement).click();
	await settle();
};

const resolved = (...n: number[]) =>
	REFERENCE_ROWS.map((r, i) => (n.includes(i + 1) ? { ...r, status: 'resolved' } : r));

const deferred = () => {
	let done!: (v: { data: null; error: unknown }) => void;
	const promise = new Promise<{ data: null; error: unknown }>((r) => (done = r));
	return { promise, done };
};

const id = (n: number) => REFERENCE_ROWS[n - 1].id;

beforeEach(() => {
	rpc.mockReset();
	rpc.mockResolvedValue({ data: null, error: null });
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
		expect(v.order().filter((p) => !p?.match(/^((report-)?card|resolve$)/))).toEqual([
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
		expect(text(r4.querySelector('b'))).toBe('Bài 1 · Xin chào · d02');
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

	it('Given_Page_Then_NoRedNoShadow', async () => {
		const v = await render();
		expect(v.root.innerHTML).not.toMatch(/lantern-red|shadow-/);
	});

	it('Given_R1_Then_LinkWordWithLessonAndHint', async () => {
		const [r1] = (await render()).cards();
		const a = r1.querySelector('a[data-part=card-link]')!;
		expect(a.getAttribute('href')).toBe('/word/你好?lesson=h1-01');
		expect(text(a.querySelector('[data-part=card-hint]'))).toBe('Mở thẻ từ 你好');
		expect(a.querySelector('[data-part=card-hanzi]')).not.toBeNull();
	});

	it('Given_R2_Then_LinkWordNoQuery', async () => {
		const r2 = (await render()).cards()[1];
		const a = r2.querySelector('a[data-part=card-link]')!;
		expect(a.getAttribute('href')).toBe('/word/谢谢');
		expect(text(a.querySelector('[data-part=card-hint]'))).toBe('Mở thẻ từ 谢谢');
	});

	it('Given_R4_Then_LinkLessonWords', async () => {
		const r4 = (await render()).cards()[3];
		const a = r4.querySelector('a[data-part=card-link]')!;
		expect(a.getAttribute('href')).toBe('/lesson/h1-01/words');
		expect(text(a.querySelector('[data-part=card-hint]'))).toBe('Mở danh sách từ của bài');
	});

	it('Given_UnknownLesson_Then_NoLinkNoHint', async () => {
		const rows = REFERENCE_ROWS.map((r, i) => (i === 3 ? { ...r, lesson_id: 'gone' } : r));
		const r4 = (await render(rows)).cards()[3];
		expect(r4.querySelector('a')).toBeNull();
		expect(r4.querySelector('[data-part=card-hint]')).toBeNull();
	});

	it('Given_Card_Then_ResolveButtonOutsideLink', async () => {
		const [r1] = (await render()).cards();
		expect(r1.querySelectorAll('a')).toHaveLength(1);
		const btn = r1.querySelector('[data-part=resolve]')!;
		expect(btn.closest('a')).toBeNull();
		expect(r1.querySelector('a')!.contains(r1.querySelector('[data-part=card-note]'))).toBe(false);
		expect(r1.querySelector('a')!.contains(r1.querySelector('[data-part=card-tag]'))).toBe(false);
		expect(text(btn)).toBe('Đánh dấu đã xử lý');
		expect(btn.querySelector('use')?.getAttribute('href')).toBe('#i-bold-check');
	});

	it('Given_TapAudio_Then_R2R6R10AndPressed', async () => {
		const v = await render();
		await tap(v.button('Âm thanh lỗi'));
		expect(v.ids()).toEqual([id(2), id(6), id(10)]);
		expect(v.chips().map((c) => c[1])).toEqual(['false', 'false', 'false', 'true', 'false']);
		await tap(v.button('Tất cả'));
		expect(v.ids()).toHaveLength(10);
		expect(v.chips()[0][1]).toBe('true');
	});

	it('Given_AudioPressed_When_TabDone_Then_StillPressed', async () => {
		const v = await render(resolved(1));
		await tap(v.button('Âm thanh lỗi'));
		await tap(v.button('Đã xử lý'));
		expect(v.tabs()).toEqual([
			['Mới 9', 'false'],
			['Đã xử lý 1', 'true']
		]);
		expect(v.chips().map((c) => c[0])).toEqual([
			'Tất cả · 1',
			'Nghĩa sai · 0',
			'Pinyin sai · 1',
			'Âm thanh lỗi · 0',
			'Khác · 0'
		]);
		expect(v.chips()[3][1]).toBe('true');
	});

	it('Given_TapResolveR1_Then_OneRpcTabs9_1AndToast', async () => {
		const v = await render();
		await tap(v.resolveBtn(1));
		expect(rpc).toHaveBeenCalledOnce();
		expect(rpc).toHaveBeenCalledWith('set_error_report_status', {
			p_id: id(1),
			p_status: 'resolved'
		});
		expect(v.tabs().map((t) => t[0])).toEqual(['Mới 9', 'Đã xử lý 1']);
		expect(v.ids()).not.toContain(id(1));
		expect(v.toast()).toBe('Đã xử lý xong, gọn gàng! Hoàn tác');
	});

	it('Given_Pending_Then_ResolveDisabled', async () => {
		const d = deferred();
		rpc.mockReturnValueOnce(d.promise);
		const v = await render();
		await tap(v.resolveBtn(1));
		expect(v.resolveBtn(1)!.disabled).toBe(true);
		expect(v.tabs()[0][0]).toBe('Mới 10');
		d.done({ data: null, error: null });
		await settle();
		expect(v.tabs()[0][0]).toBe('Mới 9');
	});

	it('Given_R1R3InFlight_When_R1Settles_Then_R3StillDisabledAndTwoRpcs', async () => {
		const d1 = deferred();
		const d3 = deferred();
		rpc.mockReturnValueOnce(d1.promise).mockReturnValueOnce(d3.promise);
		const v = await render();
		await tap(v.resolveBtn(1));
		await tap(v.resolveBtn(3));
		expect(rpc).toHaveBeenCalledTimes(2);
		expect(v.resolveBtn(1)!.disabled).toBe(true);
		expect(v.resolveBtn(3)!.disabled).toBe(true);
		d1.done({ data: null, error: null });
		await settle();
		expect(v.resolveBtn(1)).toBeNull();
		expect(v.resolveBtn(3)!.disabled).toBe(true);
		await tap(v.resolveBtn(3));
		expect(rpc).toHaveBeenCalledTimes(2);
		d3.done({ data: null, error: null });
		await settle();
		expect(v.resolveBtn(3)).toBeNull();
	});

	it('Given_Toast_When_Undo_Then_RpcNewTabs10_0R1First', async () => {
		const v = await render();
		await tap(v.resolveBtn(1));
		await tap(v.button('Hoàn tác'));
		expect(rpc).toHaveBeenLastCalledWith('set_error_report_status', {
			p_id: id(1),
			p_status: 'new'
		});
		expect(v.tabs().map((t) => t[0])).toEqual(['Mới 10', 'Đã xử lý 0']);
		expect(v.ids()![0]).toBe(id(1));
	});

	it('Given_ResolveR1ThenR3_When_Undo_Then_OnlyR3Reopens', async () => {
		const v = await render();
		await tap(v.resolveBtn(1));
		await tap(v.resolveBtn(3));
		await tap(v.button('Hoàn tác'));
		expect(rpc).toHaveBeenLastCalledWith('set_error_report_status', {
			p_id: id(3),
			p_status: 'new'
		});
		expect(v.tabs().map((t) => t[0])).toEqual(['Mới 9', 'Đã xử lý 1']);
		expect(v.ids()).toContain(id(3));
		expect(v.ids()).not.toContain(id(1));
	});

	it('Given_RpcRejects_Then_CountsUnchangedAndFailedToast', async () => {
		rpc.mockResolvedValueOnce({ data: null, error: { message: 'nope' } });
		const v = await render();
		await tap(v.resolveBtn(1));
		expect(v.tabs().map((t) => t[0])).toEqual(['Mới 10', 'Đã xử lý 0']);
		expect(v.ids()).toHaveLength(10);
		expect(v.toast()).toBe('Chưa lưu được, thử lại nhé.');
		expect(v.button('Hoàn tác')).toBeUndefined();
		expect(v.resolveBtn(1)!.disabled).toBe(false);
	});

	it('Given_R1Resolved_When_TabDone_Then_DaXuLyAndMoLai', async () => {
		const v = await render(resolved(1));
		await tap(v.button('Đã xử lý'));
		const [r1] = v.cards();
		expect(text(r1.querySelector('[data-part=resolved]'))).toBe('Đã xử lý');
		expect(r1.querySelector('[data-part=resolved] use')?.getAttribute('href')).toBe(
			'#i-fill-check'
		);
		expect(text(r1.querySelector('[data-part=reopen]'))).toBe('Mở lại');
		expect(r1.querySelector('[data-part=resolve]')).toBeNull();
	});

	it('Given_ToastOpen_When_TapMoLai_Then_RpcNewToastClosed', async () => {
		const v = await render();
		await tap(v.resolveBtn(1));
		expect(v.toast()).toContain('Đã xử lý xong');
		await tap(v.button('Đã xử lý'));
		await tap(v.root.querySelector('[data-part=reopen]'));
		expect(rpc).toHaveBeenLastCalledWith('set_error_report_status', {
			p_id: id(1),
			p_status: 'new'
		});
		expect(v.tabs().map((t) => t[0])).toEqual(['Mới 10', 'Đã xử lý 0']);
		expect(v.button('Hoàn tác')).toBeUndefined();
	});

	it('Given_AllResolved_Then_HopThuSachBong', async () => {
		const v = await render(resolved(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
		const e = v.root.querySelector('[data-part=report-empty]')!;
		expect(text(e.querySelector('[lang=zh]'))).toBe('安');
		expect(text(e)).toContain('Hộp thư sạch bong!');
		expect(text(e)).toContain('Không còn báo lỗi nào đang chờ. Nghỉ tay uống miếng trà đi nhé.');
		expect(v.root.querySelector('[data-part=report-list]')).toBeNull();
		await tap(v.button('Âm thanh lỗi'));
		expect(text(v.root.querySelector('[data-part=report-empty]'))).toContain('Hộp thư sạch bong!');
	});

	it('Given_NoneResolved_When_TabDone_Then_ChuaXuLyCaiNao', async () => {
		const v = await render();
		await tap(v.button('Đã xử lý'));
		const e = v.root.querySelector('[data-part=report-empty]')!;
		expect(text(e.querySelector('[lang=zh]'))).toBe('空');
		expect(text(e)).toContain('Chưa xử lý cái nào');
		expect(text(e)).toContain('Báo lỗi bạn đã xử lý sẽ nằm ở đây.');
	});

	it('Given_AudioAllResolved_When_Audio_Then_YenAngDangCho', async () => {
		const v = await render(resolved(2, 6, 10));
		await tap(v.button('Âm thanh lỗi'));
		const e = v.root.querySelector('[data-part=report-empty]')!;
		expect(text(e.querySelector('[lang=zh]'))).toBe('静');
		expect(text(e)).toContain('Mục này đang yên ắng');
		expect(text(e)).toContain('Không có báo lỗi “Âm thanh lỗi” nào đang chờ.');
		expect(v.root.querySelector('[data-part=report-list]')).toBeNull();
	});

	it('Given_R1Resolved_When_DoneMeaning_Then_YenAngDuocXuLy', async () => {
		const v = await render(resolved(1));
		await tap(v.button('Đã xử lý'));
		await tap(v.button('Nghĩa sai'));
		const e = v.root.querySelector('[data-part=report-empty]')!;
		expect(text(e.querySelector('[lang=zh]'))).toBe('静');
		expect(text(e)).toContain('Chưa có báo lỗi “Nghĩa sai” nào được xử lý.');
	});
});
