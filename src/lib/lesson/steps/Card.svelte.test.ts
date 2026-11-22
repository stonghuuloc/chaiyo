import { flushSync, mount, unmount } from 'svelte';
import { play } from '#lib/audio/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Answer, Cta } from '../types';
import Card, { type Step } from './Card.svelte';

vi.mock('#lib/audio/index.js', () => ({ play: vi.fn() }));

const step = (over: Partial<Step> = {}): Step => ({
	kind: 'card',
	id: 'h0-00-tones-card-0',
	kicker: '1/6',
	title: 'Bốn thanh',
	explain: 'pinyin vẫn viết nǐ hǎo, không viết ní hǎo',
	chips: [
		{ text: 'mā', hanzi: '妈', key: 'pinyin-chart/aa' },
		{ text: 'má', key: 'pinyin-chart/bb' },
		{ text: 'ma', key: null }
	],
	pairs: [],
	...over
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const mountCard = (s: Step) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Card, {
		target,
		props: {
			step: s,
			mode: 'feedback',
			last: false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	flushSync();
	return {
		chips: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-part=chip]')],
		cta: () => cta!,
		calls
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	vi.clearAllMocks();
});

describe('Card step', () => {
	it('Given_Chip_When_TappedTwice_Then_PlaySameKeyTwice', async () => {
		// Arrange
		const { chips } = mountCard(step());

		// Act
		chips()[0].click();
		await vi.waitFor(() => expect(play).toHaveBeenCalledTimes(1));
		chips()[0].click();
		await vi.waitFor(() => expect(play).toHaveBeenCalledTimes(2));

		// Assert
		expect(vi.mocked(play).mock.calls).toEqual([['pinyin-chart/aa'], ['pinyin-chart/aa']]);
	});

	it('Given_ChipWithNullKey_When_Mounted_Then_ButtonDisabled', () => {
		// Arrange / Act
		const { chips } = mountCard(step());

		// Assert
		expect(chips().map((b) => b.disabled)).toEqual([false, false, true]);
	});

	it('Given_ChipWithHanzi_When_Mounted_Then_PinyinOnestAndHanziShown', () => {
		// Arrange / Act
		const { chips } = mountCard(step());

		// Assert
		expect(chips()[0].querySelector('.font-pinyin')!.textContent).toBe('mā');
		expect(chips()[0].querySelector('.font-hanzi')!.textContent).toBe('妈');
		expect(chips()[1].querySelector('.font-hanzi')).toBeNull();
	});

	it('Given_EmptySyllables_When_Mounted_Then_NoChips', () => {
		// Arrange / Act
		const { chips } = mountCard(step({ chips: [], pairs: [] }));

		// Assert
		expect(chips()).toHaveLength(0);
	});

	it('Given_Pairs_When_Mounted_Then_TwoChipsPerPair', () => {
		// Arrange
		const pair: Step['pairs'][number] = [
			{ text: 'mā', key: 'k1' },
			{ text: 'má', key: 'k2' }
		];

		// Act
		const { chips } = mountCard(step({ chips: [], pairs: [pair, pair] }));

		// Assert
		expect(target!.querySelectorAll('[data-part=pair]')).toHaveLength(2);
		expect(
			[...target!.querySelectorAll('[data-part=pair]')].map(
				(p) => p.querySelectorAll('[data-part=chip]').length
			)
		).toEqual([2, 2]);
		expect(chips()).toHaveLength(4);
	});

	it('Given_ExplainWithNiHao_When_Mounted_Then_PinyinSpansUseOnest', () => {
		// Arrange / Act
		mountCard(step());

		// Assert
		const spans = [...target!.querySelectorAll('p span.font-pinyin')].map((s) => s.textContent);
		expect(spans).toEqual(['nǐ', 'hǎo', 'hǎo']);
	});

	it('Given_Mounted_When_CtaClicked_Then_NextWithoutAnswer', () => {
		// Arrange
		const { cta, calls } = mountCard(step());

		// Act
		cta().onclick();

		// Assert
		expect(cta().label).toBe('Tiếp tục');
		expect(calls).toEqual([undefined]);
	});
});
