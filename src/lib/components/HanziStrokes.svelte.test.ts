import { flushSync, mount, unmount } from 'svelte';
import type { CharacterJson } from 'hanzi-writer';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { StrokeMode, StrokeProgress } from './hanzi-strokes';
import HanziStrokes from './HanziStrokes.svelte';

const hw = vi.hoisted(() => ({ create: vi.fn() }));

vi.mock('hanzi-writer', () => ({
	default: { create: (...args: unknown[]) => (hw.create as (...a: unknown[]) => unknown)(...args) }
}));

const data: CharacterJson = { strokes: ['M0 0L1 1', 'M1 1L2 2'], medians: [] };

type FakeWriter = {
	quiz: Mock;
	cancelQuiz: Mock;
	showOutline: Mock;
	hideOutline: Mock;
	animateCharacter: Mock;
	hideCharacter: Mock;
	highlightStroke: Mock;
	updateDimensions: Mock;
};

type WriterOptions = {
	onLoadCharDataSuccess?: (d: { strokes: unknown[] }) => void;
	onLoadCharDataError?: () => void;
};

type Props = {
	char?: string;
	mode?: StrokeMode;
	outline?: boolean;
	load?: (char: string) => Promise<CharacterJson>;
	onprogress?: (p: StrokeProgress) => void;
	oncomplete?: (p: { mistakes: number }) => void;
	onerror?: () => void;
};

const makeWriter = (): FakeWriter => ({
	quiz: vi.fn(),
	cancelQuiz: vi.fn(),
	showOutline: vi.fn(() => Promise.resolve()),
	hideOutline: vi.fn(() => Promise.resolve()),
	animateCharacter: vi.fn(() => Promise.resolve()),
	hideCharacter: vi.fn(() => Promise.resolve()),
	highlightStroke: vi.fn(),
	updateDimensions: vi.fn()
});

let writer: FakeWriter;
let options: WriterOptions;
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;
let resized: (() => void) | undefined;

const settle = async () => {
	flushSync();
	for (let i = 0; i < 10; i += 1) await Promise.resolve();
	flushSync();
};

const mountStrokes = async (props: Props = {}) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(HanziStrokes, {
		target,
		props: { char: '你', mode: 'quiz', load: () => Promise.resolve(data), ...props }
	}) as Record<string, unknown>;
	await settle();
	return {
		text: () => target!.textContent ?? '',
		button: (label: string) =>
			[...target!.querySelectorAll('button')].find((b) => b.textContent?.includes(label))!
	};
};

beforeEach(() => {
	writer = makeWriter();
	options = {};
	resized = undefined;
	vi.stubGlobal(
		'ResizeObserver',
		class {
			constructor(cb: () => void) {
				resized = cb;
			}
			observe() {}
			disconnect() {}
		}
	);
	hw.create.mockImplementation((_el: unknown, _char: unknown, o: WriterOptions) => {
		options = o;
		return writer;
	});
});

afterEach(() => {
	vi.unstubAllGlobals();
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('HanziStrokes interaction', () => {
	it('Given_QuizMode_When_DataLoads_Then_CounterShowsTotalAndQuizStarts', async () => {
		// Arrange / Act
		const ui = await mountStrokes();
		options.onLoadCharDataSuccess!({ strokes: data.strokes });

		// Assert
		await settle();
		expect(ui.text()).toContain('nét 0/2');
		expect(writer.quiz).toHaveBeenCalledTimes(1);
	});

	it('Given_QuizRunning_When_StrokeCorrect_Then_CountAdvancesAndProgressEmitted', async () => {
		// Arrange
		const seen: unknown[] = [];
		const ui = await mountStrokes({ onprogress: (p) => seen.push(p) });
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();

		// Act
		const quiz = writer.quiz.mock.calls[0][0];
		quiz.onCorrectStroke({ strokeNum: 0, totalMistakes: 1 });
		await settle();

		// Assert
		expect(ui.text()).toContain('nét 1/2');
		expect(seen.at(-1)).toEqual({ done: 1, total: 2, mistakes: 1 });
	});

	it('Given_Mistake_When_Reported_Then_MistakesCarriedToProgress', async () => {
		// Arrange
		const seen: { mistakes: number }[] = [];
		const ui = await mountStrokes({ onprogress: (p) => seen.push(p) });
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();

		// Act
		writer.quiz.mock.calls[0][0].onMistake({ totalMistakes: 3 });
		await settle();

		// Assert
		expect(seen.at(-1)?.mistakes).toBe(3);
		expect(ui.text()).toContain('nét 0/2');
	});

	it('Given_QuizComplete_When_Done_Then_OncompleteOnceAndHintDisabled', async () => {
		// Arrange
		const done: { mistakes: number }[] = [];
		const ui = await mountStrokes({ oncomplete: (p) => done.push(p) });
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();

		// Act
		writer.quiz.mock.calls[0][0].onComplete({ totalMistakes: 2 });
		await settle();

		// Assert
		expect(done).toEqual([{ mistakes: 2 }]);
		expect(ui.text()).toContain('nét 2/2');
		expect(ui.button('Gợi ý').disabled).toBe(true);
	});

	it('Given_DataError_When_WriterReportsFailure_Then_ErrorCopyAndOnerrorOnce', async () => {
		// Arrange
		const errors: number[] = [];
		const ui = await mountStrokes({ onerror: () => errors.push(1) });

		// Act
		options.onLoadCharDataError!();
		options.onLoadCharDataError!();
		await settle();

		// Assert
		expect(ui.text()).toContain('Chưa tải được nét chữ');
		expect(ui.text()).not.toContain('nét 0/2');
		expect(errors).toHaveLength(1);
	});

	it('Given_Ready_When_DemoPressed_Then_CharacterAnimatedAndQuizRestarted', async () => {
		// Arrange
		const ui = await mountStrokes();
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();

		// Act
		ui.button('Xem mẫu').click();
		await settle();

		// Assert
		expect(writer.hideCharacter).toHaveBeenCalled();
		expect(writer.animateCharacter).toHaveBeenCalled();
		expect(writer.quiz).toHaveBeenCalledTimes(2);
	});

	it('Given_Complete_When_RedoPressed_Then_CountersReset', async () => {
		// Arrange
		const ui = await mountStrokes();
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();
		writer.quiz.mock.calls[0][0].onComplete({ totalMistakes: 2 });
		await settle();

		// Act
		ui.button('Viết lại').click();
		await settle();

		// Assert
		expect(ui.text()).toContain('nét 0/2');
	});

	it('Given_AnimateMode_When_DataLoads_Then_NoQuizAndNoTools', async () => {
		// Arrange / Act
		const ui = await mountStrokes({ mode: 'animate' });
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();

		// Assert
		expect(writer.quiz).not.toHaveBeenCalled();
		expect(ui.text()).not.toContain('nét');
		expect(ui.text()).not.toContain('Xem mẫu');
	});

	it('Given_WriterAddsDocumentListener_When_Unmounted_Then_ListenerRemoved', async () => {
		// Arrange
		const up = vi.fn();
		hw.create.mockImplementation((_el: unknown, _char: unknown, o: WriterOptions) => {
			options = o;
			document.addEventListener('mouseup', up);
			return writer;
		});
		await mountStrokes();
		document.dispatchEvent(new Event('mouseup'));
		expect(up).toHaveBeenCalledTimes(1);

		// Act
		unmount(app as never);
		app = undefined;
		document.dispatchEvent(new Event('mouseup'));

		// Assert
		expect(up).toHaveBeenCalledTimes(1);
	});

	it('Given_PadResized_When_Observed_Then_WriterDimensionsUpdated', async () => {
		// Arrange
		await mountStrokes();
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();
		const pad = target!.querySelector<HTMLElement>('.touch-none')!;
		Object.defineProperty(pad, 'clientWidth', { configurable: true, value: 300 });

		// Act
		resized!();
		resized!();

		// Assert
		expect(writer.updateDimensions).toHaveBeenCalledTimes(1);
		expect(writer.updateDimensions).toHaveBeenCalledWith({ width: 300, height: 300, padding: 24 });
	});

	it('Given_DemoPlaying_When_OutlineToggled_Then_QuizRestartsOnlyAfterDemo', async () => {
		// Arrange
		const demo = Promise.withResolvers<void>();
		writer.animateCharacter.mockReturnValue(demo.promise);
		const props = $state({ outline: true });
		target = document.createElement('div');
		document.body.append(target);
		app = mount(HanziStrokes, {
			target,
			props: {
				char: '你',
				mode: 'quiz',
				load: () => Promise.resolve(data),
				get outline() {
					return props.outline;
				}
			}
		}) as Record<string, unknown>;
		await settle();
		options.onLoadCharDataSuccess!({ strokes: data.strokes });
		await settle();
		[...target.querySelectorAll('button')].find((b) => b.textContent?.includes('Xem mẫu'))!.click();
		await settle();

		// Act
		props.outline = false;
		await settle();
		const duringDemo = writer.quiz.mock.calls.length;
		demo.resolve();
		await settle();

		// Assert
		expect(writer.hideOutline).toHaveBeenCalledTimes(1);
		expect(duringDemo).toBe(1);
		expect(writer.quiz).toHaveBeenCalledTimes(2);
	});
});
