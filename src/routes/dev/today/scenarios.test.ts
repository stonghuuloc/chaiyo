import { describe, expect, it } from 'vitest';
import { todayState } from '../../(app)/(tabs)/today/today';
import { SCENARIOS, type ScenarioKey } from './scenarios';

const NOW = new Date('2026-11-20T03:00:00Z');

const rows: [ScenarioKey, string, string][] = [
	['reviews', 'reviews', 'reviews-due'],
	['lesson', 'lesson', 'lesson-next'],
	['thi', 'thi', 'lesson-next'],
	['xong', 'done', 'day-done'],
	['freezeUsed', 'lesson', 'freeze-used'],
	['atRisk', 'reviews', 'streak-at-risk'],
	['dayDone', 'reviews', 'day-done']
];

describe('dev/today scenarios', () => {
	it.each(rows)(
		'Given_EachScenario_When_TodayState_Then_NamedCtaAndScene (%s)',
		(key, kind, scene) => {
			// Arrange
			const state = SCENARIOS[key](NOW);

			// Act
			const view = todayState(state, NOW);

			// Assert
			expect(view.cta.kind).toBe(kind);
			expect(view.scene).toBe(scene);
		}
	);

	it('Given_Scenarios_When_Listed_Then_SevenKeys', () => {
		// Assert
		expect(Object.keys(SCENARIOS)).toHaveLength(7);
	});
});
