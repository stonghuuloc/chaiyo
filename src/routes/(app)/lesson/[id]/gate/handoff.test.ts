import { describe, expect, it } from 'vitest';
import {
	GATE_RESULT,
	clearGateResult,
	readGateResult,
	writeGateResult,
	type GateHandoff
} from './handoff';

const memory = () => {
	const items = new Map<string, string>();
	return {
		getItem: (k: string) => items.get(k) ?? null,
		setItem: (k: string, v: string) => void items.set(k, v),
		removeItem: (k: string) => void items.delete(k)
	};
};

const HANDOFF: GateHandoff = {
	lesson: 'h1-01',
	steps: [{ kind: 'order', id: 'o1', ask: 'a', title: 't', tiles: ['你'], answer: '你' }],
	answers: [{ questionId: 'o1', pick: '你', correct: true, ms: 10 }],
	events: [{ type: 'GatePassed', lesson: 'h1-01', score: 100 }],
	best: 100
};

describe('gate handoff', () => {
	it('Given_Written_When_Read_Then_RoundTrips', () => {
		// Arrange
		const storage = memory();

		// Act
		writeGateResult(storage, HANDOFF);

		// Assert
		expect(readGateResult(storage, 'h1-01')).toEqual(HANDOFF);
	});

	it('Given_Missing_When_Read_Then_Null', () => {
		// Arrange
		const storage = memory();

		// Act
		const got = readGateResult(storage, 'h1-01');

		// Assert
		expect(got).toBe(null);
	});

	it('Given_BadJson_When_Read_Then_Null', () => {
		// Arrange
		const storage = memory();
		storage.setItem(GATE_RESULT, '{nope');

		// Act
		const got = readGateResult(storage, 'h1-01');

		// Assert
		expect(got).toBe(null);
	});

	it('Given_NoAnswers_When_Read_Then_Null', () => {
		// Arrange
		const storage = memory();
		storage.setItem(GATE_RESULT, JSON.stringify({ ...HANDOFF, answers: [] }));

		// Act
		const got = readGateResult(storage, 'h1-01');

		// Assert
		expect(got).toBe(null);
	});

	it('Given_OtherLesson_When_Read_Then_Null', () => {
		// Arrange
		const storage = memory();
		writeGateResult(storage, HANDOFF);

		// Act
		const got = readGateResult(storage, 'h1-02');

		// Assert
		expect(got).toBe(null);
	});

	it('Given_Cleared_When_Read_Then_Null', () => {
		// Arrange
		const storage = memory();
		writeGateResult(storage, HANDOFF);

		// Act
		clearGateResult(storage);

		// Assert
		expect(readGateResult(storage, 'h1-01')).toBe(null);
	});
});
