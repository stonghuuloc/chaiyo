import { describe, expect, it } from 'vitest';
import { todayView } from '../../(app)/(tabs)/practice/today';
import { roadmapSlice } from '../../(app)/(tabs)/today/roadmap';
import { SCENARIOS, type ScenarioKey } from './scenarios';

const rows: [ScenarioKey, number | null, string[], number][] = [
	['ac3', 3, ['now', 'locked', 'locked', 'locked'], 0],
	['empty', null, ['done', 'now', 'locked', 'locked'], 0],
	['start', null, ['now', 'locked', 'locked', 'locked'], 0],
	['ac6', null, ['done', 'now', 'locked', 'locked'], 0],
	['end', null, ['done', 'done', 'done', 'done'], 0],
	['friends3', null, ['done', 'now', 'locked', 'locked'], 3],
	['friends0', null, ['done', 'now', 'locked', 'locked'], 0]
];

describe('dev today-rows scenarios', () => {
	it.each(rows)(
		'Given_EachScenario_When_Views_Then_ExpectedRows (%s)',
		(key, minutes, statuses, friends) => {
			// Act
			const scenario = SCENARIOS[key]();

			// Assert
			expect(todayView(scenario.state, scenario.now)?.minutes ?? null).toBe(minutes);
			expect(roadmapSlice(scenario.state).map((r) => r.status)).toEqual(statuses);
			expect(scenario.friends).toHaveLength(friends);
		}
	);

	it('Given_Scenarios_When_Listed_Then_SevenKeys', () => {
		expect(Object.keys(SCENARIOS)).toEqual(rows.map(([k]) => k));
	});

	it('Given_Ac3_When_TodayView_Then_SixNgheFourVietTwoKinds', () => {
		// Act
		const { state, now } = SCENARIOS.ac3();

		// Assert
		expect(todayView(state, now)?.chips).toEqual([
			{ skill: 'the', n: 6 },
			{ skill: 'nghe', n: 4 },
			{ skill: 'viet', n: 2 }
		]);
	});
});
