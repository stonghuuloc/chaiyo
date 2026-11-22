import { CURRICULUM } from '#lib/curriculum/index.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { gateSummary } from './summary';

const gate = { kind: 'gate', lesson: 'h1-01', run: 'r', of: 10 } as const;

describe('gateSummary', () => {
	it('Given_NoRuns_When_Summarise_Then_Empty', () => {
		// Arrange
		const s = initialState({ curriculum: CURRICULUM });

		// Act
		const got = gateSummary(s, 'h1-01');

		// Assert
		expect(got).toEqual({ best: null, runs: 0, open: 0, answers: 0 });
	});

	it('Given_ClosedAndOpenGateRuns_When_Summarise_Then_CountsAndBest', () => {
		// Arrange
		const base = initialState({ curriculum: CURRICULUM });
		const s: State = {
			...base,
			lessons: { ...base.lessons, 'h1-01': { ...base.lessons['h1-01'], best: 80 } },
			runs: {
				a: { step: { ...gate, run: 'a' }, answers: { q1: true }, closed: true },
				b: { step: { ...gate, run: 'b' }, answers: { q1: true, q2: false } },
				c: {
					step: { kind: 'section', lesson: 'h1-01', section: 'words', run: 'c', of: 1 },
					answers: {}
				}
			}
		};

		// Act
		const got = gateSummary(s, 'h1-01');

		// Assert
		expect(got).toEqual({ best: 80, runs: 2, open: 1, answers: 2 });
	});
});
