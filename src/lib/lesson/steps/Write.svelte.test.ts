import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mounted } from '../../../test/FakeWriteStrokes.svelte';
import type { Answer, Cta } from '../types';
import Write, { type Step } from './Write.svelte';

vi.mock(
	'#lib/components/HanziStrokes.svelte',
	() => import('../../../test/FakeWriteStrokes.svelte')
);

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
let cta: Cta | undefined;
let calls: (Answer | undefined)[] = [];

const stepOf = (round: 1 | 2, skipped = new Set<string>()): Step => ({
	kind: 'write',
	id: `write-你-${round}`,
	char: '你',
	round,
	skipped
});

const mountWrite = (step: Step) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Write, {
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

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = cta = undefined;
	calls = [];
	mounted.length = 0;
});

describe('Write step', () => {
	it('Given_Round1_When_Mounted_Then_OutlineOnAndRound1Line', () => {
		// Arrange
		// Act
		mountWrite(stepOf(1));

		// Assert
		expect(part('round')?.textContent).toBe('Lần 1: viết theo nét mờ');
		expect(strokes()).toMatchObject({ char: '你', mode: 'quiz', outline: true });
		expect(cta?.disabled).toBe(true);
		expect(cta?.label).toBe(m.lesson_continue());
	});

	it('Given_Round2_When_Mounted_Then_NoOutlineAndRound2Line', () => {
		// Arrange
		// Act
		mountWrite(stepOf(2));

		// Assert
		expect(part('round')?.textContent).toBe('Lần 2: tự viết, không có nét mờ');
		expect(strokes().outline).toBe(false);
		expect(calls).toEqual([]);
	});

	it('Given_2Mistakes_When_Complete_Then_ShowsNetSaiAndCtaSendsPick2', () => {
		// Arrange
		mountWrite(stepOf(1));

		// Act
		strokes().onprogress?.({ done: 7, total: 7, mistakes: 2 });
		strokes().oncomplete?.({ mistakes: 2 });
		flushSync();
		cta?.onclick();

		// Assert
		expect(part('result')?.textContent?.trim()).toBe('Viết xong · 2 nét sai');
		expect(cta?.disabled).toBe(false);
		expect(calls).toEqual([
			{ questionId: 'write-你-1', pick: '2', correct: true, ms: expect.any(Number) }
		]);
	});

	it('Given_0Mistakes_When_Complete_Then_ShowsKhongSai', () => {
		// Arrange
		mountWrite(stepOf(2));

		// Act
		strokes().oncomplete?.({ mistakes: 0 });
		flushSync();

		// Assert
		expect(part('result')?.textContent?.trim()).toBe('Viết xong · không sai nét nào');
		expect(cta?.disabled).toBe(false);
	});

	it('Given_Finished_When_ProgressRestarts_Then_CtaDisabled', () => {
		// Arrange
		mountWrite(stepOf(1));
		strokes().oncomplete?.({ mistakes: 3 });
		flushSync();

		// Act
		strokes().onprogress?.({ done: 0, total: 7, mistakes: 0 });
		flushSync();

		// Assert
		expect(cta?.disabled).toBe(true);
		expect(part('result')?.textContent?.trim()).toBe('');
	});

	it('Given_RedoneAfterFinish_When_Tiep_Then_SendsLastPassMistakes', () => {
		// Arrange
		mountWrite(stepOf(1));
		strokes().oncomplete?.({ mistakes: 3 });
		strokes().onprogress?.({ done: 0, total: 7, mistakes: 0 });
		strokes().oncomplete?.({ mistakes: 1 });
		flushSync();

		// Act
		cta?.onclick();

		// Assert
		expect(calls[0]?.pick).toBe('1');
	});

	it('Given_Round1_When_Skip_Then_AddsCharAndNextWithoutAnswer', () => {
		// Arrange
		const skipped = new Set<string>();
		mountWrite(stepOf(1, skipped));

		// Act
		part('skip')?.click();
		flushSync();

		// Assert
		expect(part('skip')?.textContent?.trim()).toBe('Bỏ qua chữ này');
		expect([...skipped]).toEqual(['你']);
		expect(calls).toEqual([undefined]);
	});

	it('Given_Round2AndSkipped_When_Mounted_Then_NextCalledOnce', () => {
		// Arrange
		const skipped = new Set(['你']);

		// Act
		mountWrite(stepOf(2, skipped));
		flushSync();

		// Assert
		expect(calls).toEqual([undefined]);
		expect(mounted).toEqual([]);
		expect(part('skip')).toBeNull();
	});
});
