import { flushSync, mount, tick, unmount } from 'svelte';
import { player } from '#lib/audio/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DisplayPrefs, PREFS } from '../prefs.svelte';
import type { Answer, Cta } from '../types';
import type { LookupContext } from '#lib/lookup/context';
import WithLookup from '../../../test/WithLookup.svelte';
import Dialogue, { type Step } from './Dialogue.svelte';

const lookup = vi.fn(async (sentenceId: string, i: number) => ({
	hanzi: '你',
	pinyin: 'nǐ',
	hanviet: 'nễ',
	meaning: 'bạn',
	sentenceId,
	start: i
}));

vi.mock('#lib/catalog/app.js', () => ({ catalog: { lookup } }));

const pending: { key: string; end: (ended: boolean) => void }[] = [];

vi.mock('#lib/audio/index.js', () => ({
	player: {
		playToEnd: vi.fn(
			(key: string) =>
				new Promise<boolean>((resolve) => {
					pending.push({ key, end: resolve });
				})
		),
		pause: vi.fn()
	}
}));

const step = (over: Partial<Step> = {}): Step => ({
	kind: 'dialogue',
	id: 'dlg-h1-01-0',
	part: 1,
	of: 2,
	title: 'Gặp nhau',
	lines: [
		{
			id: 's1',
			speaker: 'redpanda',
			hanzi: '你好！',
			pinyin: 'nǐ hǎo',
			vi: 'Chào bạn!',
			audio: 'a1'
		},
		{ id: 's2', speaker: 'takin', hanzi: '你好！', pinyin: 'nǐ hǎo', vi: 'Chào bạn!', audio: 'a2' },
		{
			id: 's3',
			speaker: 'takin',
			hanzi: '对不起！',
			pinyin: 'duìbuqǐ',
			vi: 'Xin lỗi!',
			audio: 'a3'
		},
		{ id: 's4', speaker: 'redpanda', hanzi: '没关系。', pinyin: 'méi guānxi', vi: 'Không sao.' }
	],
	...over
});

let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	for (let i = 0; i < 4; i++) {
		await tick();
		await Promise.resolve();
	}
	flushSync();
};

const mountDialogue = async (s: Step = step(), prefs?: DisplayPrefs) => {
	const calls: (Answer | undefined)[] = [];
	let cta: Cta | undefined;
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Dialogue, {
		target,
		context: prefs ? new Map([[PREFS, prefs]]) : undefined,
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
		rows: () => [...target!.querySelectorAll<HTMLButtonElement>('[data-part="dialogue-line"]')],
		playingRows: () =>
			[...target!.querySelectorAll('[data-part="dialogue-line"][data-playing="true"]')].length,
		cta: () => cta!,
		calls
	};
};

const click = async (fn: () => void) => {
	fn();
	flushSync();
	await settle();
};

const endCurrent = async (ended = true) => {
	pending.shift()!.end(ended);
	await settle();
};

const pill = (k: string) =>
	target!.querySelector<HTMLButtonElement>(`[data-part="pill"][data-pill="${k}"]`)!;

const memory = (init: object): Storage =>
	({ getItem: () => JSON.stringify(init), setItem: () => {} }) as unknown as Storage;

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = undefined;
	app = undefined;
	pending.length = 0;
	vi.mocked(player.playToEnd).mockClear();
	vi.mocked(player.pause).mockClear();
	lookup.mockClear();
});

describe('Dialogue', () => {
	it('Given_Part1_When_Mount_Then_KickerTitleRowsBySpeakerAndIdleCta', async () => {
		// Arrange / Act
		const { rows, cta } = await mountDialogue();

		// Assert
		expect(target!.textContent).toContain('Đoạn 1/2');
		expect(target!.textContent).toContain('Gặp nhau');
		expect(rows().map((r) => r.dataset.speaker)).toEqual([
			'redpanda',
			'takin',
			'takin',
			'redpanda'
		]);
		expect(rows()[0].querySelector('[data-part="line-hanzi"]')!.textContent).toBe('你好！');
		expect(cta().label).toBe('Nghe đoạn hội thoại');
		expect(cta().hint).toBe('Hoặc bấm vào từng câu để nghe');
		expect(player.playToEnd).not.toHaveBeenCalled();
	});

	it('Given_Idle_When_PlayAll_Then_LinesPlayInTurnWithHighlightAndCounter', async () => {
		// Arrange
		const { rows, cta, playingRows } = await mountDialogue();

		// Act
		await click(() => cta().onclick());
		const first = rows()[0].dataset.playing;
		await endCurrent();

		// Assert
		expect(first).toBe('true');
		expect(rows()[1].dataset.playing).toBe('true');
		expect(playingRows()).toBe(1);
		expect(cta().label).toBe('Đang phát 2/4');
		expect(cta().hint).toBe('Bấm để tạm dừng');
		expect(vi.mocked(player.playToEnd).mock.calls).toEqual([
			['a1', { slow: false }],
			['a2', { slow: false }]
		]);
	});

	it('Given_PlayingLine2_When_TapCta_Then_PausedAtLine2AndResumeReplaysIt', async () => {
		// Arrange
		const { rows, cta } = await mountDialogue();
		await click(() => cta().onclick());
		await endCurrent();

		// Act
		await click(() => cta().onclick());
		await endCurrent(false);
		const paused = { label: cta().label, hint: cta().hint };
		await click(() => cta().onclick());

		// Assert
		expect(player.pause).toHaveBeenCalledTimes(1);
		expect(paused).toEqual({ label: 'Tạm dừng 2/4', hint: 'Bấm để nghe tiếp' });
		expect(cta().label).toBe('Đang phát 2/4');
		expect(rows()[1].dataset.playing).toBe('true');
		expect(vi.mocked(player.playToEnd).mock.calls.at(-1)).toEqual(['a2', { slow: false }]);
	});

	it('Given_PlayAll_When_TapLine3_Then_SequenceStopsAndOnlyLine3Plays', async () => {
		// Arrange
		const { rows, cta, playingRows } = await mountDialogue();
		await click(() => cta().onclick());

		// Act
		await click(() => rows()[2].click());
		await endCurrent(false);
		const during = { playing: rows()[2].dataset.playing, n: playingRows() };
		await endCurrent();

		// Assert
		expect(vi.mocked(player.playToEnd).mock.calls.map((c) => c[0])).toEqual(['a1', 'a3']);
		expect(vi.mocked(player.playToEnd).mock.calls[1]).toEqual(['a3']);
		expect(during).toEqual({ playing: 'true', n: 1 });
		expect(playingRows()).toBe(0);
		expect(cta().label).toBe('Nghe đoạn hội thoại');
	});

	it('Given_AllLinesEnded_When_Part1_Then_CtaTiepCallsNextWithoutAnswer', async () => {
		// Arrange
		const { cta, calls } = await mountDialogue();
		await click(() => cta().onclick());

		// Act — line 4 has no clip, so it ends at once.
		await endCurrent();
		await endCurrent();
		await endCurrent();
		const label = cta().label;
		await click(() => cta().onclick());

		// Assert
		expect(label).toBe('Tiếp');
		expect(calls).toEqual([undefined]);
	});

	it('Given_LastPart_When_AllPlayed_Then_CtaAnswerQuestion', async () => {
		// Arrange
		const s = step({ part: 2, title: 'Chia tay', lines: step().lines.slice(0, 1) });
		const { cta } = await mountDialogue(s);

		// Act
		await click(() => cta().onclick());
		await endCurrent();

		// Assert
		expect(target!.textContent).toContain('Đoạn 2/2');
		expect(cta().label).toBe('Trả lời câu hỏi');
	});

	it('Given_Playing_When_Unmount_Then_PlayerPaused', async () => {
		// Arrange
		const { cta } = await mountDialogue();
		await click(() => cta().onclick());

		// Act
		unmount(app as never);
		app = undefined;

		// Assert
		expect(player.pause).toHaveBeenCalledTimes(1);
	});

	it('Given_MeaningOff_When_Render_Then_NoLineViAndHanziKept', async () => {
		// Arrange
		const storage = memory({ pinyin: null, meaning: false });
		const prefs = new DisplayPrefs({ level: 1, key: 'k', storage });

		// Act
		await mountDialogue(step(), prefs);

		// Assert
		expect(target!.querySelectorAll('[data-part="line-vi"]')).toHaveLength(0);
		expect(target!.querySelectorAll('[data-part="line-hanzi"]')).toHaveLength(4);
		expect(target!.querySelectorAll('[data-part="line-pinyin"]')).toHaveLength(4);
		expect(pill('meaning').getAttribute('aria-pressed')).toBe('false');
	});

	it('Given_MeaningOn_When_ClickMeaningPillTwice_Then_ViHiddenThenBack', async () => {
		// Arrange
		const prefs = new DisplayPrefs({ level: 1, key: 'k' });
		await mountDialogue(step(), prefs);

		// Act
		await click(() => pill('meaning').click());
		const off = {
			pressed: pill('meaning').getAttribute('aria-pressed'),
			vi: target!.querySelectorAll('[data-part="line-vi"]').length
		};
		await click(() => pill('meaning').click());

		// Assert
		expect(off).toEqual({ pressed: 'false', vi: 0 });
		expect(pill('meaning').getAttribute('aria-pressed')).toBe('true');
		expect(target!.querySelectorAll('[data-part="line-vi"]')).toHaveLength(4);
	});

	it('Given_PinyinOffLevel3_When_TapPinyinPill_Then_PinyinSpansEqualLines', async () => {
		// Arrange
		const prefs = new DisplayPrefs({ level: 3, key: 'k' });
		await mountDialogue(step(), prefs);
		const before = {
			pressed: pill('pinyin').getAttribute('aria-pressed'),
			n: target!.querySelectorAll('[data-part="line-pinyin"]').length
		};

		// Act
		await click(() => pill('pinyin').click());

		// Assert
		expect(before).toEqual({ pressed: 'false', n: 0 });
		expect(pill('pinyin').getAttribute('aria-pressed')).toBe('true');
		expect(target!.querySelectorAll('[data-part="line-pinyin"]')).toHaveLength(4);
		expect(player.playToEnd).not.toHaveBeenCalled();
	});

	it('Given_NoPrefsContext_When_Render_Then_PinyinAndViShown', async () => {
		// Arrange / Act
		await mountDialogue();

		// Assert
		expect(target!.querySelectorAll('[data-part="pill"]')).toHaveLength(0);
		expect(target!.querySelectorAll('[data-part="line-pinyin"]')).toHaveLength(4);
		expect(target!.querySelectorAll('[data-part="line-vi"]')).toHaveLength(4);
	});

	describe('with a lookup host', () => {
		const mountWithLookup = async () => {
			const ctx: LookupContext = { open: vi.fn(), hit: () => null };
			target = document.createElement('div');
			document.body.append(target);
			app = mount(WithLookup, {
				target,
				props: {
					ctx,
					view: Dialogue,
					props: {
						step: step(),
						mode: 'feedback',
						last: false,
						cta: () => {},
						next: () => {}
					}
				}
			}) as Record<string, unknown>;
			await settle();
			return ctx;
		};

		const tap = async (el: Element) => {
			el.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
			await new Promise((r) => setTimeout(r, 0));
			await settle();
		};

		const line = (n: number) =>
			target!.querySelectorAll('[data-part="dialogue-line"]')[n] as HTMLElement;

		it('Given_LineHanzi_When_Tap_Then_LookupNotReplay', async () => {
			// Arrange
			const ctx = await mountWithLookup();
			// Act
			await tap(line(0).querySelector('[data-i="1"]')!);
			// Assert
			expect(lookup).toHaveBeenCalledWith('s1', 1);
			expect(ctx.open).toHaveBeenCalledOnce();
			expect(player.playToEnd).not.toHaveBeenCalled();
		});

		it('Given_LinePinyin_When_Tap_Then_Replays', async () => {
			// Arrange
			await mountWithLookup();
			// Act
			await tap(line(0).querySelector('[data-part="line-pinyin"]')!);
			// Assert
			expect(lookup).not.toHaveBeenCalled();
			expect(player.playToEnd).toHaveBeenCalledTimes(1);
		});

		it('Given_Punctuation_When_Tap_Then_Replays', async () => {
			// Arrange
			await mountWithLookup();
			// Act
			await tap(line(0).querySelector('[lang="zh-Hans"]')!);
			// Assert
			expect(lookup).not.toHaveBeenCalled();
			expect(player.playToEnd).toHaveBeenCalledTimes(1);
		});
	});
});
