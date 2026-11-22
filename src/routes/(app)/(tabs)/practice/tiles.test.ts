import { initialState, type Skill, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { todayView } from './today';
import { skillTiles } from './tiles';

const past = '2026-11-01T00:00:00.000Z';
const now = new Date('2026-11-23T08:00:00.000Z');
const curriculum = {
	lessons: [
		{ id: 'a', level: 1, sections: [], words: [] },
		{ id: 'b', level: 2, sections: [], words: [] },
		{ id: 'c', level: 3, sections: [], words: [] }
	]
};
const build = (due: Partial<Record<Skill, number>>, unlockedTo = 1): State => {
	const state = initialState({ curriculum });
	for (const l of curriculum.lessons) state.lessons[l.id].unlocked = l.level <= unlockedTo;
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (due[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: past, first: past, fsrs: {} };
		}
	}
	return state;
};

describe('skillTiles', () => {
	it('Given_6_4_2_Level1_When_SkillTiles_Then_FiveInOrderCounts6_4_2', () => {
		// Arrange
		const state = build({ the: 6, nghe: 4, viet: 2 });
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles.map((t) => t.key)).toEqual(['the', 'nghe', 'viet', 'noi', 'doan']);
		expect(tiles.slice(0, 3).map((t) => t.count)).toEqual([6, 4, 2]);
	});

	it('Given_6_0_2_When_SkillTiles_Then_NgheCount0', () => {
		// Arrange
		const state = build({ the: 6, viet: 2 });
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles[1].count).toBe(0);
	});

	it('Given_Level1_When_SkillTiles_Then_DoanClosed', () => {
		// Arrange
		const state = build({}, 1);
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles[4].open).toBe(false);
	});

	it('Given_Level3_When_SkillTiles_Then_DoanOpen', () => {
		// Arrange
		const state = build({}, 3);
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles[4].open).toBe(true);
	});

	it('Given_Placed2WithLevel3Unlocked_When_SkillTiles_Then_DoanOpen', () => {
		// Arrange
		const state = build({}, 3);
		state.placed = 2;
		// Act
		const tiles = skillTiles(state, now);
		// Assert
		expect(tiles[4].open).toBe(true);
	});

	it('Given_AnyState_When_SkillTiles_Then_HrefsSkillAndK', () => {
		// Arrange
		const state = build({});
		// Act
		const hrefs = skillTiles(state, now).map((t) => `${t.route}?${t.query}`);
		// Assert
		expect(hrefs[0]).toBe('/(app)/practice/session?skill=the');
		expect(hrefs[1]).toMatch(/\?skill=nghe$/);
		expect(hrefs[2]).toMatch(/\?skill=viet$/);
		expect(hrefs[3]).toMatch(/\/practice\/skill\?k=noi$/);
		expect(hrefs[4]).toMatch(/\?k=doan$/);
	});

	it('Given_6_4_2_When_SkillTiles_Then_TheCountEqualsTodayChip', () => {
		// Arrange
		const state = build({ the: 6, nghe: 4, viet: 2 });
		// Act
		const tile = skillTiles(state, now)[0];
		const chip = todayView(state, now)!.chips.find((c) => c.skill === 'the');
		// Assert
		expect(tile.count).toBe(chip!.n);
	});
});
