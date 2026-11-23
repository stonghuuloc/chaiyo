import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { BADGES, initialState, type State } from '#lib/study/index.js';
import Page from './+page.svelte';

const reference = (): State => ({
	...initialState({ curriculum: CURRICULUM }),
	badges: { first: '2026-10-12T05:00:00Z', streak7: '2026-10-17T18:30:00Z' },
	streak: { count: 12, best: 12, freezes: 0 },
	lexicon: Object.fromEntries(
		Array.from({ length: 12 }, (_, i) => [`字${i}`, { saved: true, cards: {} }])
	)
});
const fresh = (): State => initialState({ curriculum: CURRICULUM });
const full = (): State => ({
	...reference(),
	badges: Object.fromEntries(BADGES.map(([id]) => [id, '2026-10-12T05:00:00Z']))
});

let current = reference();
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: async () => ledger }));

const handleRow = vi.hoisted(() => vi.fn());
vi.mock('#lib/supabase.js', () => ({
	supabase: {
		from: () => ({ select: () => ({ eq: () => ({ maybeSingle: handleRow }) }) })
	}
}));

const writeText = vi.fn();
Object.defineProperty(navigator, 'clipboard', {
	configurable: true,
	value: { writeText: (text: string) => writeText(text) }
});

beforeEach(() => {
	handleRow.mockReset().mockResolvedValue({ data: { handle: 'linh' }, error: null });
	writeText.mockReset().mockResolvedValue(undefined);
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	for (let i = 0; i < 5; i++) {
		await new Promise((r) => setTimeout(r, 0));
		await tick();
	}
	flushSync();
};

const mountPage = async (session: { user: { id: string } } | null) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data: { session } } as never }) as Record<string, unknown>;
	await settle();
	return target;
};

const headings = (el: HTMLElement) =>
	[...el.querySelectorAll('h2')].map((h) => h.textContent?.trim());
const section = (el: HTMLElement, title: string) =>
	[...el.querySelectorAll('section')].find((s) => s.querySelector('h2')?.textContent === title)!;
const rowOf = (el: HTMLElement, id: string) =>
	el.querySelector<HTMLElement>(`li[data-id="${id}"]`)!;
const user = { user: { id: 'u1' } };
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');
const toast = () => document.querySelector('[role="status"]')?.textContent?.trim();
const tap = async (button: HTMLButtonElement) => {
	button.focus();
	button.click();
	await settle();
};
const cell = (el: HTMLElement, id: string) =>
	el.querySelector<HTMLButtonElement>(`button[data-id="${id}"]`)!;
const rowButton = (el: HTMLElement, id: string) =>
	el.querySelector<HTMLButtonElement>(`li[data-id="${id}"] > button`)!;
const share = () =>
	[...(dialog()?.querySelectorAll('button') ?? [])].find((b) =>
		b.textContent?.includes('Khoe với bạn bè')
	);

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	app = target = undefined;
	listeners.clear();
	current = reference();
});

describe('badges page', () => {
	it('reference learner shows Có 2/9 huy hiệu and the Còn 7 line', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		expect(el.querySelector('h1')?.textContent).toBe('Có 2/9 huy hiệu');
		expect(el.textContent).toContain('Ngon lành rồi đó. Còn 7 cái nữa, từ từ mà sưu tầm.');
		expect(el.querySelector<HTMLElement>('[role="img"][aria-label="2/9"] > *')?.style.width).toBe(
			'22%'
		);
	});

	it('reference learner Đã có grid has 2 cells with Ngày 12/10 and Ngày 18/10', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		const cells = [...section(el, 'Đã có').querySelectorAll('[data-id]')];
		expect(cells.map((c) => c.getAttribute('data-id'))).toEqual(['first', 'streak7']);
		expect(cells[0].textContent).toContain('Bước đầu tiên');
		expect(cells[0].textContent).toContain('Ngày 12/10');
		expect(cells[1].textContent).toContain('Chuỗi 7 ngày');
		expect(cells[1].textContent).toContain('Ngày 18/10');
	});

	it('reference learner Sắp mở has 7 rows with 12/30 at width 40%', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		const rows = [...section(el, 'Sắp mở').querySelectorAll('li[data-id]')];
		expect(rows.map((r) => r.getAttribute('data-id'))).toEqual([
			'streak30',
			'streak100',
			'words100',
			'words300',
			'write50',
			'hsk1',
			'hsk2'
		]);
		const streak30 = rowOf(el, 'streak30');
		expect(streak30.textContent).toContain('12/30');
		expect(streak30.querySelector<HTMLElement>('[data-part="fill"]')?.style.width).toBe('40%');
		expect(streak30.textContent).toContain('Học 30 ngày liền. Một tháng không nghỉ!');
	});

	it('Đỗ HSK 1 row reads Qua thi thử HSK 1. and has no bar', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		const hsk1 = rowOf(el, 'hsk1');
		expect(hsk1.textContent).toContain('Qua thi thử HSK 1.');
		expect(hsk1.querySelector('[data-part="fill"]')).toBeNull();
		expect(hsk1.querySelector('img')?.className).toContain('grayscale');
	});

	it('fresh learner shows Chưa có cái nào, Thử mở 3 rows, Còn lại 6 rows, no Đã có', async () => {
		// Arrange
		current = fresh();

		// Act
		const el = await mountPage(user);

		// Assert
		expect(el.textContent).toContain('Chưa có cái nào. Cái đầu tiên gần ngay trước mắt rồi!');
		expect(headings(el)).toEqual(['Thử mở 3 cái này trước', 'Còn lại']);
		expect(el.textContent).toContain('Gần nhất, làm một chút là có.');
		expect(el.textContent).toContain('Để dành cho sau này.');
		expect(section(el, 'Thử mở 3 cái này trước').querySelectorAll('li[data-id]')).toHaveLength(3);
		expect(section(el, 'Còn lại').querySelectorAll('li[data-id]')).toHaveLength(6);
	});

	it('all nine earned shows Đủ bộ rồi and no locked section', async () => {
		// Arrange
		current = full();

		// Act
		const el = await mountPage(user);

		// Assert
		expect(el.querySelector('h1')?.textContent).toBe('Có 9/9 huy hiệu');
		expect(el.textContent).toContain('Đủ bộ rồi, đỉnh của chóp!');
		expect(headings(el)).toEqual(['Đã có']);
		expect(el.querySelectorAll('li[data-id]')).toHaveLength(0);
	});

	it('published state with a third badge re-renders Có 3/9 huy hiệu', async () => {
		// Arrange
		current = reference();
		const el = await mountPage(user);

		// Act
		publish({
			...reference(),
			badges: { ...reference().badges, streak30: '2026-11-01T05:00:00Z' }
		});
		await settle();

		// Assert
		expect(el.querySelector('h1')?.textContent).toBe('Có 3/9 huy hiệu');
		expect(section(el, 'Đã có').querySelectorAll('[data-id]')).toHaveLength(3);
	});

	it('back link points at /me and every cell and row is a button', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		const back = el.querySelector('a')!;
		expect(back.getAttribute('href')).toMatch(/\/me$/);
		expect(back.getAttribute('aria-label')).toBe('Quay lại');
		const buttons = [...el.querySelectorAll('button')];
		expect(buttons).toHaveLength(9);
		expect(buttons.every((b) => b.type === 'button')).toBe(true);
		expect(section(el, 'Đã có').querySelectorAll('button[data-id]')).toHaveLength(2);
		expect(el.querySelectorAll('li[data-id] > button')).toHaveLength(7);
	});

	it('Given_Reference_Then_BamSubLines', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		expect(section(el, 'Đã có').textContent).toContain('Bấm vào để xem hoặc khoe với bạn bè.');
		expect(section(el, 'Sắp mở').textContent).toContain('Bấm vào để xem cách mở.');
		expect(el.textContent).not.toContain('Chạm');
	});

	it('Given_Cell_When_Click_Then_EarnedSheet18_10', async () => {
		// Arrange
		const el = await mountPage(user);

		// Act
		await tap(cell(el, 'streak7'));

		// Assert
		expect(dialog()?.querySelector('h2')?.textContent).toBe('Chuỗi 7 ngày');
		expect(dialog()?.textContent).toContain('Học 7 ngày liền, không bỏ buổi nào.');
		expect(dialog()?.textContent).toContain('Đã có từ ngày 18/10');
		expect(share()).toBeDefined();
	});

	it('Given_Row_When_Click_Then_At12of30', async () => {
		// Arrange
		const el = await mountPage(user);

		// Act
		await tap(rowButton(el, 'streak30'));

		// Assert
		expect(dialog()?.textContent).toContain('Đang ở 12/30');
		expect(share()).toBeUndefined();
	});

	it('Given_Open_When_Escape_Then_ClosedFocusOnRow', async () => {
		// Arrange
		const el = await mountPage(user);
		await tap(rowButton(el, 'streak30'));

		// Act
		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
		await settle();

		// Assert
		expect(dialog()).toBeNull();
		expect(document.activeElement).toBe(rowButton(el, 'streak30'));
	});

	it('Given_OpenStreak30_When_PublishEarned_Then_EarnedSheet', async () => {
		// Arrange
		const el = await mountPage(user);
		await tap(rowButton(el, 'streak30'));

		// Act
		publish({
			...reference(),
			badges: { ...reference().badges, streak30: '2026-11-01T05:00:00Z' }
		});
		await settle();

		// Assert
		expect(dialog()?.querySelector('h2')?.textContent).toBe('Chuỗi 30 ngày');
		expect(dialog()?.textContent).toContain('Đã có từ ngày');
		expect(share()).toBeDefined();
	});

	it('Given_Share_When_WriteResolves_Then_LinkAndCopiedToast', async () => {
		// Arrange
		const el = await mountPage(user);
		await tap(cell(el, 'streak7'));

		// Act
		await tap(share()!);

		// Assert
		expect(writeText).toHaveBeenCalledWith(`${location.origin}/u/linh?badge=streak7`);
		expect(toast()).toBe('Đã sao chép link');
	});

	it('Given_Share_When_WriteRejects_Then_FailToast', async () => {
		// Arrange
		writeText.mockRejectedValue(new Error('denied'));
		const el = await mountPage(user);
		await tap(cell(el, 'streak7'));

		// Act
		await tap(share()!);

		// Assert
		expect(toast()).toBe('Chưa sao chép được, thử lại nhé');
	});

	it('Given_NoHandleRow_When_Share_Then_FailToastNoWriteAndReread', async () => {
		// Arrange
		handleRow.mockResolvedValue({ data: null, error: null });
		const el = await mountPage(user);
		await tap(cell(el, 'streak7'));
		expect(handleRow).toHaveBeenCalledTimes(1);

		// Act
		await tap(share()!);

		// Assert
		expect(toast()).toBe('Chưa sao chép được, thử lại nhé');
		expect(writeText).not.toHaveBeenCalled();
		expect(handleRow).toHaveBeenCalledTimes(2);
	});

	it('first section is not first-child so it keeps its top rule', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(user);

		// Assert
		const sections = [...el.querySelectorAll('section')];
		expect(sections.length).toBeGreaterThan(0);
		expect(sections[0].matches(':first-child')).toBe(false);
		expect(sections[0].parentElement).toBe(el.querySelector('h1')!.closest('div')!.parentElement);
	});

	it('no session renders the top bar and no summary', async () => {
		// Arrange
		current = reference();

		// Act
		const el = await mountPage(null);

		// Assert
		expect(el.textContent).toContain('Huy hiệu');
		expect(el.querySelector('a')).not.toBeNull();
		expect(el.querySelector('h1')).toBeNull();
		expect(el.querySelectorAll('section')).toHaveLength(0);
	});
});
