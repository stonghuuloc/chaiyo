import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
