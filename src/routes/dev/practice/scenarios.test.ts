import { describe, expect, it } from 'vitest';
import { todayView } from '../../(app)/(tabs)/practice/today';
import { SCENARIOS } from './scenarios';

const now = new Date('2026-11-09T05:00:00Z');

describe('/dev/practice scenarios', () => {
	it('Given_EachScenario_When_TodayView_Then_MatchesLabel', () => {
		// Arrange / Act
		const mix = todayView(SCENARIOS.mix(now), now);
		const clear = todayView(SCENARIOS.clear(), now);
		const onlyNew = todayView(SCENARIOS.onlyNew(), now);

		// Assert
		expect(mix?.chips).toHaveLength(3);
		expect(mix?.minutes).toBe(3);
		expect(clear).toBeNull();
		expect(onlyNew).toEqual({ chips: [{ skill: 'the', n: 1 }], minutes: 1 });
	});
});
