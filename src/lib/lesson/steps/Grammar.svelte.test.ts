import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { play } from '#lib/audio/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Answer, Cta, Mode } from '../types';
import Grammar, { type Step } from './Grammar.svelte';

vi.mock('#lib/audio/index.js', () => ({ play: vi.fn() }));

const step: Step = {
	kind: 'grammar',
	id: 'h1-g01',
	kicker: 'Điểm ngữ pháp 1/2',
	title: 'Chào hỏi: A + 好',
	rows: [['你 / 您 / 你们', '好']],
	labels: ['người được chào', 'luôn có'],
	lead: 'Thêm 好 (hảo, “tốt”) sau người được chào.',
	more: '你们 = 你 + 们 (môn, số nhiều), nên 你们好 là chào cả nhóm.',
	examples: [
		{ hanzi: '您好！', pinyin: 'nín hǎo', vi: 'Chào thầy cô!', audio: 'examples/aa' },
		{ hanzi: '你们好！', pinyin: 'nǐmen hǎo', vi: 'Chào các bạn!' }
	],
	pitfall: { wrong: '好你', right: '你好' },
	drills: 3
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountGrammar = (props: { mode?: Mode; step?: Step } = {}) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Grammar, {
		target,
		props: {
			step: props.step ?? step,
			mode: props.mode ?? 'feedback',
			last: false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
	return {
		buttons: () => [...target!.querySelectorAll<HTMLButtonElement>('button')],
		more: () => target!.querySelector<HTMLButtonElement>('[data-part="more-toggle"]'),
		cta: () => cta!,
		calls
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.mocked(play).mockClear();
});

describe('Grammar', () => {
	it('Given_Point1_When_Render_Then_SlotsLabelsAndKicker', () => {
		// Arrange / Act
		mountGrammar();

		// Assert
		const text = target!.textContent!;
		expect(text).toContain('Điểm ngữ pháp 1/2');
		expect(text).toContain('Chào hỏi: A + 好');
		expect(text).toContain('你 / 您 / 你们');
		expect(text).toContain('好');
		expect(text).toContain('người được chào');
		expect(text).toContain('luôn có');
		expect(text).toContain('Thêm 好 (hảo, “tốt”) sau người được chào.');
	});

	it('Given_XemThem_When_Tap_Then_ExpandsMore', () => {
		// Arrange
		const { more } = mountGrammar();
		const body = () => target!.querySelector<HTMLParagraphElement>('#grammar-more')!;
		expect(more()!.getAttribute('aria-expanded')).toBe('false');
		expect(body().hidden).toBe(true);

		// Act
		more()!.click();
		flushSync();

		// Assert
		expect(more()!.getAttribute('aria-expanded')).toBe('true');
		expect(body().hidden).toBe(false);
		expect(body().textContent).toContain('nên 你们好 là chào cả nhóm.');
	});

	it('Given_Example_When_TapPlay_Then_PlaysClipKey', async () => {
		// Arrange
		const { buttons } = mountGrammar();

		// Act
		const plays = buttons().filter((b) => b.getAttribute('data-part') === 'play');
		expect(plays).toHaveLength(1);
		plays[0].click();
		await vi.waitFor(() => expect(play).toHaveBeenCalledWith('examples/aa'));

		// Assert
		expect(play).toHaveBeenCalledTimes(1);
	});

	it('Given_Pitfall_When_Render_Then_SaiAndDung', () => {
		// Arrange / Act
		mountGrammar();

		// Assert
		const text = target!.textContent!;
		expect(text).toContain(m.grammar_pitfalls());
		expect(text).toContain('好你');
		expect(text).toContain(m.grammar_wrong());
		expect(text).toContain('你好');
		expect(text).toContain(m.grammar_right());
	});

	it('Given_Mount_When_Render_Then_CtaLamBaiWith3Drills', () => {
		// Arrange
		const { cta, calls } = mountGrammar();

		// Act
		cta().onclick();

		// Assert
		expect(cta().label).toBe(m.grammar_start());
		expect(cta().hint).toBe(m.grammar_drills({ n: 3 }));
		expect(cta().caret).toBe(true);
		expect(calls).toHaveLength(1);
		expect(calls[0]).toBeUndefined();
	});
});
