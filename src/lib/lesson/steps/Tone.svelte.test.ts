import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Answer, Cta, Mode } from '../types';
import Tone, { type Step } from './Tone.svelte';

const audio = vi.hoisted(() => ({
	player: {
		play: vi.fn(async () => true),
		url: (key: string) => `/a/${key}.mp3`,
		element: () => null
	}
}));
vi.mock('#lib/audio/index.js', () => audio);

const step: Step = {
	kind: 'tone',
	id: 'q-h1-01-l01',
	ask: 'Nghe và chọn thanh điệu',
	audio: 'words/hao',
	answer: 3,
	syllable: 'hǎo'
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountTone = (s: Step = step, mode: Mode = 'feedback', last = false) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Tone, {
		target,
		props: {
			step: s,
			mode,
			last,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
	return {
		options: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-part="tone-option"]')],
		cta: () => cta!,
		calls
	};
};

const pickAndCheck = (ui: ReturnType<typeof mountTone>, tone: number) => {
	ui.options()[tone - 1].click();
	flushSync();
	ui.cta().onclick();
	flushSync();
	ui.cta().onclick();
	flushSync();
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
});

describe('Tone', () => {
	it('Given_ToneStep_When_Mount_Then_FiveContourOptionsAndClipPlays', async () => {
		// Arrange
		audio.player.play.mockClear();

		// Act
		const { options } = mountTone();
		await vi.waitFor(() => expect(target!.querySelector('[data-part="cast"] img')).not.toBeNull());

		// Assert
		expect(options().map((b) => b.textContent?.trim())).toEqual([
			m.listen_tone_option({ n: 1 }),
			m.listen_tone_option({ n: 2 }),
			m.listen_tone_option({ n: 3 }),
			m.listen_tone_option({ n: 4 }),
			m.listen_tone_neutral()
		]);
		expect(options().every((b) => b.querySelector('svg path'))).toBe(true);
		expect(audio.player.play).toHaveBeenCalledWith('words/hao');
	});

	it('Given_NeutralToneStep_When_PickFifth_Then_RightAnswer', () => {
		// Arrange
		const ui = mountTone({ ...step, answer: 5, syllable: 'ma' });

		// Act
		ui.options()[4].click();
		flushSync();
		ui.cta().onclick();
		flushSync();

		// Assert
		expect(ui.options()[4].getAttribute('data-mark')).toBe('right');
		expect(target!.textContent).toContain(m.lesson_right());
		ui.cta().onclick();
		expect(ui.calls).toEqual([expect.objectContaining({ pick: '5', correct: true })]);
	});

	it('Given_RightTone_When_CheckAndContinue_Then_NextGetsCorrectAnswer', () => {
		// Arrange
		const ui = mountTone();

		// Act
		pickAndCheck(ui, 3);

		// Assert
		expect(target!.textContent).toContain(m.lesson_right());
		expect(target!.textContent).not.toContain('thanh 3 (hǎo)');
		expect(ui.calls).toEqual([
			expect.objectContaining({ questionId: 'q-h1-01-l01', pick: '3', correct: true })
		]);
	});

	it('Given_WrongTone_When_Check_Then_ShowsTheRightToneAndPinyin', () => {
		// Arrange
		const ui = mountTone();

		// Act
		ui.options()[1].click();
		flushSync();
		ui.cta().onclick();
		flushSync();

		// Assert
		expect(target!.textContent).toContain(m.lesson_wrong());
		expect(target!.textContent).toContain('thanh 3 (hǎo)');
		expect(ui.options()[1].getAttribute('data-mark')).toBe('wrong');
		expect(ui.options()[2].getAttribute('data-mark')).toBe('right');
		ui.cta().onclick();
		expect(ui.calls).toEqual([expect.objectContaining({ pick: '2', correct: false })]);
	});

	it('Given_TestMode_When_PickAndSubmit_Then_NoVerdictAndAnswerSent', () => {
		// Arrange
		const ui = mountTone(step, 'test', true);

		// Act
		ui.options()[1].click();
		flushSync();
		const label = ui.cta().label;
		ui.cta().onclick();
		flushSync();

		// Assert
		expect(label).toBe(m.lesson_submit());
		expect(target!.textContent).not.toContain(m.lesson_wrong());
		expect(ui.options()[2].getAttribute('data-mark')).toBe(null);
		expect(ui.calls).toEqual([expect.objectContaining({ pick: '2', correct: false })]);
	});
});
