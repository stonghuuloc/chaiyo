import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type Card, type Skill, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { meStats } from './me';

const NOW = new Date('2026-11-23T03:00:00Z');
const TODAY = '2026-11-23';
const card = (fsrs: Record<string, unknown>): Card => ({
	due: '2026-12-01T00:00:00.000Z',
	first: '2026-11-01T00:00:00.000Z',
	fsrs
});

const learner = (o: { words?: number; passed?: string[]; last?: string } = {}): State => {
	const state = initialState({ curriculum: CURRICULUM });
	for (let i = 0; i < (o.words ?? 12); i++) {
		state.lexicon[`w${i}`] = { saved: true, cards: { the: card({ stability: 1 }) } };
	}
	for (const id of o.passed ?? []) state.lessons[id].passed = true;
	state.streak = { count: 12, last: o.last ?? TODAY, freezes: 1, best: 12 };
	return state;
};

describe('meStats', () => {
	it('Given_ReferenceLearner_When_MeStats_Then_Lessons0of40Words12of300', () => {
		// Arrange
		const state = learner();

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.lessons).toEqual({ have: 0, need: 40 });
		expect(stats.words).toEqual({ have: 12, need: 300 });
	});

	it('Given_ReferenceLearner_When_MeStats_Then_Streak12Freeze1Best12', () => {
		// Arrange
		const state = learner();

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.streak).toEqual({ count: 12, freezes: 1, best: 12 });
	});

	it('Given_ThreeLessonsAnd40Words_When_MeStats_Then_3of40And40of300', () => {
		// Arrange
		const state = learner({ words: 40, passed: ['h1-01', 'h1-02', 'h1-03'] });

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.lessons).toEqual({ have: 3, need: 40 });
		expect(stats.words).toEqual({ have: 40, need: 300 });
	});

	it('Given_OnlyPrimerPassed_When_MeStats_Then_0of40', () => {
		// Arrange
		const state = learner({ passed: ['h0-00'] });

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.lessons).toEqual({ have: 0, need: 40 });
	});

	it('Given_LastStudy3DaysAgoOneFreeze_When_MeStats_Then_Streak0Freeze0Best12', () => {
		// Arrange
		const state = learner({ last: '2026-11-20' });

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.streak).toEqual({ count: 0, freezes: 0, best: 12 });
	});

	it('Given_LastStudyYesterday_When_MeStats_Then_StoredStreak', () => {
		// Arrange
		const state = learner({ last: '2026-11-22' });

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.streak).toEqual({ count: 12, freezes: 1, best: 12 });
	});

	it('Given_NiHaoXie_When_MeStats_Then_BucketsPerSkill', () => {
		// Arrange
		const state = learner({ words: 0 });
		state.lexicon['你'] = {
			saved: false,
			cards: { the: card({ stability: 9 }), nghe: card({ stability: 3 }) }
		};
		state.lexicon['好'] = { saved: false, cards: { the: card({ stability: 2 }) } };
		state.lexicon['谢'] = { saved: true, cards: {} };

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.skills.map((s) => [s.skill, s.firm, s.shaky, s.unseen])).toEqual([
			['the', 1, 1, 1],
			['nghe', 0, 1, 2],
			['viet', 0, 0, 3]
		]);
	});

	it('Given_EmptyLexicon_When_MeStats_Then_AllZero', () => {
		// Arrange
		const state = learner({ words: 0 });

		// Act
		const stats = meStats(state, NOW);

		// Assert
		expect(stats.skills.map((s) => [s.firm, s.shaky, s.unseen, s.size])).toEqual([
			[0, 0, 0, 0],
			[0, 0, 0, 0],
			[0, 0, 0, 0]
		]);
	});

	it.each([[0], [5], [12]])('Given_AnyLexicon_When_MeStats_Then_BucketsSumToSize %i', (words) => {
		// Arrange
		const state = learner({ words });
		state.lexicon.fresh = {
			saved: false,
			cards: { nghe: card({}), viet: card({ stability: 30 }) }
		};

		// Act
		const stats = meStats(state, NOW);

		// Assert
		for (const s of stats.skills as {
			skill: Skill;
			firm: number;
			shaky: number;
			unseen: number;
			size: number;
		}[]) {
			expect(s.firm + s.shaky + s.unseen).toBe(words + 1);
			expect(s.size).toBe(words + 1);
		}
	});
});
