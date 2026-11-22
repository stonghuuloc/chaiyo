import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Answer, Cta, Mode } from '../types';
import Choice, { type Step } from './Choice.svelte';

const audio = vi.hoisted(() => ({
	player: {
		play: vi.fn(async () => true),
		url: (key: string) => `/a/${key}.mp3`,
		element: () => null
	}
}));
vi.mock('#lib/audio/index.js', () => audio);

const step: Step = {
	kind: 'choice',
	id: 'q1',
	ask: 'Chọn nghĩa',
	title: 'Tốt',
	options: ['你', '好', '我'],
	answer: '好'
};

let target: HTMLDivElement | undefined;
let app: ReturnType<typeof mount> | undefined;

const need = <T>(v: T | null | undefined): T => {
	if (v == null) throw new Error('missing test value');
	return v;
};

const mountChoice = (props: { mode?: Mode; last?: boolean; step?: Step } = {}) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Choice, {
		target,
		props: {
			step: props.step ?? step,
			mode: props.mode ?? 'feedback',
			last: props.last ?? false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	});
	flushSync();
	return {
		options: () => [...need(target).querySelectorAll<HTMLButtonElement>('button')],
		cta: () => need(cta),
		calls
	};
};

afterEach(() => {
	vi.restoreAllMocks();
	if (app) unmount(app);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('Choice', () => {
	it('Given_StepWithClip_When_Mount_Then_TalkingCastPlaysTheClipOnce', async () => {
		// Arrange
		audio.player.play.mockClear();
		const withClip: Step = { ...step, title: '', audio: 'words/abc' };

		// Act
		mountChoice({ step: withClip });
		await vi.waitFor(() => expect(target!.querySelector('[data-part="cast"] img')).not.toBeNull());

		// Assert
		expect(audio.player.play).toHaveBeenCalledTimes(1);
		expect(audio.player.play).toHaveBeenCalledWith('words/abc');
		expect(target!.querySelector('h2')).toBeNull();
	});

	it('Given_StepWithoutClip_When_Mount_Then_NoCastAndNoPlay', () => {
		// Arrange
		audio.player.play.mockClear();

		// Act
		mountChoice();

		// Assert
		expect(target!.querySelector('[data-part="cast"]')).toBeNull();
		expect(audio.player.play).not.toHaveBeenCalled();
	});

	it('Given_FeedbackWrongPick_When_Check_Then_MarksVerdictAndReviewHint', () => {
		// Arrange
		const { options, cta } = mountChoice();
		expect(cta().label).toBe(m.lesson_check());
		expect(cta().disabled).toBe(true);

		// Act
		options()[0].click();
		flushSync();
		cta().onclick();
		flushSync();

		// Assert
		const buttons = options();
		expect(buttons[0].getAttribute('data-mark')).toBe('wrong');
		expect(buttons[1].getAttribute('data-mark')).toBe('right');
		expect(buttons.every((b) => b.disabled)).toBe(true);
		expect(need(target).textContent).toContain(m.lesson_wrong());
		expect(cta().label).toBe(m.lesson_continue());
		expect(cta().hint).toBe(m.lesson_review_hint());
	});

	it('Given_FeedbackRightPick_When_Check_Then_RightVerdictAndNoHint', () => {
		// Arrange
		const { options, cta } = mountChoice();
		options()[1].click();
		flushSync();
		expect(cta().disabled).toBe(false);

		// Act
		cta().onclick();
		flushSync();

		// Assert
		expect(options()[1].getAttribute('data-mark')).toBe('right');
		expect(need(target).textContent).toContain(m.lesson_right());
		expect(cta().hint).toBe('');
	});

	it('Given_Graded_When_Continue_Then_NextGetsTheAnswer', () => {
		// Arrange
		const { options, cta, calls } = mountChoice();
		options()[0].click();
		flushSync();
		cta().onclick();
		flushSync();

		// Act
		cta().onclick();

		// Assert
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ questionId: 'q1', pick: '你', correct: false });
		expect(need(calls[0]).ms).toBeGreaterThanOrEqual(0);
	});

	it('Given_FeedbackReadAfterCheck_When_Continue_Then_MsStopsAtCheck', () => {
		// Arrange
		const now = vi.spyOn(performance, 'now').mockReturnValue(1000);
		const { options, cta, calls } = mountChoice();
		options()[1].click();
		flushSync();
		now.mockReturnValue(3000);
		cta().onclick();
		flushSync();
		now.mockReturnValue(33000);

		// Act
		cta().onclick();

		// Assert
		expect(calls[0]).toMatchObject({ questionId: 'q1', correct: true, ms: 2000 });
	});

	it('Given_NoPick_When_CtaPressed_Then_NothingHappens', () => {
		// Arrange
		const { cta, calls } = mountChoice();

		// Act
		cta().onclick();
		flushSync();

		// Assert
		expect(calls).toHaveLength(0);
		expect(cta().label).toBe(m.lesson_check());
	});

	it('Given_TestMode_When_PickThenNext_Then_AnswerSentWithoutGrading', () => {
		// Arrange
		const { options, cta, calls } = mountChoice({ mode: 'test' });
		expect(cta().label).toBe(m.lesson_next_question());
		expect(cta().caret).toBe(true);

		// Act
		options()[0].click();
		flushSync();
		cta().onclick();

		// Assert
		expect(calls).toHaveLength(1);
		expect(calls[0]).toMatchObject({ pick: '你', correct: false });
		expect(options()[1].getAttribute('data-mark')).toBe(null);
	});

	it('Given_TestModeLast_When_CtaRendered_Then_SubmitLabel', () => {
		// Arrange / Act
		const { cta } = mountChoice({ mode: 'test', last: true });

		// Assert
		expect(cta().label).toBe(m.lesson_submit());
	});

	it('Given_TextScript_When_Render_Then_HanziFaceDropped', () => {
		// Arrange / Act
		const { options } = mountChoice({ step: { ...step, script: 'text' } });

		// Assert
		expect(options()[0].className).not.toContain('font-hanzi');
	});

	it('Given_Explain_When_Graded_Then_ExplainWinsOverAnswer', () => {
		// Arrange
		const { options, cta } = mountChoice({ step: { ...step, explain: 'Tốt nghĩa là tốt' } });
		options()[1].click();
		flushSync();

		// Act
		cta().onclick();
		flushSync();

		// Assert
		expect(need(target).textContent).toContain('Tốt nghĩa là tốt');
	});
});
