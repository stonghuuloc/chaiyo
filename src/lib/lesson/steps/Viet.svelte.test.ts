import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mounted } from '../../../test/FakeVietStrokes.svelte';
import type { Answer, Cta } from '../types';
import Viet, { type Step } from './Viet.svelte';

vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../test/FakeVietStrokes.svelte')
);

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
let cta: Cta | undefined;
let calls: (Answer | undefined)[] = [];

const stepOf = (word = '你', again = false): Step => ({
	kind: 'viet',
	id: again ? `practice:viet:${word}#again` : `practice:viet:${word}`,
	word,
	pinyin: 'nǐ',
	nghia: 'bạn',
	again
});

const mountViet = (step: Step) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Viet, {
		target,
		props: {
			step,
			mode: 'feedback',
			last: false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	});
	flushSync();
};

const part = (p: string) => target?.querySelector<HTMLElement>(`[data-part="${p}"]`) ?? null;
const strokes = () => mounted[mounted.length - 1];
const need = <T>(v: T | null | undefined): T => {
	if (v == null) throw new Error('missing test value');
	return v;
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = cta = undefined;
	calls = [];
	mounted.length = 0;
});

describe('Viet step', () => {
	it('Given_Step_When_Mount_Then_PinyinAndNghiaNoHanzi', () => {
		// Arrange / Act
		mountViet(stepOf());

		// Assert
		expect(part('viet-pinyin')?.textContent).toBe('nǐ');
		expect(part('viet-nghia')?.textContent).toBe('bạn');
		expect(strokes().outline).toBe(false);
		expect(strokes().mode).toBe('quiz');
		const copy = need(target).cloneNode(true) as HTMLElement;
		copy.querySelector('[data-part="fake-strokes"]')?.remove();
		expect(copy.textContent).not.toContain('你');
		expect(need(cta).disabled).toBe(true);
	});

	it('Given_CleanWrite_When_Complete_Then_VietDungAndTiep', () => {
		// Arrange
		mountViet(stepOf());

		// Act
		strokes().oncomplete?.({ mistakes: 0 });
		flushSync();

		// Assert
		expect(part('verdict')?.textContent).toContain('Viết đúng.');
		expect(need(cta).label).toBe('Tiếp');
		expect(need(cta).disabled).toBe(false);
		need(cta).onclick();
		expect(calls[0]).toMatchObject({
			questionId: 'practice:viet:你',
			pick: '0',
			correct: true,
			card: { word: '你', skill: 'viet' }
		});
	});

	it('Given_Unsure_When_Tap_Then_MissAnswer', () => {
		// Arrange
		mountViet(stepOf());

		// Act
		part('unsure')?.click();
		flushSync();

		// Assert
		expect(part('verdict')?.textContent).toContain('Chưa đúng. Chữ này sẽ quay lại cuối lượt');
		expect(need(cta).disabled).toBe(false);
		need(cta).onclick();
		expect(calls[0]).toMatchObject({ correct: false, card: { word: '你', skill: 'viet' } });
	});

	it('Given_TwoChars_When_FirstComplete_Then_SecondCharShown', () => {
		// Arrange
		mountViet(stepOf('你好'));
		expect(strokes().char).toBe('你');

		// Act
		strokes().oncomplete?.({ mistakes: 2 });
		flushSync();

		// Assert
		expect(strokes().char).toBe('好');
		expect(need(cta).disabled).toBe(true);
		strokes().oncomplete?.({ mistakes: 2 });
		flushSync();
		expect(part('verdict')?.textContent).toContain('Chưa đúng.');
		need(cta).onclick();
		expect(calls[0]).toMatchObject({ pick: '4', correct: false });
	});

	it('Given_AgainMiss_When_Verdict_Then_NoReturnPromise', () => {
		// Arrange
		mountViet(stepOf('你', true));

		// Act
		strokes().oncomplete?.({ mistakes: 5 });
		flushSync();

		// Assert
		expect(part('again')?.textContent).toContain('gặp lại');
		expect(part('verdict')?.textContent).toContain('Chưa đúng.');
		expect(part('verdict')?.textContent).not.toContain('quay lại');
	});

	it('Given_FailingLoader_When_Mount_Then_NullAnswer', () => {
		// Arrange
		mountViet(stepOf());

		// Act
		strokes().onerror?.();
		flushSync();

		// Assert
		expect(need(cta).disabled).toBe(false);
		need(cta).onclick();
		expect(calls[0]).toMatchObject({ correct: null });
	});

	it('Given_Peek_When_CleanComplete_Then_Miss', () => {
		// Arrange
		mountViet(stepOf());

		// Act
		strokes().onpeek?.();
		strokes().oncomplete?.({ mistakes: 0 });
		flushSync();
		need(cta).onclick();

		// Assert
		expect(calls[0]).toMatchObject({ pick: '0', correct: false });
	});
});
