import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { Answer, Cta, Mode } from '../types';
import Order, { type Step } from './Order.svelte';

const step: Step = {
	kind: 'order',
	id: 'q-h1-01-g03',
	ask: 'Câu 3/3',
	title: 'Chào các bạn!',
	tiles: ['们', '你', '好'],
	answer: '你们好'
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountOrder = (props: { mode?: Mode; last?: boolean } = {}) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Order, {
		target,
		props: {
			step,
			mode: props.mode ?? 'feedback',
			last: props.last ?? false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
	return {
		pool: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-tile]')],
		slots: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-slot]')],
		place: (tile: string) => {
			const b = [...target!.querySelectorAll<HTMLButtonElement>('[data-tile]')].find(
				(x) => x.textContent!.trim() === tile
			);
			if (!b) throw new Error(`no tile ${tile}`);
			b.click();
			flushSync();
		},
		cta: () => cta!,
		calls
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('Order', () => {
	it('Given_TwoPlaced_When_Render_Then_CheckDisabledWithHint', () => {
		// Arrange
		const { place, cta, slots } = mountOrder();

		// Act
		place('你');
		place('们');

		// Assert
		expect(slots()[0].textContent!.trim()).toBe('你');
		expect(slots()[1].textContent!.trim()).toBe('们');
		expect(slots()[2].textContent!.trim()).toBe('');
		expect(cta().label).toBe(m.lesson_check());
		expect(cta().disabled).toBe(true);
		expect(cta().hint).toBe(m.grammar_order_hint());
	});

	it('Given_RightOrder_When_Check_Then_RightVerdictAndAnswerReported', () => {
		// Arrange
		const { place, cta, calls } = mountOrder();
		place('你');
		place('们');
		place('好');
		expect(cta().disabled).toBe(false);
		expect(cta().hint).toBe('');

		// Act
		cta().onclick();
		flushSync();

		// Assert
		expect(target!.textContent).toContain(m.lesson_right());
		expect(target!.textContent).toContain('你们好');
		expect(cta().label).toBe(m.lesson_continue());
		cta().onclick();
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({
			questionId: 'q-h1-01-g03',
			pick: '你们好',
			correct: true
		});
		expect(calls[0]!.ms).toBeGreaterThanOrEqual(0);
	});

	it('Given_WrongOrder_When_Check_Then_WrongVerdictShowsAnswer', () => {
		// Arrange
		const { place, cta } = mountOrder();
		place('们');
		place('你');
		place('好');

		// Act
		cta().onclick();
		flushSync();

		// Assert
		expect(target!.textContent).toContain(m.lesson_wrong());
		expect(target!.textContent).toContain('你们好');
		expect(cta().hint).toBe(m.lesson_review_hint());
	});

	it('Given_PlacedTile_When_Tap_Then_ReturnsToPool', () => {
		// Arrange
		const { place, pool, slots } = mountOrder();
		place('们');
		expect(pool().map((b) => b.textContent!.trim())).toEqual(['你', '好']);

		// Act
		slots()[0].click();
		flushSync();

		// Assert
		expect(slots()[0].textContent!.trim()).toBe('');
		expect(pool().map((b) => b.textContent!.trim())).toEqual(['们', '你', '好']);
	});

	it('Given_TestMode_When_Full_Then_NoVerdictAndNextQuestion', () => {
		// Arrange
		const { place, cta, calls } = mountOrder({ mode: 'test' });
		expect(cta().disabled).toBe(true);

		// Act
		place('你');
		place('们');
		place('好');
		cta().onclick();
		flushSync();

		// Assert
		expect(target!.textContent).not.toContain(m.lesson_right());
		expect(target!.textContent).not.toContain(m.lesson_wrong());
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ pick: '你们好', correct: true });
	});
});
