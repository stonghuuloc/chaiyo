import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { LessonStep } from './steps';
import StepRunner from './StepRunner.svelte';

const steps: LessonStep[] = [
	{
		kind: 'choice',
		id: 'q0',
		ask: 'Chọn nghĩa',
		title: 'Câu 1',
		options: ['好', '你'],
		answer: '好'
	},
	{
		kind: 'choice',
		id: 'q1',
		ask: 'Chọn nghĩa',
		title: 'Câu 2',
		options: ['好', '你'],
		answer: '好'
	}
];

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountRunner = (onfinish: () => void = () => {}) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(StepRunner, {
		target,
		props: {
			steps,
			mode: 'feedback',
			exit: '/today',
			lesson: 'h1-01',
			section: 'dev',
			contentSha: 'x',
			onfinish
		}
	}) as Record<string, unknown>;
	flushSync();
	return {
		options: () => [...target!.querySelectorAll<HTMLButtonElement>('.body button')],
		cta: () => target!.querySelector<HTMLButtonElement>('.actions button')!,
		segments: () =>
			[...target!.querySelectorAll('[data-seg] i')].map((i) => i.getAttribute('data-on')),
		counter: () => target!.querySelector('.top span')!.textContent
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('StepRunner', () => {
	it('Given_FirstStep_When_Render_Then_CtaDisabledAndCounterFirst', () => {
		// Arrange / Act
		const { cta, counter, segments } = mountRunner();

		// Assert
		expect(cta().disabled).toBe(true);
		expect(counter()).toBe('1/2');
		expect(segments()).toEqual(['false', 'false']);
	});

	it('Given_FirstStepAnswered_When_Continue_Then_SecondStepShown', () => {
		// Arrange
		const { options, cta, counter, segments } = mountRunner();
		options()[0].click();
		flushSync();
		cta().click();
		flushSync();

		// Act
		cta().click();
		flushSync();

		// Assert
		expect(counter()).toBe('2/2');
		expect(segments()).toEqual(['true', 'false']);
		expect(target!.textContent).toContain('Câu 2');
	});

	it('Given_LastStepAnswered_When_Continue_Then_FinishCalledOnce', () => {
		// Arrange
		let finished = 0;
		const { options, cta } = mountRunner(() => (finished += 1));

		// Act
		options()[0].click();
		flushSync();
		cta().click();
		flushSync();
		cta().click();
		flushSync();
		options()[0].click();
		flushSync();
		cta().click();
		flushSync();
		cta().click();
		flushSync();

		// Assert
		expect(finished).toBe(1);
	});

	it('Given_PickedStep_When_CtaRendered_Then_CaretFromStepCta', () => {
		// Arrange
		const { options, cta } = mountRunner();
		expect(cta().querySelector('[href="#i-regular-caret-right"]')).toBe(null);

		// Act
		options()[0].click();
		flushSync();

		// Assert
		expect(cta().textContent).toContain(m.lesson_check());
	});
});
