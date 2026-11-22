import { flushSync, mount, unmount } from 'svelte';
import type { LookupContext } from '#lib/lookup/context.js';
import WithLookup from '../../../test/WithLookup.svelte';
import { m } from '#lib/paraglide/messages.js';
import { play } from '#lib/audio/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisplayPrefs, PREFS, type Stored } from '../prefs.svelte';
import type { Answer, Cta, Mode } from '../types';
import Grammar, { type Step } from './Grammar.svelte';

vi.mock('#lib/audio/index.js', () => ({ play: vi.fn() }));

const lookup = vi.fn(async (sentenceId: string, i: number) => ({
	hanzi: '您',
	pinyin: 'nín',
	hanviet: 'nâm',
	meaning: 'ngài',
	sentenceId,
	start: i
}));

vi.mock('#lib/catalog/app.js', () => ({ catalog: { lookup } }));

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
		{ id: 's1', hanzi: '您好！', pinyin: 'nín hǎo', vi: 'Chào thầy cô!', audio: 'examples/aa' },
		{ id: 's2', hanzi: '你们好！', pinyin: 'nǐmen hǎo', vi: 'Chào các bạn!' }
	],
	pitfall: { wrong: '好你', right: '你好' },
	drills: 3
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountGrammar = (props: { mode?: Mode; step?: Step; prefs?: DisplayPrefs } = {}) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Grammar, {
		target,
		context: props.prefs ? new Map([[PREFS, props.prefs]]) : undefined,
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

const prefsWith = (init: Stored) =>
	new DisplayPrefs({
		level: 1,
		key: 'k',
		storage: { getItem: () => JSON.stringify(init), setItem: () => {} } as unknown as Storage
	});
const count = (part: string) => target!.querySelectorAll(`[data-part="${part}"]`).length;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.mocked(play).mockClear();
	lookup.mockClear();
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

	it('Given_MeaningOff_When_Render_Then_NoExampleVi', () => {
		// Arrange
		const prefs = prefsWith({ pinyin: null, meaning: false });

		// Act
		mountGrammar({ prefs });

		// Assert
		expect(count('example-vi')).toBe(0);
		expect(count('example-pinyin')).toBe(2);
		expect(count('pill')).toBe(2);
	});

	it('Given_PinyinOff_When_Render_Then_NoExamplePinyin', () => {
		// Arrange
		const prefs = prefsWith({ pinyin: false, meaning: null });

		// Act
		mountGrammar({ prefs });

		// Assert
		expect(count('example-pinyin')).toBe(0);
		expect(count('example-vi')).toBe(2);
	});

	it('Given_PinyinOn_When_Render_Then_SlotsHaveNoPinyin', () => {
		// Arrange
		const prefs = prefsWith({ pinyin: true, meaning: true });

		// Act
		mountGrammar({ prefs });

		// Assert
		const slots = [...target!.querySelectorAll('[data-part="slot"]')].map((e) =>
			e.textContent!.replace(/\s+/g, ' ').trim()
		);
		expect(slots).toEqual(['你 / 您 / 你们 người được chào', '好 luôn có']);
		expect(target!.querySelectorAll('[data-part="slot"] .font-pinyin')).toHaveLength(0);
		expect(count('example-pinyin')).toBe(2);
	});

	it('Given_NoPrefsContext_When_Render_Then_ExamplePinyinAndViShown', () => {
		// Arrange / Act
		mountGrammar();

		// Assert
		expect([count('pill'), count('example-pinyin'), count('example-vi')]).toEqual([0, 2, 2]);
	});

	describe('with a lookup host', () => {
		const mountWithLookup = () => {
			const ctx: LookupContext = { open: vi.fn(), hit: () => null };
			target = document.createElement('div');
			document.body.append(target);
			app = mount(WithLookup, {
				target,
				props: {
					ctx,
					view: Grammar,
					props: { step, mode: 'feedback', last: false, cta: () => {}, next: () => {} }
				}
			}) as Record<string, unknown>;
			flushSync();
			return ctx;
		};

		const tap = async (el: Element) => {
			el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
			await new Promise((r) => setTimeout(r, 0));
		};

		it('Given_Example_When_TapHanzi_Then_LookupWithExampleId', async () => {
			// Arrange
			const ctx = mountWithLookup();
			const items = target!.querySelectorAll('ul > li');
			// Act
			await tap(items[1].querySelector('[data-i="1"]')!);
			// Assert
			expect(lookup).toHaveBeenCalledWith('s2', 1);
			expect(ctx.open).toHaveBeenCalledOnce();
		});

		it('Given_PatternRow_When_Render_Then_NoIndexedSpans', () => {
			// Arrange / Act
			mountWithLookup();
			// Assert
			const slots = target!.querySelectorAll('[data-part="slot"] [data-i]');
			const pitfall = target!.querySelectorAll('[data-part^="pitfall"] [data-i]');
			expect(slots).toHaveLength(0);
			expect(pitfall).toHaveLength(0);
			expect(target!.querySelectorAll('[data-i]')).toHaveLength(5);
		});

		it('Given_PlayButton_When_Click_Then_NoLookup', async () => {
			// Arrange
			mountWithLookup();
			// Act
			await tap(target!.querySelector('[data-part="play"]')!);
			// Assert
			expect(lookup).not.toHaveBeenCalled();
		});
	});
});
