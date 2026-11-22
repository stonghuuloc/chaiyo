import { flushSync, mount, unmount } from 'svelte';
import { m } from '#lib/paraglide/messages.js';
import { play } from '#lib/audio/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { animated } from '../../../test/FakeStrokes.svelte';
import type { Answer, Cta } from '../types';
import Word, { type Step } from './Word.svelte';

vi.mock('#lib/audio/index.js', () => ({ play: vi.fn() }));
vi.mock('#lib/components/HanziStrokes.svelte', () => import('../../../test/FakeStrokes.svelte'));

const step: Step = {
	kind: 'word',
	id: '你好',
	hanzi: '你好',
	pinyin: 'nǐ hǎo',
	hanviet: 'nhĩ hảo',
	meaning: 'xin chào',
	audio: 'word/nihao',
	parts: [
		{ hanzi: '你', pinyin: 'nǐ', hanviet: 'nhĩ' },
		{ hanzi: '好', pinyin: 'hǎo', hanviet: 'hảo' }
	],
	components: [],
	examples: [{ hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Xin chào!' }]
};

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	for (let i = 0; i < 5; i += 1) await new Promise((r) => setTimeout(r, 0));
	flushSync();
};

const mountWord = async (s: Step = step) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Word, {
		target,
		props: {
			step: s,
			mode: 'feedback',
			last: false,
			cta: (c: Cta) => (cta = c),
			next: (a?: Answer) => calls.push(a)
		}
	}) as Record<string, unknown>;
	await settle();
	return {
		part: (p: string) => target!.querySelector<HTMLElement>(`[data-part="${p}"]`),
		cta: () => cta!,
		calls
	};
};

beforeEach(() => {
	animated.length = 0;
});

afterEach(() => {
	if (app) unmount(app);
	target?.remove();
	target = app = undefined;
	vi.mocked(play).mockClear();
});

describe('Word', () => {
	it('Given_TwoCharWord_When_Mount_Then_EveryBlockShowsAndStrokesAnimateInOrder', async () => {
		// Arrange
		// Act
		const v = await mountWord();

		// Assert
		expect(v.part('pinyin')?.textContent).toBe('nǐ hǎo');
		expect(v.part('hanviet')?.textContent).toBe('nhĩ hảo');
		expect(v.part('meaning')?.textContent).toBe('xin chào');
		expect(v.part('parts')?.textContent).toContain(m.words_parts());
		expect(v.part('parts')?.textContent).toContain('hảo');
		expect(v.part('components')).toBeNull();
		expect(v.part('examples')?.textContent).toContain('Xin chào!');
		await vi.waitFor(() => expect(animated).toEqual(['你', '好']));
	});

	it('Given_StrokesTapped_When_Click_Then_AnimationReplays', async () => {
		// Arrange
		const v = await mountWord();
		await vi.waitFor(() => expect(animated).toHaveLength(2));

		// Act
		v.part('strokes')?.click();

		// Assert
		await vi.waitFor(() => expect(animated).toEqual(['你', '好', '你', '好']));
	});

	it('Given_SingleCharWithComponents_When_Mount_Then_CauTaoShowsInsteadOfParts', async () => {
		// Arrange
		const s: Step = {
			...step,
			id: '你',
			hanzi: '你',
			hanviet: undefined,
			audio: undefined,
			parts: [],
			components: ['亻 nhân đứng · người'],
			examples: []
		};

		// Act
		const v = await mountWord(s);

		// Assert
		expect(v.part('components')?.textContent).toContain(m.words_components());
		expect(v.part('components')?.textContent).toContain('亻 nhân đứng · người');
		expect(v.part('parts')).toBeNull();
		expect(v.part('hanviet')).toBeNull();
		expect(v.part('listen')).toBeNull();
		expect(v.part('examples')).toBeNull();
	});

	it('Given_Clip_When_SpeakerTapped_Then_PlaysWordClip', async () => {
		// Arrange
		const v = await mountWord();

		// Act
		v.part('listen')?.click();
		await settle();

		// Assert
		expect(play).toHaveBeenCalledWith('word/nihao');
	});

	it('Given_Card_When_CtaClicked_Then_NextCarriesSeenTheCard', async () => {
		// Arrange
		const v = await mountWord();

		// Act
		v.cta().onclick();

		// Assert
		expect(v.cta().label).toBe(m.words_next());
		expect(v.calls).toEqual([
			{
				questionId: '你好',
				pick: 'seen',
				correct: true,
				ms: expect.any(Number),
				card: { word: '你好', skill: 'the' }
			}
		]);
	});

	it('Given_AnimationRunning_When_TappedTwice_Then_OnePassOnly', async () => {
		// Arrange
		const v = await mountWord();
		await vi.waitFor(() => expect(animated).toHaveLength(2));

		// Act
		v.part('strokes')?.click();
		v.part('strokes')?.click();
		await settle();

		// Assert
		expect(animated).toEqual(['你', '好', '你', '好']);
	});

	it('Given_NoPartsNoComponents_When_Mount_Then_NeitherSection', async () => {
		// Arrange
		const s: Step = { ...step, parts: [], components: [] };

		// Act
		const v = await mountWord(s);

		// Assert
		expect(v.part('hanviet')?.textContent).toBe('nhĩ hảo');
		expect(v.part('parts')).toBeNull();
		expect(v.part('components')).toBeNull();
	});
});
