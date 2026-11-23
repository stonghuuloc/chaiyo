import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { todayState } from './today';

const NOW = new Date('2026-11-20T03:00:00Z');
const PAST = '2026-11-01T00:00:00.000Z';

const build = (
	o: {
		due?: number;
		passed?: string[];
		unlocked?: string[];
		streak?: State['streak'];
	} = {}
): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (const id of o.passed ?? []) state.lessons[id] = { ...state.lessons[id], passed: true };
	for (const id of o.unlocked ?? []) state.lessons[id] = { ...state.lessons[id], unlocked: true };
	for (let i = 0; i < (o.due ?? 0); i++) {
		state.lexicon[`w${i}`] = {
			saved: false,
			cards: { the: { due: PAST, first: PAST, fsrs: {} } }
		};
	}
	if (o.streak) state.streak = o.streak;
	return state;
};

const bai1Open = (o: { due?: number; streak?: State['streak'] } = {}) => {
	const state = build({ ...o, passed: ['h0-00'], unlocked: ['h1-01'] });
	state.lessons['h1-01'].done = ['words'];
	return state;
};

const IDS = CURRICULUM.lessons.map((l) => l.id);

describe('todayState', () => {
	it('Given_12Due_When_TodayState_Then_ReviewsCta', () => {
		// Arrange
		const state = build({ due: 12 });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'reviews' });
	});

	it('Given_0DueBai1Open_When_TodayState_Then_LessonH1_01N1', () => {
		// Arrange
		const state = bai1Open();

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'lesson', id: 'h1-01', n: 1 });
	});

	it('Given_AllPassed_When_TodayState_Then_ThiLevel5', () => {
		// Arrange
		const state = build({ passed: IDS, unlocked: IDS });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'thi', level: 5 });
	});

	it('Given_NothingUnlocked_When_TodayState_Then_Done', () => {
		// Arrange
		const state = build();
		state.lessons['h0-00'].unlocked = false;

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'done' });
	});

	it('Given_5SavedWordsNoCards_When_TodayState_Then_Lesson', () => {
		// Arrange
		const state = bai1Open();
		for (let i = 0; i < 5; i++) state.lexicon[`s${i}`] = { saved: true, cards: {} };

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta.kind).toBe('lesson');
	});

	it('Given_CardDueAtLocalMidnight_When_NowBeforeAndAt_Then_DueFlips', () => {
		// Arrange
		const state = bai1Open();
		const due = '2026-11-09T17:00:00.000Z';
		state.lexicon.w = { saved: false, cards: { the: { due, first: PAST, fsrs: {} } } as never };

		// Act
		const before = todayState(state, new Date('2026-11-09T16:59:59Z'));
		const at = todayState(state, new Date('2026-11-09T17:00:00Z'));

		// Assert
		expect(before.cta.kind).toBe('lesson');
		expect(at.cta.kind).toBe('reviews');
	});

	it('Given_AnySkillCardDue_When_TodayState_Then_ReviewsCta', () => {
		// Arrange
		const state = bai1Open();
		const future = '2027-01-01T00:00:00.000Z';
		state.lexicon.w = {
			saved: false,
			cards: {
				the: { due: future, first: PAST, fsrs: {} },
				nghe: { due: future, first: PAST, fsrs: {} },
				viet: { due: PAST, first: PAST, fsrs: {} }
			}
		};

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta.kind).toBe('reviews');
	});

	it('Given_H1_05PassedH2_01Unlocked_When_TodayState_Then_LessonN41', () => {
		// Arrange
		const state = build({
			passed: ['h0-00', 'h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05'],
			unlocked: ['h1-01', 'h1-02', 'h1-03', 'h1-04', 'h1-05', 'h2-01']
		});

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'lesson', id: 'h2-01', n: 41 });
	});

	it('Given_LevelNotFinishedNoOpenLesson_When_TodayState_Then_Done', () => {
		// Arrange
		const state = build({ passed: ['h0-00'] });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.cta).toEqual({ kind: 'done' });
	});

	it('Given_CountedDayWith12Due_When_TodayState_Then_ReviewsCtaDayDoneScene', () => {
		// Arrange
		const state = build({
			due: 12,
			streak: { count: 5, last: '2026-11-20', freezes: 0, through: '2026-11-20' }
		});

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view).toEqual({ cta: { kind: 'reviews' }, scene: 'day-done' });
	});

	it('Given_FreezeSpentYesterday_When_TodayState_Then_FreezeUsed', () => {
		// Arrange
		const state = build({ streak: { count: 5, last: '2026-11-18', freezes: 1 } });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('freeze-used');
	});

	it('Given_NoFreezeCountFive_When_TodayState_Then_StreakAtRisk', () => {
		// Arrange
		const state = build({ due: 12, streak: { count: 5, last: '2026-11-19', freezes: 0 } });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('streak-at-risk');
	});

	it('Given_FreshStreak12Due_When_TodayState_Then_ReviewsDue', () => {
		// Arrange
		const state = build({ due: 12 });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('reviews-due');
	});

	it('Given_FreshStreakBai1_When_TodayState_Then_LessonNext', () => {
		// Arrange
		const state = bai1Open();

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('lesson-next');
	});

	it('Given_ThiCta_When_TodayState_Then_LessonNext', () => {
		// Arrange
		const state = build({ passed: IDS, unlocked: IDS });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('lesson-next');
	});

	it('Given_FreezeThenResetBeforeYesterday_When_TodayState_Then_CtaScene', () => {
		// Arrange
		const state = build({ due: 12, streak: { count: 5, last: '2026-11-17', freezes: 1 } });

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view.scene).toBe('reviews-due');
	});

	it('Given_DoneCta_When_TodayState_Then_DayDone', () => {
		// Arrange
		const state = build();
		state.lessons['h0-00'].unlocked = false;

		// Act
		const view = todayState(state, NOW);

		// Assert
		expect(view).toEqual({ cta: { kind: 'done' }, scene: 'day-done' });
	});
});
