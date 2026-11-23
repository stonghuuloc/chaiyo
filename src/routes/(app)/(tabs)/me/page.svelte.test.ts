import { CURRICULUM } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { flushSync, mount, tick, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { outlineIds } from '../roadmap/roadmap';
import Page from './+page.svelte';

const TODAY = '2026-11-23';
const learner = (words: number, passed: string[] = []): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (let i = 0; i < words; i++) state.lexicon[`w${i}`] = { saved: true, cards: {} };
	for (const id of passed) state.lessons[id].passed = true;
	state.streak = { count: 12, last: TODAY, freezes: 1, best: 12 };
	return state;
};

const hoisted = vi.hoisted(() => ({ load: vi.fn(), profile: vi.fn() }));
let current: State = learner(12);
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
vi.mock('#lib/supabase.js', () => ({ supabase: {} }));
vi.mock('../../settings/profile', () => ({ loadProfile: hoisted.profile }));

type Session = {
	user: {
		id: string;
		email?: string;
		created_at: string;
		user_metadata: Record<string, string>;
	};
};
const session: Session = {
	user: {
		id: 'u1',
		email: 'loc@example.com',
		created_at: '2026-10-05T03:00:00Z',
		user_metadata: { full_name: 'Google Name' }
	}
};
let target: HTMLDivElement | undefined;
let app: Record<string, unknown> | undefined;

const settle = async () => {
	flushSync();
	await tick();
	await Promise.resolve();
	flushSync();
};

const mountPage = async (data: { session: Session | null } = { session }) => {
	target = document.createElement('div');
	document.body.append(target);
	app = mount(Page, { target, props: { data } as never }) as Record<string, unknown>;
	await settle();
	return {
		h1: () => target!.querySelectorAll('h1').length,
		h1Text: () => target!.querySelector('h1')?.textContent?.trim(),
		goal: () =>
			target!.querySelector('[data-part=me-goal]')?.textContent?.replace(/\s+/g, ' ').trim(),
		title: () => target!.querySelector('[data-part=me-level] h2')?.textContent?.trim(),
		line: () => target!.querySelector('[data-part=me-line]')?.textContent?.trim(),
		joined: () => target!.querySelector('h1 + p')?.textContent?.trim(),
		hero: () => target!.querySelector('[data-part=me-hero]'),
		memory: () => target!.querySelector('[data-part=me-memory]'),
		prog: () =>
			[...target!.querySelectorAll('[data-part=me-prog] > div')].map((r) =>
				[r.children[0], r.children[1]].map((e) => e.textContent?.trim())
			),
		streak: () =>
			[...target!.querySelectorAll('[data-part=me-streak] > span')].map((e) =>
				e.textContent?.replace(/\s+/g, ' ').trim()
			)
	};
};

beforeEach(() => {
	hoisted.profile.mockResolvedValue({ name: 'Tống Lộc', photo: null, hidden: false });
	vi.useFakeTimers({ toFake: ['Date'] });
	vi.setSystemTime(new Date('2026-11-23T10:00:00+07:00'));
});

afterEach(() => {
	if (app) unmount(app as never);
	target?.remove();
	target = app = undefined;
	listeners.clear();
	hoisted.load.mockReset();
	hoisted.profile.mockReset();
	vi.useRealTimers();
});

describe('/me', () => {
	it('Given_ReferenceLearner_When_Open_Then_0of40And12of300', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.prog()).toEqual([
			['Bài học', '0/40'],
			['Từ vựng', '12/300']
		]);
	});

	it('Given_ReferenceLearner_When_Open_Then_StreakTexts', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.streak()).toEqual(['12 ngày liền', 'Còn 1 lượt đóng băng', 'Kỷ lục 12 ngày']);
	});

	it('Given_Ac2LearnerAfterRemount_When_Open_Then_3of40And40of300', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		await mountPage();
		unmount(app as never);
		target!.remove();
		current = learner(40, ['h1-01', 'h1-02', 'h1-03']);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.prog()).toEqual([
			['Bài học', '3/40'],
			['Từ vựng', '40/300']
		]);
	});

	it('Given_NextStatePublished_When_Render_Then_TextsUpdate', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();

		// Act
		publish(learner(40, ['h1-01', 'h1-02', 'h1-03']));
		flushSync();

		// Assert
		expect(page.prog()).toEqual([
			['Bài học', '3/40'],
			['Từ vựng', '40/300']
		]);
	});

	it('Given_NoSession_When_Open_Then_OnlyHiddenHeading', async () => {
		// Arrange
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage({ session: null });

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.h1Text()).toBe('Tài khoản');
		expect(page.hero()).toBeNull();
		expect(page.memory()).toBeNull();
		expect(hoisted.load).not.toHaveBeenCalled();
	});

	it('Given_Page_When_Open_Then_MemorySectionPresent', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.memory()).not.toBeNull();
		expect(page.memory()!.querySelectorAll('li')).toHaveLength(3);
	});

	it('Given_Profile_When_Open_Then_NameAndJoined', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1()).toBe(1);
		expect(page.h1Text()).toBe('Tống Lộc');
		expect(page.joined()).toBe('Học từ tháng 10/2026');
	});

	it('Given_EmptyProfileName_When_Open_Then_MetadataName', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		hoisted.profile.mockResolvedValue({ name: '', photo: null, hidden: false });

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1Text()).toBe('Google Name');
	});

	it('Given_ProfileLoadRejects_When_Open_Then_MetadataNameAndHero', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		hoisted.profile.mockRejectedValue(new Error('boom'));

		// Act
		const page = await mountPage();

		// Assert
		expect(page.h1Text()).toBe('Google Name');
		expect(page.hero()).not.toBeNull();
		expect(page.title()).toBe('HSK 1 · 0%');
	});

	it('Given_NoNames_When_Open_Then_EmailLocalPart', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		hoisted.profile.mockResolvedValue({ name: '', photo: null, hidden: false });

		// Act
		const page = await mountPage({ session: { user: { ...session.user, user_metadata: {} } } });

		// Assert
		expect(page.h1Text()).toBe('loc');
	});

	it('Given_ReferenceLearner_When_Open_Then_TitlePct0AndLine1', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);

		// Act
		const page = await mountPage();

		// Assert
		expect(page.title()).toBe('HSK 1 · 0%');
		expect(page.line()).toBe('Vừa vào cấp, đang học Bài 1. Khởi đầu ngon rồi đó!');
		expect(page.goal()).toBe('Mốc tiếp theo: Thi thử HSK 1 sau Bài 40, đỗ là mở HSK 2.');
	});

	it('Given_TenPassedPublished_When_Render_Then_Line2Pct25', async () => {
		// Arrange
		current = learner(12);
		hoisted.load.mockResolvedValue(ledger);
		const page = await mountPage();
		const next = learner(12);
		for (const id of outlineIds(1).slice(0, 10))
			next.lessons[id] = { unlocked: true, passed: true, done: [] };

		// Act
		publish(next);
		flushSync();

		// Assert
		expect(page.title()).toBe('HSK 1 · 25%');
		expect(page.line()).toBe('Đang học Bài 11. Đi được một đoạn rồi, cứ đều đều nhé.');
	});
});
