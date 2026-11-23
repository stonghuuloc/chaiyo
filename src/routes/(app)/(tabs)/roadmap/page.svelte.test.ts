import { flushSync, mount, tick, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const reference = (): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'] = { unlocked: true, passed: true, done: [], best: 90 };
	state.lessons['h1-01'].unlocked = true;
	return state;
};

const next = (): State => {
	const state = reference();
	state.lessons['h1-01'] = { unlocked: true, passed: true, done: [], best: 85 };
	state.lessons['h1-02'].unlocked = true;
	return state;
};

const hoisted = vi.hoisted(() => ({ load: vi.fn() }));
let current: State = reference();
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: hoisted.load }));

const session = { user: { id: 'u1' } };
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const text = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, ' ').trim();

const mountPage = async (data: { session: typeof session | null } = { session }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data } as never }) as Record<string, unknown>;
	await settle();
	const one = (s: string) => target!.querySelector(s);
	const all = (s: string) => [...target!.querySelectorAll(s)];
	const row = (id: string) => one(`[data-part=level-row][data-id="${id}"]`);
	return {
		one,
		all,
		sum: () => text(one('[data-part=roadmap-sum]')),
		cells: () => all('[data-part=level-cell]'),
		cardTitle: () => text(one('[data-part=now-title]')),
		cardLine: () => text(one('[data-part=now-line]')),
		open: () => all('[data-part=topic][open] [data-part=topic-title]').map(text),
		rowTitle: (id: string) => text(row(id)?.querySelector('[data-part=level-title]')),
		rowNote: (id: string) => text(row(id)?.querySelector('[data-part=level-note]')),
		toast: () => text(document.querySelector('[role=status] span')),
		row
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	listeners.clear();
	hoisted.load.mockReset();
	current = reference();
});

describe('/roadmap', () => {
	it('Given_ReferenceLearner_When_Open_Then_HeaderText', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.sum()).toBe('HSK 1 · 0/40 bài · 300 từ mới');
	});

	it('Given_ReferenceLearner_When_Open_Then_StripCells1to5With4Locks', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		const cells = page.cells();
		expect(cells.map((c) => text(c.querySelector('b')))).toEqual(['1', '2', '3', '4', '5']);
		expect(cells.map((c) => c.querySelector('use[href="#i-fill-lock-simple"]') !== null)).toEqual([
			false,
			true,
			true,
			true,
			true
		]);
		expect(cells.map((c) => c.getAttribute('aria-current'))).toEqual([
			'true',
			null,
			null,
			null,
			null
		]);
		expect(page.one('[data-part=level-strip]')!.querySelectorAll('.bg-lantern-red')).toHaveLength(
			0
		);
	});

	it('Given_ReferenceLearner_When_Open_Then_CardTextsAndOneRedLinkToH101', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.cardTitle()).toBe('Bài 1 · Xin chào 你好');
		expect(page.cardLine()).toBe('Phần 1 · cần 80% bài kiểm tra để mở Bài 2');
		const red = page.all('.bg-lantern-red');
		expect(red).toHaveLength(1);
		expect(red[0].tagName).toBe('A');
		expect(red[0].getAttribute('href')).toBe('/lesson/h1-01');
		expect(text(red[0])).toBe('Tiếp tục Bài 1');
	});

	it('Given_ReferenceLearner_When_Open_Then_OnlyChuDe1Open', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.open()).toEqual(['Chủ đề 1 · Chào hỏi']);
		const titles = page.all('[data-part=topic-title]').map(text);
		expect(titles.slice(0, 3)).toEqual(['Khởi đầu', 'Chủ đề 1 · Chào hỏi', 'Chủ đề 2 · Gia đình']);
		expect(titles).toHaveLength(11);
		expect(titles.at(-1)).toBe('Cuối cấp');
		expect(text(page.all('[data-part=topic-count]')[0])).toBe('1/1');
	});

	it('Given_ReferenceLearner_When_Open_Then_RowNotesBai0Bai1Bai2', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.rowTitle('h1-01')).toBe('Bài 1 · Xin chào 你好');
		expect(page.rowNote('h1-01')).toBe('Đang học · phần 1');
		expect(page.rowNote('h1-02')).toBe('Mở khi qua Bài 1');
		expect(page.row('h1-02')!.querySelector('use[href="#i-fill-lock-simple"]')).not.toBeNull();
		expect(page.rowNote('h0-00')).toBe('Đã xong · điểm cao nhất 90%');
		expect(page.row('h0-00')!.querySelector('use[href="#i-bold-check"]')).not.toBeNull();
		expect(page.row('h1-01')!.querySelector('a')!.getAttribute('href')).toBe('/lesson/h1-01');
		expect(page.row('h0-00')!.querySelector('a')!.getAttribute('href')).toBe('/lesson/h0-00');
	});

	it('Given_PassedWithoutBest_When_Render_Then_DoneOnly', async () => {
		// Arrange
		current = reference();
		delete current.lessons['h0-00'].best;
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.rowNote('h0-00')).toBe('Đã xong');
	});

	it('Given_OpenRow_When_Render_Then_LinkWithNoNote', async () => {
		// Arrange
		current = reference();
		current.lessons['h1-03'].unlocked = true;
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.row('h1-03')!.getAttribute('data-status')).toBe('open');
		expect(page.row('h1-03')!.querySelector('a')!.getAttribute('href')).toBe('/lesson/h1-03');
		expect(page.rowNote('h1-03')).toBeUndefined();
	});

	it('Given_LockedRow_When_Render_Then_ButtonNoAnchor', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		const locked = page.all('[data-part=level-row][data-status=locked]');
		expect(locked.length).toBeGreaterThan(0);
		expect(locked.every((r) => r.querySelector('a') === null)).toBe(true);
		const buttons = locked.map((r) => r.querySelector('button[data-part=level-row-btn]'));
		expect(buttons.every((b) => b?.getAttribute('type') === 'button')).toBe(true);
		expect(
			page.row('h1-02')!.querySelector('use[href="#i-regular-caret-right"]')
		).not.toBeNull();
	});

	it('Given_ReferenceLearner_When_TapBai2_Then_ToastAndNoNavigation', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		const href = location.href;

		// Act
		page.row('h1-02')!.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		// Assert
		expect(page.toast()).toBe('Qua Bài 1 để mở Bài 2');
		expect(location.href).toBe(href);
	});

	it('Given_ReferenceLearner_When_TapH106_Then_DraftToastAndNote', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		page.row('h1-06')!.querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		// Assert
		expect(page.toast()).toBe('Bài 6 đang được soạn.');
		expect(page.rowNote('h1-06')).toBe('Đang soạn');
	});

	it('Given_ReferenceLearner_When_OpenCuoiCap_Then_ThiThuHsk1Row', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		const exams = page.one('[data-part=exams]')!;

		// Act
		exams.querySelector('summary')!.click();
		flushSync();
		const rows = [...exams.querySelectorAll('[data-part=exam-row]')];
		rows[0].querySelector<HTMLButtonElement>('button')!.click();
		flushSync();

		// Assert
		expect(exams.hasAttribute('open')).toBe(true);
		expect(text(exams.querySelector('[data-part=topic-title]'))).toBe('Cuối cấp');
		expect(text(exams.querySelector('[data-part=topic-count]'))).toBe('0/1');
		expect(rows.map((r) => text(r.querySelector('[data-part=exam-title]')))).toEqual([
			'Thi thử HSK 1'
		]);
		expect(text(rows[0].querySelector('[data-part=exam-note]'))).toBe(
			'nghe · đọc · viết · mở khi qua Bài 40'
		);
		expect(exams.querySelector('[data-part=exam-end]')).toBeNull();
		expect(page.toast()).toBe('Qua Bài 40 để mở thi thử HSK 1');
	});

	it('Given_NextStatePublished_When_Render_Then_TextsUpdate', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		publish(next());
		flushSync();

		// Assert
		expect(page.sum()).toBe('HSK 1 · 1/40 bài · 300 từ mới');
		expect(page.rowNote('h1-01')).toBe('Đã xong · điểm cao nhất 85%');
		expect(page.cardTitle()).toBe('Bài 2 · Bạn tên gì? 你叫什么名字');
		expect(page.rowNote('h1-03')).toBe('Mở khi qua Bài 2');
	});

	it('Given_NoOutlineLevel_When_Open_Then_DraftingLine', async () => {
		// Arrange
		current = reference();
		for (const id of ['h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05'])
			current.lessons[id] = { unlocked: true, passed: true, done: [] };
		current.lessons['h2-01'].unlocked = true;
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.sum()).toBe('HSK 2');
		expect(text(page.one('[data-part=drafting]'))).toBe('Lộ trình HSK 2 đang được soạn.');
		expect(page.cells()).toHaveLength(5);
		expect(page.one('[data-part=now-card]')).toBeNull();
		expect(page.all('[data-part=topic]')).toHaveLength(0);
	});

	it('Given_NoSession_When_Open_Then_OnlyTitle', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(text(page.one('h1'))).toBe('Lộ trình');
		expect(page.one('[data-part=level-strip]')).toBeNull();
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_RejectingLedger_When_Open_Then_OnlyTitle', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(text(page.one('h1'))).toBe('Lộ trình');
		expect(page.one('[data-part=level-strip]')).toBeNull();
	});
});
