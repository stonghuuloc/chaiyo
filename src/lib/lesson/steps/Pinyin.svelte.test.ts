import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { afterEach, describe, expect, it } from 'vitest';
import type { Answer, Cta } from '../types';
import Pinyin, { type Step } from './Pinyin.svelte';

const step: Step = {
	kind: 'pinyin',
	id: 'q-h1-01-x06',
	ask: 'Gõ pinyin',
	title: 'tạm biệt',
	hanzi: '再见',
	answer: 'zàijiàn'
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountPinyin = (last = false) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Pinyin, {
		target,
		props: {
			step,
			mode: 'test',
			last,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
	const input = target.querySelector<HTMLInputElement>('[data-part="pinyin-input"]')!;
	return {
		type: (v: string) => {
			input.value = v;
			input.dispatchEvent(new Event('input'));
			flushSync();
		},
		preview: () => target!.querySelector('[data-part="pinyin-preview"]')!.textContent!.trim(),
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

describe('Pinyin', () => {
	it('Given_Empty_When_Render_Then_NextDisabled', () => {
		// Arrange
		const v = mountPinyin();

		// Act
		const c = v.cta();

		// Assert
		expect(c.label).toBe(m.lesson_next_question());
		expect(c.disabled).toBe(true);
		expect(v.preview()).toBe('');
	});

	it('Given_ToneDigits_When_Type_Then_PreviewShowsMarks', () => {
		// Arrange
		const v = mountPinyin();

		// Act
		v.type('zai4jian4');

		// Assert
		expect(v.preview()).toBe(m.gate_pinyin_preview({ text: 'zàijiàn' }));
		expect(v.cta().disabled).toBe(false);
	});

	it('Given_RightPinyin_When_Next_Then_AnswerCorrect', () => {
		// Arrange
		const v = mountPinyin();
		v.type('zai4 jian4');

		// Act
		v.cta().onclick();

		// Assert
		expect(v.calls).toEqual([
			expect.objectContaining({ questionId: step.id, pick: 'zai4 jian4', correct: true })
		]);
	});

	it('Given_NoTones_When_Next_Then_AnswerWrong', () => {
		// Arrange
		const v = mountPinyin(true);
		v.type('zaijian');

		// Act
		v.cta().onclick();

		// Assert
		expect(v.cta().label).toBe(m.lesson_submit());
		expect(v.calls).toEqual([expect.objectContaining({ correct: false })]);
	});

	it('Given_Empty_When_Click_Then_NoAnswer', () => {
		// Arrange
		const v = mountPinyin();

		// Act
		v.cta().onclick();

		// Assert
		expect(v.calls).toEqual([]);
	});
});
