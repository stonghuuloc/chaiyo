import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Input, type Ledger } from '#lib/ledger/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

const six: LessonStep[] = Array.from({ length: 6 }, (_, i) => ({
	kind: 'choice',
	id: `q${i}`,
	ask: 'Chọn nghĩa',
	title: `Câu ${i + 1}`,
	options: ['好', '你'],
	answer: '好'
}));

const ledgerFor = () =>
	openLedger({
		initial: initialState({ curriculum: CURRICULUM }),
		store: memoryStore(),
		idb: new IDBFactory()
	});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

type Runner = {
	options: () => HTMLButtonElement[];
	cta: () => HTMLButtonElement;
	segments: () => (string | null)[];
	counter: () => string | null;
};

const mountRunner = (
	ledger: Ledger,
	o: { steps?: LessonStep[]; onfinish?: () => void } = {}
): Runner => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(StepRunner, {
		target,
		props: {
			steps: o.steps ?? steps,
			mode: 'feedback',
			exit: '/today',
			lesson: 'h1-01',
			section: 'words',
			contentSha: 'sha1',
			ledger,
			onfinish: o.onfinish ?? (() => {})
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

const detach = () => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	flushSync();
};

const pickAndCheck = (view: Runner) => {
	view.options()[0].click();
	flushSync();
	view.cta().click();
	flushSync();
};

afterEach(detach);

describe('StepRunner', () => {
	it('Given_FirstStep_When_Render_Then_CtaDisabledAndCounterFirst', async () => {
		// Arrange
		const ledger = await ledgerFor();

		// Act
		const { cta, counter, segments } = mountRunner(ledger);

		// Assert
		expect(cta().disabled).toBe(true);
		expect(counter()).toBe('1/2');
		expect(segments()).toEqual(['false', 'false']);
	});

	it('Given_FirstStepAnswered_When_Continue_Then_SecondStepShown', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const view = mountRunner(ledger);
		pickAndCheck(view);

		// Act
		view.cta().click();
		await vi.waitFor(() => expect(view.counter()).toBe('2/2'));

		// Assert
		expect(view.segments()).toEqual(['true', 'false']);
		expect(target!.textContent).toContain('Câu 2');
	});

	it('Given_LastStepAnswered_When_Continue_Then_FinishCalledOnce', async () => {
		// Arrange
		let finished = 0;
		const ledger = await ledgerFor();
		const view = mountRunner(ledger, { onfinish: () => (finished += 1) });

		// Act
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(view.counter()).toBe('2/2'));
		pickAndCheck(view);
		view.cta().click();
		view.cta().click();
		await vi.waitFor(() => expect(finished).toBe(1));

		// Assert
		expect(finished).toBe(1);
	});

	it('Given_PickedStep_When_CtaRendered_Then_CaretFromStepCta', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const { options, cta } = mountRunner(ledger);
		expect(cta().querySelector('[href="#i-regular-caret-right"]')).toBe(null);

		// Act
		options()[0].click();
		flushSync();

		// Assert
		expect(cta().textContent).toContain(m.lesson_check());
	});

	it('Given_TwoSteps_When_BothAnswered_Then_OneClosedRunWithTwoAnswers', async () => {
		// Arrange
		let finished = 0;
		const ledger = await ledgerFor();
		const view = mountRunner(ledger, { onfinish: () => (finished += 1) });

		// Act
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(view.counter()).toBe('2/2'));
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(finished).toBe(1));

		// Assert
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(runs[0].answers).toEqual({ q0: true, q1: true });
		expect(runs[0].closed).toBe(true);
		expect(runs[0].step).toMatchObject({ lesson: 'h1-01', section: 'words', of: 2 });
	});

	it('Given_RecordInFlight_When_ContinueTwice_Then_OneAttempt', async () => {
		// Arrange
		const ledger = await ledgerFor();
		const gate = Promise.withResolvers<void>();
		const slow: Ledger = {
			...ledger,
			record(input: Input) {
				return gate.promise.then(() => ledger.record(input));
			}
		};
		const view = mountRunner(slow);
		pickAndCheck(view);

		// Act
		view.cta().click();
		view.cta().click();
		gate.resolve();
		await vi.waitFor(() => expect(view.counter()).toBe('2/2'));

		// Assert
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(Object.keys(runs[0].answers)).toEqual(['q0']);
	});

	it('Given_LastStep_When_ContinueTwice_Then_OneAttemptAndFinishOnce', async () => {
		// Arrange
		let finished = 0;
		const ledger = await ledgerFor();
		const view = mountRunner(ledger, {
			steps: [steps[0]],
			onfinish: () => (finished += 1)
		});
		pickAndCheck(view);

		// Act
		view.cta().click();
		view.cta().click();
		await vi.waitFor(() => expect(finished).toBe(1));
		view.cta().click();

		// Assert
		expect(finished).toBe(1);
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(runs[0].answers).toEqual({ q0: true });
		expect(runs[0].closed).toBe(true);
	});

	it('Given_RecordRejectsOnce_When_Continue_Then_StaysThenAdvancesOnRetry', async () => {
		// Arrange
		const ledger = await ledgerFor();
		let calls = 0;
		const flaky: Ledger = {
			...ledger,
			record(input: Input) {
				calls += 1;
				if (calls === 1) return Promise.reject(new Error('offline'));
				return ledger.record(input);
			}
		};
		const view = mountRunner(flaky);
		pickAndCheck(view);

		// Act
		view.cta().click();
		await vi.waitFor(() => expect(calls).toBe(1));
		expect(view.counter()).toBe('1/2');
		await vi.waitFor(() => {
			view.cta().click();
			return expect(calls).toBe(2);
		});
		await vi.waitFor(() => expect(view.counter()).toBe('2/2'));

		// Assert
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(Object.keys(runs[0].answers)).toEqual(['q0']);
	});

	it('Given_ThreeOfSixAnswered_When_Remount_Then_Counter4of6', async () => {
		// Arrange
		const ledger = await ledgerFor();
		let view = mountRunner(ledger, { steps: six });
		for (let i = 0; i < 3; i += 1) {
			pickAndCheck(view);
			view.cta().click();
			await vi.waitFor(() => expect(view.counter()).toBe(`${i + 2}/6`));
		}
		detach();

		// Act
		view = mountRunner(ledger, { steps: six });

		// Assert
		expect(view.counter()).toBe('4/6');
		expect(view.segments()).toEqual(['true', 'true', 'true', 'false', 'false', 'false']);
		expect(target!.textContent).toContain('Câu 4');
	});

	it('Given_Resumed_When_LastThreeAnswered_Then_RunClosedWithSix', async () => {
		// Arrange
		let finished = 0;
		const ledger = await ledgerFor();
		let view = mountRunner(ledger, { steps: six, onfinish: () => (finished += 1) });
		for (let i = 0; i < 3; i += 1) {
			pickAndCheck(view);
			view.cta().click();
			await vi.waitFor(() => expect(view.counter()).toBe(`${i + 2}/6`));
		}
		detach();
		view = mountRunner(ledger, { steps: six, onfinish: () => (finished += 1) });

		// Act
		for (let i = 0; i < 3; i += 1) {
			pickAndCheck(view);
			view.cta().click();
			await vi.waitFor(() => expect(view.counter()).toBe(`${Math.min(5 + i, 6)}/6`));
		}
		await vi.waitFor(() => expect(finished).toBe(1));

		// Assert
		const state = ledger.state();
		const runs = Object.values(state.runs);
		expect(runs).toHaveLength(1);
		expect(runs[0].closed).toBe(true);
		expect(Object.keys(runs[0].answers)).toHaveLength(6);
		expect(state.lessons['h1-01'].done).toContain('words');
	});
});
