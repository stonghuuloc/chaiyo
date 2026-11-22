import { flushSync, mount, tick, unmount } from 'svelte';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type Skill, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const past = '2026-11-01T00:00:00.000Z';
const curriculum = {
	lessons: [
		{ id: 'a', level: 1, sections: [], words: [] },
		{ id: 'b', level: 2, sections: [], words: [] },
		{ id: 'c', level: 3, sections: [], words: [] }
	]
};
const build = (due: Partial<Record<Skill, number>>, unlockedTo = 1): State => {
	const state = initialState({ curriculum });
	for (const l of curriculum.lessons) state.lessons[l.id].unlocked = l.level <= unlockedTo;
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (due[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: past, first: past, fsrs: {} };
		}
	}
	return state;
};

const hoisted = vi.hoisted(() => ({ load: vi.fn() }));
let current: State = build({});
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
		title: () => target!.querySelector('[data-part=today-title]')?.textContent?.trim(),
		chips: () =>
			[...target!.querySelectorAll('[data-part=today-chip]')].map((c) => c.textContent?.trim()),
		tiles: () => target!.querySelectorAll('[data-part=skill-tile]').length,
		subs: () =>
			[...target!.querySelectorAll('[data-part=skill-tile] small')].map((c) =>
				c.textContent?.trim()
			),
		thiChips: () => target!.querySelectorAll('[data-part=thi-chip]').length,
		thiLocks: () =>
			[...target!.querySelectorAll('[data-part=thi-chip]:has([data-part=thi-lock])')].map((c) =>
				c.getAttribute('data-level')
			),
		words: () => target!.querySelector('[data-part=mywords-link]')?.textContent?.trim(),
		starts: () => target!.querySelectorAll('[data-part=today-start]').length,
		text: () => target!.textContent
	};
};

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	listeners.clear();
	hoisted.load.mockReset();
});

describe('/practice', () => {
	it('Given_Ledger6_4_2_When_Mount_Then_CardWithThreeMinutes', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.title()).toBe('Luyện hôm nay · khoảng 3 phút');
		expect(page.chips()).toEqual(['6 thẻ từ', '4 nghe', '2 viết chữ']);
	});

	it('Given_NoSession_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.title()).toBeUndefined();
		expect(page.text()).not.toContain('xong bài rồi');
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_RejectingLedger_When_Mount_Then_OnlyH1_NoClearCopy', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.title()).toBeUndefined();
		expect(page.text()).not.toContain('xong bài rồi');
	});

	it('Given_EmptyState_When_Mount_Then_ClearCopyAndNoStart', async () => {
		// Arrange
		current = build({});
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.text()).toContain('Hôm nay xong bài rồi!');
		expect(page.starts()).toBe(0);
	});

	it('Given_CardShown_When_LedgerEmitsOneFewerNghe_Then_ChipUpdates', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		expect(page.chips()).toContain('4 nghe');

		// Act
		publish(build({ the: 6, nghe: 3, viet: 2 }));
		await settle();

		// Assert
		expect(page.chips()).toContain('3 nghe');
	});

	it('Given_SessionNullAfterMount_When_PropChanges_Then_CardGone', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);
		const data = $state({ session: session as typeof session | null });
		const page = await mountPage(data);
		expect(page.title()).toBeDefined();

		// Act
		data.session = null;
		await settle();

		// Assert
		expect(page.title()).toBeUndefined();
		expect(listeners.size).toBe(0);
	});

	it('Given_Ledger6_4_2_When_Mount_Then_FiveTiles', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.tiles()).toBe(5);
		expect(page.subs().slice(0, 3)).toEqual(['6 từ cần ôn', '4 từ cần ôn', '2 từ cần ôn']);
	});

	it('Given_RejectingLedger_When_Mount_Then_NoTiles', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.tiles()).toBe(0);
	});

	it('Given_TilesShown_When_LedgerEmitsOneFewerNghe_Then_3TuCanOn', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		expect(page.subs()[1]).toBe('4 từ cần ôn');

		// Act
		publish(build({ the: 6, nghe: 3, viet: 2 }));
		await settle();

		// Assert
		expect(page.subs()[1]).toBe('3 từ cần ôn');
	});

	it('Given_EmptyState_When_Mount_Then_ClearCopyAndFiveTiles', async () => {
		// Arrange
		current = build({});
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.text()).toContain('Hôm nay xong bài rồi!');
		expect(page.tiles()).toBe(5);
		expect(page.subs()[0]).toBe('Không có từ cần ôn');
	});

	it('Given_Ledger_When_Mount_Then_SixChipsAndWordsLink', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.thiChips()).toBe(6);
		expect(page.words()).toContain('12 từ đã học và đã lưu');
	});

	it('Given_RejectingLedger_When_Mount_Then_NoChipsNoWordsLink', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.thiChips()).toBe(0);
		expect(page.words()).toBeUndefined();
	});

	it('Given_Level1_When_LedgerEmitsLevel2Unlocked_Then_Hsk2LockGone', async () => {
		// Arrange
		current = build({}, 1);
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		expect(page.thiLocks()).toContain('2');

		// Act
		publish(build({}, 2));
		await settle();

		// Assert
		expect(page.thiLocks()).not.toContain('2');
		expect(page.thiLocks()).toContain('3');
	});

	it('Given_30Entries_When_LedgerEmits31_Then_31TuDaHoc', async () => {
		// Arrange
		current = build({ the: 30 });
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		expect(page.words()).toContain('30 từ đã học và đã lưu');

		// Act
		publish(build({ the: 31 }));
		await settle();

		// Assert
		expect(page.words()).toContain('31 từ đã học và đã lưu');
	});
});
