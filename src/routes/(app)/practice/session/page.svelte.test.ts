import { flushSync, mount, tick, unmount } from 'svelte';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type Skill, type State } from '#lib/study/index.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Page from './+page.svelte';

const past = '2026-11-01T00:00:00.000Z';
const build = (due: Partial<Record<Skill, number>>): State => {
	const state = initialState({ curriculum: { lessons: [] } });
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
vi.mock('#lib/audio/index.js', () => ({
	play: vi.fn(async () => true),
	player: { play: vi.fn(async () => true), url: (k: string) => `/a/${k}.mp3`, element: () => null }
}));

const session = { user: { id: 'u1' } };
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountPage = async (
	data: { session: typeof session | null; skill?: Skill | null } = { session }
) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, {
		target,
		props: { data: { skill: null, ...data } } as never
	}) as Record<string, unknown>;
	await settle();
	return {
		h1: () => target!.querySelectorAll('h1').length,
		of: () => target!.querySelector('[data-part=session-run]')?.getAttribute('data-of') ?? null,
		firstKind: () => target!.querySelector('[data-part=item]')?.getAttribute('data-kind') ?? null,
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

describe('/practice/session', () => {
	it('Given_Ledger6_4_2_NoSkill_When_Mount_Then_RunOf12FirstThe', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		await vi.waitFor(() => expect(page.firstKind()).toBe('the'));
		expect(page.of()).toBe('12');
	});

	it('Given_SkillNghe_When_Mount_Then_RunOf4FirstNghe', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session, skill: 'nghe' });

		// Assert
		await vi.waitFor(() => expect(page.firstKind()).toBe('nghe'));
		expect(page.of()).toBe('4');
	});

	it('Given_RunShown_When_LedgerPublishesEmpty_Then_StillOf12', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4, viet: 2 });
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		await vi.waitFor(() => expect(page.firstKind()).toBe('the'));

		// Act
		publish(build({}));
		await settle();

		// Assert
		expect(page.of()).toBe('12');
		expect(page.firstKind()).toBe('the');
	});

	it('Given_NoSession_When_Mount_Then_OnlyH1', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.of()).toBeNull();
		expect(page.text()).not.toContain('xong bài rồi');
	});

	it('Given_RejectingLedger_When_Mount_Then_OnlyH1_NoEmptyText', async () => {
		// Arrange
		hoisted.load.mockRejectedValue(new Error('idb'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.of()).toBeNull();
		expect(page.text()).not.toContain('xong bài rồi');
	});

	it('Given_SkillVietNoneDue_When_Mount_Then_ClearTitleNoList', async () => {
		// Arrange
		current = build({ the: 6, nghe: 4 });
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session, skill: 'viet' });

		// Assert
		expect(page.text()).toContain('Hôm nay xong bài rồi!');
		expect(page.of()).toBeNull();
	});
});
