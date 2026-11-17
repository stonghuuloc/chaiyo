import { IDBFactory } from 'fake-indexeddb';
import { flushSync, mount, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import { memoryStore, openLedger, type Input, type Ledger } from '#lib/ledger/index.js';
import { m } from '#lib/paraglide/messages.js';
import { initialState } from '#lib/study/index.js';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
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

const speakSteps: LessonStep[] = [
	{ kind: 'speak', id: 's0', ask: 'Nói · đọc to', title: 'Đọc to câu này', hanzi: '不客气。' },
	{
		kind: 'speak',
		id: 's1',
		ask: 'Nói · trả lời',
		title: 'Bạn gặp cô giáo ở cổng trường. Chào cô.'
	}
];

class FakeContext {
	close = vi.fn(async () => {});
	createAnalyser() {
		return {
			fftSize: 1024,
			getByteTimeDomainData: (buf: Uint8Array) => {
				buf.fill(255);
			}
		};
	}
	createMediaStreamSource() {
		return { connect: () => {} };
	}
}

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
let app: ReturnType<typeof mount> | undefined;

const need = <T>(v: T | null | undefined): T => {
	if (v == null) throw new Error('missing test value');
	return v;
};

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
	});
	flushSync();
	return {
		options: () => [...need(target).querySelectorAll<HTMLButtonElement>('.body button')],
		cta: () => need(need(target).querySelector<HTMLButtonElement>('.actions button')),
		segments: () =>
			[...need(target).querySelectorAll('[data-seg] i')].map((i) => i.getAttribute('data-on')),
		counter: () => need(need(target).querySelector('.top span')).textContent
	};
};

const detach = () => {
	if (app) unmount(app);
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
		expect(need(target).textContent).toContain('Câu 2');
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
		expect(need(target).textContent).toContain('Câu 4');
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

	it('Given_ResumedWithAnsweredStepLater_When_Continue_Then_AnsweredStepSkipped', async () => {
		// Arrange
		let finished = 0;
		const [q0, q1, q2] = six;
		const ledger = await ledgerFor();
		let view = mountRunner(ledger, { steps: [q0, q1, q2] });
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(view.counter()).toBe('2/3'));
		detach();
		view = mountRunner(ledger, { steps: [q1, q0, q2], onfinish: () => (finished += 1) });
		expect(need(target).textContent).toContain('Câu 2');
		expect(view.segments()).toEqual(['false', 'true', 'false']);

		// Act
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(view.counter()).toBe('3/3'));
		const shown = need(target).textContent;
		pickAndCheck(view);
		view.cta().click();
		await vi.waitFor(() => expect(finished).toBe(1));

		// Assert
		expect(shown).toContain('Câu 3');
		expect(shown).not.toContain('Câu 1');
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(runs[0].answers).toEqual({ q0: true, q1: true, q2: true });
		expect(runs[0].closed).toBe(true);
	});
});

describe('StepRunner hold CTA', () => {
	let getUserMedia: Mock;

	const mountHold = async (onfinish: () => void = () => {}) => {
		const ledger = await ledgerFor();
		return { ...mountRunner(ledger, { steps: speakSteps, onfinish }), ledger };
	};

	const settle = async () => {
		await vi.advanceTimersByTimeAsync(0);
		flushSync();
	};

	// the ledger write settles on real timers, off the faked clock
	const realTick = async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));
		flushSync();
	};

	const holdCta = () => target!.querySelector<HTMLButtonElement>('.actions button')!;

	const counter = () => target!.querySelector('.top span')!.textContent;

	const down = async () => {
		holdCta().dispatchEvent(new Event('pointerdown', { bubbles: true }));
		await settle();
	};

	const up = () => {
		holdCta().dispatchEvent(new Event('pointerup', { bubbles: true }));
		flushSync();
	};

	const key = (type: 'keydown' | 'keyup', repeat = false) =>
		holdCta().dispatchEvent(new KeyboardEvent(type, { key: ' ', repeat, bubbles: true }));

	const holdFor3s = async () => {
		await down();
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();
	};

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
		vi.stubGlobal('AudioContext', FakeContext as unknown as typeof globalThis.AudioContext);
		getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: vi.fn() }] }));
		Object.defineProperty(navigator, 'mediaDevices', {
			configurable: true,
			value: { getUserMedia }
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('Given_HoldCta_When_PointerDownUp_Then_PressReleaseOnce', async () => {
		// Arrange
		await mountHold();

		// Act
		await holdFor3s();
		const held = holdCta().textContent;
		up();

		// Assert
		expect(held).toContain(m.lesson_speak_release());
		expect(getUserMedia).toHaveBeenCalledTimes(1);
		expect(holdCta().textContent).toContain(m.lesson_continue());
	});

	it('Given_HoldCta_When_SpaceDownUp_Then_PressReleaseOnce', async () => {
		// Arrange
		await mountHold();

		// Act
		key('keydown');
		await settle();
		const held = holdCta().textContent;
		await vi.advanceTimersByTimeAsync(3_100);
		flushSync();
		key('keyup');
		flushSync();

		// Assert
		expect(held).toContain(m.lesson_speak_release());
		expect(getUserMedia).toHaveBeenCalledTimes(1);
		expect(holdCta().textContent).toContain(m.lesson_continue());
	});

	it('Given_HoldCta_When_KeyRepeat_Then_PressOnce', async () => {
		// Arrange
		await mountHold();

		// Act
		key('keydown');
		await settle();
		key('keydown', true);
		key('keydown', true);
		await settle();

		// Assert
		expect(getUserMedia).toHaveBeenCalledTimes(1);
	});

	it('Given_HoldReleased_When_TrailingClick_Then_NotAdvancedUntilSecondTap', async () => {
		// Arrange
		await mountHold();
		await holdFor3s();
		up();

		// Act
		holdCta().click();
		await realTick();
		const afterTrailing = counter();
		holdCta().click();
		await vi.waitFor(() => expect(counter()).toBe('2/2'));

		// Assert
		expect(afterTrailing).toBe('1/2');
	});

	it('Given_BlockedMic_When_ReleaseClick_Then_SkipCopyStays', async () => {
		// Arrange
		getUserMedia.mockImplementation(async () => {
			throw new DOMException('denied', 'NotAllowedError');
		});
		await mountHold();
		holdCta().dispatchEvent(new Event('pointerdown', { bubbles: true }));
		await settle();

		// Act
		up();
		holdCta().click();
		await realTick();

		// Assert
		expect(target!.textContent).toContain(m.lesson_speak_blocked());
		expect(holdCta().textContent).toContain(m.lesson_speak_skip());
		expect(counter()).toBe('1/2');
	});

	it('Given_BlockedMic_When_SpaceUp_Then_SkipCopyStays', async () => {
		// Arrange
		getUserMedia.mockImplementation(async () => {
			throw new DOMException('denied', 'NotAllowedError');
		});
		await mountHold();
		key('keydown');
		await settle();

		// Act
		key('keyup');
		flushSync();
		holdCta().click();
		await realTick();

		// Assert
		expect(target!.textContent).toContain(m.lesson_speak_blocked());
		expect(holdCta().textContent).toContain(m.lesson_speak_skip());
		expect(counter()).toBe('1/2');
	});

	it('Given_HoldEndedOffButton_When_NextTap_Then_Advances', async () => {
		// Arrange
		const { ledger } = await mountHold();
		await holdFor3s();
		up();

		// Act
		holdCta().dispatchEvent(new Event('pointerdown', { bubbles: true }));
		holdCta().dispatchEvent(new Event('pointerup', { bubbles: true }));
		holdCta().click();

		// Assert
		await vi.waitFor(() => expect(counter()).toBe('2/2'));
		const runs = Object.values(ledger.state().runs);
		expect(runs).toHaveLength(1);
		expect(runs[0].answers).toEqual({ s0: false });
	});
});
