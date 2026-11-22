import { describe, expect, it } from 'vitest';
import { todayView } from '../../(app)/(tabs)/practice/today';
import { thiChips } from '../../(app)/(tabs)/practice/thi';
import { skillTiles } from '../../(app)/(tabs)/practice/tiles';
import { wordsPreview } from '../../(app)/(tabs)/practice/words';
import { SCENARIOS, withLevel } from './scenarios';

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

	it('Given_Mix_When_SkillTiles_Then_Counts6_4_2', () => {
		// Arrange
		const state = withLevel(SCENARIOS.mix(now), 1);
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles.slice(0, 3).map((t) => t.count)).toEqual([6, 4, 2]);
	});

	it('Given_Words_When_WordsPreview_Then_Count30', () => {
		// Arrange
		const state = withLevel(SCENARIOS.words(), 1);
		// Act
		const view = wordsPreview(state, now);
		// Assert
		expect(view.count).toBe(30);
		expect(view.hanzi).toHaveLength(8);
	});

	it('Given_Level5Ready_When_ThiChips_Then_Ready5', () => {
		// Arrange
		const state = withLevel(SCENARIOS.mix(now), 5, true);
		// Act
		const view = thiChips(state);
		// Assert
		expect(view.selected).toBe(5);
		expect(view.chips[4].line).toBe('ready');
	});
});
