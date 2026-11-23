import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	apply,
	BADGE_ART,
	badgesView,
	initialState,
	localDate,
	BADGES,
	type BadgeId,
	type State,
	type StudyEvent
} from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { practice } from '#lib/study/fixtures/streak.js';

const fresh = () => initialState({ curriculum: CURRICULUM });
const words = (n: number) =>
	Object.fromEntries(
		Array.from({ length: n }, (_, i) => [`w${i}`, { saved: true, cards: {} }])
	) as State['lexicon'];

const reference = (): State => ({
	...fresh(),
	badges: { first: '2026-10-12T05:00:00Z', streak7: '2026-10-17T18:30:00Z' },
	streak: { count: 12, best: 12, freezes: 0 },
	lexicon: words(12)
});

const ids = (rows: { id: BadgeId }[]) => rows.map((r) => r.id);

describe('badgesView', () => {
	it('reference learner earns first and streak7 with dates 12/10 and 18/10', () => {
		// Arrange
		const state = reference();

		// Act
		const view = badgesView(state);

		// Assert
		expect(view.total).toBe(9);
		expect(view.kind).toBe('some');
		expect(ids(view.earned)).toEqual(['first', 'streak7']);
		expect(view.earned.map((e) => e.date)).toEqual(['12/10', '18/10']);
		expect(view.earned.map((e) => e.title)).toEqual(['Bước đầu tiên', 'Chuỗi 7 ngày']);
		expect(view.soon).toHaveLength(7);
	});

	it('reference learner orders locked streak30 streak100 words100 words300 write50 hsk1 hsk2', () => {
		// Arrange
		const state = reference();

		// Act
		const view = badgesView(state);

		// Assert
		expect(ids(view.soon)).toEqual([
			'streak30',
			'streak100',
			'words100',
			'words300',
			'write50',
			'hsk1',
			'hsk2'
		]);
		expect(view.rest).toEqual([]);
	});

	it('streak30 has have 12 need 30 and hsk1 has need null', () => {
		// Arrange
		const view = badgesView(reference());

		// Act
		const streak30 = view.soon.find((b) => b.id === 'streak30');
		const hsk1 = view.soon.find((b) => b.id === 'hsk1');

		// Assert
		expect(streak30).toMatchObject({ have: 12, need: 30, pct: 40 });
		expect(hsk1).toMatchObject({ need: null });
	});

	it('first as a locked badge has need null', () => {
		// Arrange
		const state: State = { ...reference(), badges: { streak7: '2026-10-17T18:30:00Z' } };

		// Act
		const first = badgesView(state).soon.find((b) => b.id === 'first');

		// Assert
		expect(first).toMatchObject({ have: 0, need: null });
	});

	it('best 25 with count 2 gives streak30 have 25', () => {
		// Arrange
		const state: State = { ...fresh(), streak: { count: 2, best: 25, freezes: 0 } };

		// Act
		const streak30 = badgesView(state).soon.find((b) => b.id === 'streak30');

		// Assert
		expect(streak30).toMatchObject({ have: 25, need: 30 });
	});

	it('fresh state is kind none with soon first streak7 streak30 and 6 rest', () => {
		// Arrange
		const state = fresh();

		// Act
		const view = badgesView(state);

		// Assert
		expect(view.kind).toBe('none');
		expect(view.earned).toEqual([]);
		expect(ids(view.soon)).toEqual(['first', 'streak7', 'streak30']);
		expect(ids(view.rest)).toEqual([
			'write50',
			'streak100',
			'words100',
			'words300',
			'hsk1',
			'hsk2'
		]);
	});

	it('all nine earned is kind all with no locked', () => {
		// Arrange
		const state: State = {
			...fresh(),
			badges: Object.fromEntries(BADGES.map(([id]) => [id, '2026-10-12T05:00:00Z']))
		};

		// Act
		const view = badgesView(state);

		// Assert
		expect(view.kind).toBe('all');
		expect(view.earned).toHaveLength(9);
		expect(view.soon).toEqual([]);
		expect(view.rest).toEqual([]);
	});

	it('late-evening UTC award shows next local day in Asia/Ho_Chi_Minh', () => {
		// Arrange
		const state: State = { ...fresh(), badges: { first: '2026-10-17T18:30:00Z' } };

		// Act
		const view = badgesView(state);

		// Assert
		expect(view.earned[0].date).toBe('18/10');
	});

	it('a badge absent from state.badges never appears in earned', () => {
		// Arrange
		const state: State = { ...reference(), badges: { streak7: '2026-10-17T18:30:00Z' } };

		// Act
		const view = badgesView(state);

		// Assert
		expect(ids(view.earned)).toEqual(['streak7']);
		expect(ids(view.soon)).toContain('first');
	});

	it('have above need clamps pct to 100', () => {
		// Arrange
		const state: State = { ...fresh(), written: 80 };

		// Act
		const write50 = badgesView(state).soon.find((b) => b.id === 'write50');

		// Assert
		expect(write50).toMatchObject({ have: 80, need: 50, pct: 100 });
	});

	it('replayed BadgeEarned events equal earned ids and dates', () => {
		// Arrange
		let state = fresh();
		const emitted: { badge: BadgeId; at: string }[] = [];
		const collect = (events: StudyEvent[], at: string) => {
			for (const e of events) if (e.type === 'BadgeEarned') emitted.push({ badge: e.badge, at });
		};

		// Act
		for (let d = 0; d < 7; d++) {
			const day = new Date(Date.parse('2026-10-12T05:00:00Z') + d * 86_400_000);
			for (const a of practice(`p-${d}`, ['你'], day)) {
				const out = apply(state, a, new Date(a.at));
				state = out.state;
				collect(out.events, a.at);
			}
		}
		const view = badgesView(state);

		// Assert
		expect(emitted.length).toBeGreaterThan(0);
		expect(ids(view.earned)).toEqual(
			BADGES.map(([id]) => id).filter((id) => emitted.some((e) => e.badge === id))
		);
		for (const e of view.earned) {
			const at = emitted.find((x) => x.badge === e.id)!.at;
			const [, mm, dd] = localDate(new Date(at), state.tz).split('-');
			expect(e.date).toBe(`${dd}/${mm}`);
		}
	});

	it('every art id has a file in static/badges', () => {
		// Arrange
		const arts = new Set(Object.values(BADGE_ART));

		// Act
		const missing = [...arts].filter((a) => !existsSync(`static/badges/${a}.webp`));

		// Assert
		expect(missing).toEqual([]);
	});
});
