import { describe, expect, it } from 'vitest';
import { initialState, type State } from '#lib/study/index.js';
import { resume } from './resume';

const ids = Array.from({ length: 6 }, (_, i) => `q${i}`);
const answers = (...n: number[]) => Object.fromEntries(n.map((i) => [`q${i}`, true]));

const section = (over: Partial<Extract<State['runs'][string]['step'], { kind: 'section' }>> = {}) =>
	({
		kind: 'section',
		lesson: 'h1-01',
		section: 'words',
		run: 'r1',
		of: 6,
		...over
	}) satisfies State['runs'][string]['step'];

const stateWith = (runs: State['runs']): State => ({ ...initialState(), runs });

describe('resume', () => {
	it('Given_ThreeOfSixAnswered_When_Resume_Then_RunAndIndexThree', () => {
		// Arrange
		const state = stateWith({ r1: { step: section(), answers: answers(0, 1, 2) } });

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: 'r1', index: 3 });
	});

	it('Given_ClosedRun_When_Resume_Then_Fresh', () => {
		// Arrange
		const state = stateWith({
			r1: { step: section(), answers: answers(0, 1, 2, 3, 4, 5), closed: true }
		});

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: null, index: 0 });
	});

	it('Given_OfDiffers_When_Resume_Then_Fresh', () => {
		// Arrange
		const state = stateWith({ r1: { step: section({ of: 5 }), answers: answers(0, 1) } });

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: null, index: 0 });
	});

	it('Given_OtherSection_When_Resume_Then_Fresh', () => {
		// Arrange
		const state = stateWith({
			r1: { step: section({ section: 'grammar' }), answers: answers(0, 1) }
		});

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: null, index: 0 });
	});

	it('Given_TwoOpenRuns_When_Resume_Then_MoreAnswersWins', () => {
		// Arrange
		const state = stateWith({
			r1: { step: section({ run: 'r1' }), answers: answers(0, 1) },
			r2: { step: section({ run: 'r2' }), answers: answers(0, 1, 2) }
		});

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: 'r2', index: 3 });
	});

	it('Given_GateRun_When_Resume_Then_MatchesByLesson', () => {
		// Arrange
		const state = stateWith({
			r1: { step: section({ section: 'grammar' }), answers: answers(0) },
			g1: { step: { kind: 'gate', lesson: 'h1-01', run: 'g1', of: 6 }, answers: answers(0, 1) }
		});

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'gate', ids });

		// Assert
		expect(got).toEqual({ run: 'g1', index: 2 });
	});

	it('Given_OpenGateRun_When_ResumeWordsSection_Then_Fresh', () => {
		// Arrange
		const state = stateWith({
			g1: { step: { kind: 'gate', lesson: 'h1-01', run: 'g1', of: 6 }, answers: answers(0, 1) }
		});

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids });

		// Assert
		expect(got).toEqual({ run: null, index: 0 });
	});

	it('Given_SameOfButForeignAnswerIds_When_Resume_Then_Fresh', () => {
		// Arrange
		const state = stateWith({ r1: { step: section(), answers: answers(0, 1, 2) } });
		const reauthored = Array.from({ length: 6 }, (_, i) => `n${i}`);

		// Act
		const got = resume(state, { lesson: 'h1-01', section: 'words', ids: reauthored });

		// Assert
		expect(got).toEqual({ run: null, index: 0 });
	});
});
