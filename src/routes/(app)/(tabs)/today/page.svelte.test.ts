import { flushSync, mount, tick, unmount } from 'svelte';
import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const past = '2026-11-01T00:00:00.000Z';
const build = (due: number): State => {
	const state = initialState({ curriculum: CURRICULUM });
	state.lessons['h0-00'].passed = true;
	state.lessons['h1-01'].unlocked = true;
	for (let i = 0; i < due; i++) {
		state.lexicon[`w${i}`] = { saved: false, cards: { the: { due: past, first: past, fsrs: {} } } };
	}
	return state;
};

const hoisted = vi.hoisted(() => ({ load: vi.fn() }));
let current: State = build(0);
const listeners = new Set<(s: State) => void>();
const ledger = {
	state: () => current,
	subscribe: (fn: (s: State) => void) => (listeners.add(fn), () => listeners.delete(fn))
} as unknown as Ledger;
const publish = (s: State) => {
	current = s;
	for (const fn of listeners) fn(s);
};

vi.mock('#lib/learner/index.js', () => ({ learnerLedger: hoisted.load }));

const session = { user: { id: 'u1' } };
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountPage = async (data: { session: typeof session | null } = { session }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data } as never }) as Record<string, unknown>;
	await settle();
	return {
		h1: () => target!.querySelectorAll('h1').length,
		cta: () => target!.querySelector('[data-part=next-cta]')?.textContent?.trim(),
		scene: () => target!.querySelector('[data-part=scene]')?.getAttribute('data-scene'),
		scenes: () => target!.querySelectorAll('[data-part=scene]').length,
		ctas: () => target!.querySelectorAll('[data-part=next-cta]').length
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	listeners.clear();
	hoisted.load.mockReset();
});

describe('/today', () => {
	it('Given_Ledger12Due_When_Mount_Then_LuyenHomNayAndReviewsScene', async () => {
		// Arrange
		current = build(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.cta()).toBe('Luyện hôm nay');
		expect(page.scene()).toBe('reviews-due');
	});

	it('Given_NoSession_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.scenes()).toBe(0);
		expect(page.ctas()).toBe(0);
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_RejectingLedger_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.scenes()).toBe(0);
		expect(page.ctas()).toBe(0);
	});

	it('Given_ReviewsCta_When_LedgerEmitsNoDue_Then_TiepTucBai1', async () => {
		// Arrange
		current = build(12);
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		publish(build(0));
		await settle();

		// Assert
		expect(page.cta()).toBe('Tiếp tục Bài 1');
		expect(page.scene()).toBe('lesson-next');
	});
});
