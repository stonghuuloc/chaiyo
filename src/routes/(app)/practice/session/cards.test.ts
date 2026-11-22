import { initialState, type Skill, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { sessionCards, skillParam } from './cards';

const past = '2026-11-01T00:00:00.000Z';
const now = new Date('2026-11-23T08:00:00.000Z');
const build = (due: Partial<Record<Skill, number>>): State => {
	const state = initialState({ curriculum: { lessons: [] } });
	for (const skill of ['the', 'nghe', 'viet'] as Skill[]) {
		for (let i = 0; i < (due[skill] ?? 0); i++) {
			const word = `${skill}${i}`;
			state.lexicon[word] ??= { saved: false, cards: {} };
			state.lexicon[word].cards[skill] = { due: past, first: past, fsrs: {} };
		}
	}
	return state;
};

describe('skillParam', () => {
	it.each(['the', 'nghe', 'viet'] as const)(
		'Given_KnownSkill_%s_When_SkillParam_Then_Same',
		(s) => {
			// Arrange
			// Act
			const out = skillParam(s);
			// Assert
			expect(out).toBe(s);
		}
	);

	it.each([null, '', 'xyz', 'THE'])(
		'Given_NullEmptyOrUnknown_%s_When_SkillParam_Then_Null',
		(raw) => {
			// Arrange
			// Act
			const out = skillParam(raw);
			// Assert
			expect(out).toBeNull();
		}
	);
});

describe('sessionCards', () => {
	it('Given_6The4Nghe2Viet_When_SessionCardsMixed_Then_12Interleaved', () => {
		// Arrange
		const state = build({ the: 6, nghe: 4, viet: 2 });
		// Act
		const cards = sessionCards(state, now, null);
		// Assert
		expect(cards).toHaveLength(12);
		expect(cards.slice(0, 6).map((c) => c.skill)).toEqual([
			'the',
			'nghe',
			'viet',
			'the',
			'nghe',
			'viet'
		]);
	});

	it('Given_6The4Nghe2Viet_When_SessionCardsNghe_Then_4Nghe', () => {
		// Arrange
		const state = build({ the: 6, nghe: 4, viet: 2 });
		// Act
		const cards = sessionCards(state, now, 'nghe');
		// Assert
		expect(cards).toHaveLength(4);
		expect(cards.every((c) => c.skill === 'nghe')).toBe(true);
	});

	it('Given_SavedWordWithoutCard_When_SessionCardsMixed_Then_OneThe', () => {
		// Arrange
		const state = build({});
		state.lexicon.fresh = { saved: true, cards: {} };
		// Act
		const cards = sessionCards(state, now, null);
		// Assert
		expect(cards).toEqual([{ word: 'fresh', skill: 'the' }]);
	});
});
