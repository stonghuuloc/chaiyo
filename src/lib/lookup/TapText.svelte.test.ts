import { flushSync, mount, unmount } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { LookupHit } from '#lib/catalog/index.js';
import TapText from './TapText.svelte';
import WithLookup from '../../test/WithLookup.svelte';
import type { LookupContext } from './context';

const lookup = vi.fn(async (sentenceId: string, i: number) => ({
	hanzi: '你们',
	pinyin: 'nǐmen',
	hanviet: 'nễ môn',
	meaning: 'các bạn',
	sentenceId,
	start: i - 1
}));

vi.mock('#lib/catalog/app.js', () => ({ catalog: { lookup } }));

const flush = () => new Promise((r) => setTimeout(r, 0));

let app: ReturnType<typeof mount> | undefined;
let li: HTMLElement | undefined;

const render = (ctx: LookupContext | null, hanzi = '你们好！') => {
	li = document.createElement('li');
	li.getBoundingClientRect = () => ({ top: 10, bottom: 50 }) as DOMRect;
	document.body.append(li);
	app = ctx
		? mount(WithLookup, {
				target: li,
				props: { ctx, view: TapText, props: { sentenceId: 's-1', hanzi } }
			})
		: mount(TapText, { target: li, props: { sentenceId: 's-1', hanzi } });
	flushSync();
};

const spans = () => [...document.body.querySelectorAll<HTMLElement>('[data-i]')];

afterEach(() => {
	if (app) unmount(app);
	li?.remove();
	app = undefined;
	li = undefined;
	lookup.mockClear();
});

describe('TapText', () => {
	it('Given_你们好！_When_Render_Then_ThreeIndexedSpans', () => {
		// Arrange
		const ctx = { open: vi.fn(), hit: () => null };
		// Act
		render(ctx);
		// Assert
		expect(spans().map((s) => [s.dataset.i, s.textContent])).toEqual([
			['0', '你'],
			['1', '们'],
			['2', '好']
		]);
		expect(li?.textContent).toBe('你们好！');
	});

	it('Given_Host_When_TapIndex1_Then_OpenGetsHitAndLiRect', async () => {
		// Arrange
		const open = vi.fn();
		render({ open, hit: () => null });
		// Act
		spans()[1].dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }));
		await flush();
		// Assert
		expect(lookup).toHaveBeenCalledWith('s-1', 1);
		expect(open).toHaveBeenCalledWith(
			expect.objectContaining({ hanzi: '你们' }),
			expect.objectContaining({ top: 10, bottom: 50 })
		);
	});

	it('Given_NoHost_When_Render_Then_NoIndexedSpans', async () => {
		// Arrange / Act
		render(null);
		// Assert
		expect(spans()).toHaveLength(0);
		expect(li?.textContent).toBe('你们好！');
	});

	it('Given_OpenHit_When_Render_Then_TokenSpansMarkedHit', () => {
		// Arrange
		const hit: LookupHit = {
			hanzi: '你们',
			pinyin: 'nǐmen',
			hanviet: 'nễ môn',
			meaning: 'các bạn',
			sentenceId: 's-1',
			start: 0
		};
		// Act
		render({ open: vi.fn(), hit: () => hit });
		// Assert
		expect(spans().map((s) => s.hasAttribute('data-hit'))).toEqual([true, true, false]);
	});

	it('Given_HitOfOtherSentence_When_Render_Then_NothingMarked', () => {
		// Arrange
		const hit = { hanzi: '你', sentenceId: 's-2', start: 0 } as LookupHit;
		// Act
		render({ open: vi.fn(), hit: () => hit });
		// Assert
		expect(spans().some((s) => s.hasAttribute('data-hit'))).toBe(false);
	});
});
