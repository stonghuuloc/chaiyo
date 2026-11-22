import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GateResult from './GateResult.svelte';
import type { ResultView, ReviewRow } from './result';

const PASS: ResultView = {
	pct: 90,
	right: 9,
	of: 10,
	pass: true,
	best: 90,
	n: 1,
	line: 'Đã mở Bài 2 · +1 ngày chuỗi',
	art: 'b1-pass'
};
const FAIL: ResultView = {
	...PASS,
	pct: 60,
	right: 6,
	pass: false,
	best: 70,
	line: 'Gần được rồi. Cần 80% để mở Bài 2.',
	art: 'b1-fail'
};
const ROW: ReviewRow = {
	id: 't1',
	prompt: '没关系',
	pick: 'měi',
	right: '没关系',
	pinyin: [
		{ text: 'méi', bold: true },
		{ text: 'guānxi', bold: false }
	]
};

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const mountResult = (view: ResultView, rows: ReviewRow[] = []) => {
	const onretry = vi.fn();
	const onleave = vi.fn();
	target = document.createElement('div');
	document.body.append(target);
	app = mount(GateResult, { target, props: { view, rows, lesson: 'h1-01', onretry, onleave } });
	flushSync();
	const root = target;
	return {
		root,
		onretry,
		onleave,
		part: (p: string) => root.querySelector<HTMLElement>(`[data-part="${p}"]`),
		text: () => root.textContent ?? '',
		cta: () => root.querySelector<HTMLElement>('[data-part="cta"] :is(a, button)')
	};
};

beforeEach(() => {
	vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
	vi.stubGlobal('requestAnimationFrame', () => 0);
	vi.stubGlobal('cancelAnimationFrame', () => {});
	vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
		scale: () => {}
	} as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const confetti = () => document.querySelector('[data-testid="confetti"]');

describe('GateResult', () => {
	it('Given_Pass_When_250ms_Then_ConfettiPassArtHomeCta', () => {
		// Arrange
		const v = mountResult(PASS);
		expect(confetti()).toBe(null);

		// Act
		vi.advanceTimersByTime(250);

		// Assert
		expect(confetti()).not.toBe(null);
		expect(v.part('art')?.getAttribute('src')).toMatch(/b1-pass\.webp$/);
		expect(v.part('pct')?.textContent).toBe('90%');
		expect(v.part('score')?.textContent).toBe('9/10 câu đúng · cần 80%');
		expect(v.part('line')?.textContent?.trim()).toBe('Đã mở Bài 2 · +1 ngày chuỗi');
		expect(v.cta()?.textContent?.trim()).toBe(m.gate_result_home());
		expect(v.cta()?.getAttribute('href')).toBe('/today');
		expect(v.text()).not.toContain(m.gate_result_retry());
		expect(v.text()).toContain('Kết quả · Bài 1');
	});

	it('Given_Pass_When_Unmount_Then_ConfettiStopped', () => {
		// Arrange
		mountResult(PASS);
		vi.advanceTimersByTime(250);

		// Act
		if (app) unmount(app);
		app = undefined;

		// Assert
		expect(confetti()).toBe(null);
	});

	it('Given_PassNoLine_When_Render_Then_NoLine', () => {
		// Arrange
		const view = { ...PASS, line: null };

		// Act
		const v = mountResult(view);

		// Assert
		expect(v.part('line')).toBe(null);
	});

	it('Given_Fail_When_Retry_Then_NoConfettiFailArtOnretry', () => {
		// Arrange
		const v = mountResult(FAIL);
		vi.advanceTimersByTime(1000);

		// Act
		v.cta()?.click();
		flushSync();

		// Assert
		expect(confetti()).toBe(null);
		expect(v.part('art')?.getAttribute('src')).toMatch(/b1-fail\.webp$/);
		expect(v.cta()?.textContent?.trim()).toBe(m.gate_result_retry());
		expect(v.part('line')?.textContent?.trim()).toBe('Gần được rồi. Cần 80% để mở Bài 2.');
		expect(v.onretry).toHaveBeenCalledOnce();
	});

	it('Given_Fail_When_Back_Then_OnleaveAndHubHref', () => {
		// Arrange
		const v = mountResult(FAIL);
		const back = v.part('back')!;
		back.addEventListener('click', (e) => e.preventDefault());

		// Act
		back.click();

		// Assert
		expect(back.getAttribute('href')).toBe('/lesson/h1-01');
		expect(v.onleave).toHaveBeenCalledOnce();
	});

	it('Given_Best70_When_Render_Then_BestLine', () => {
		// Arrange
		const view = FAIL;

		// Act
		const v = mountResult(view);

		// Assert
		expect(v.part('best')?.textContent).toBe('Điểm cao nhất: 70%');
		expect(v.part('meter')?.querySelector('i')?.getAttribute('style')).toContain('width: 60%');
	});

	it('Given_OneWrong_When_Render_Then_CountTitleAndStruckPick', () => {
		// Arrange
		const rows = [ROW];

		// Act
		const v = mountResult(FAIL, rows);

		// Assert
		expect(v.part('wrong-title')?.textContent).toBe('Câu chưa đúng (1)');
		expect(v.root.querySelectorAll('[data-part="row"]')).toHaveLength(1);
		expect(v.root.querySelector('s [data-part="pick"]')?.textContent).toBe('měi');
		expect(v.part('right')?.textContent).toBe('没关系');
		expect(v.part('pinyin')?.querySelector('b')?.textContent).toBe('méi');
		expect(v.part('pinyin')?.textContent).toBe('méi guānxi');
		expect(v.part('clean')).toBe(null);
	});

	it('Given_NoWrong_When_Render_Then_CleanLine', () => {
		// Arrange
		const rows: ReviewRow[] = [];

		// Act
		const v = mountResult(PASS, rows);

		// Assert
		expect(v.part('wrong-title')?.textContent).toBe('Câu chưa đúng');
		expect(v.part('clean')?.textContent).toBe('Không sai câu nào.');
	});
});
