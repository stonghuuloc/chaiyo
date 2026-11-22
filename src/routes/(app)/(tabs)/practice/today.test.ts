import { initialState, type Skill, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { todayView } from './today';

const now = new Date('2026-11-09T05:00:00Z');
const past = '2026-11-01T00:00:00.000Z';

const build = (due: Partial<Record<Skill, number>>, dueAt = past): State => {
	const state = initialState({ curriculum: { lessons: [] } });
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (due[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: dueAt, first: past, fsrs: {} };
		}
	}
	return state;
};

describe('todayView', () => {
	it('Given_6The4Nghe2Viet_When_TodayView_Then_ChipsAndThreeMinutes', () => {
		// Arrange
		const state = build({ the: 6, nghe: 4, viet: 2 });

		// Act
		const view = todayView(state, now);

		// Assert
		expect(view).toEqual({
			chips: [
				{ skill: 'the', n: 6 },
				{ skill: 'nghe', n: 4 },
				{ skill: 'viet', n: 2 }
			],
			minutes: 3
		});
	});

	it('Given_NoNgheDue_When_TodayView_Then_NoNgheChip', () => {
		// Arrange
		const state = build({ the: 5, viet: 2 });

		// Act
		const view = todayView(state, now);

		// Assert
		expect(view?.chips).toEqual([
			{ skill: 'the', n: 5 },
			{ skill: 'viet', n: 2 }
		]);
	});

	it('Given_SavedWordWithoutCard_When_TodayView_Then_OneTheOneMinute', () => {
		// Arrange
		const state = build({});
		state.lexicon['x'] = { saved: true, cards: {} };

		// Act
		const view = todayView(state, now);

		// Assert
		expect(view).toEqual({ chips: [{ skill: 'the', n: 1 }], minutes: 1 });
	});

	it('Given_NothingDueNoNewWord_When_TodayView_Then_Null', () => {
		// Arrange
		const state = build({});

		// Act
		const view = todayView(state, now);

		// Assert
		expect(view).toBeNull();
	});

	it('Given_CardDueAtLocalMidnight_When_NowOneSecondBefore_Then_NotCounted_And_CountedAt', () => {
		// Arrange
		const state = build({ the: 1 }, '2026-11-09T17:00:00Z');

		// Act
		const before = todayView(state, new Date('2026-11-09T16:59:59Z'));
		const at = todayView(state, new Date('2026-11-09T17:00:00Z'));

		// Assert
		expect(before).toBeNull();
		expect(at?.chips).toEqual([{ skill: 'the', n: 1 }]);
	});
});
