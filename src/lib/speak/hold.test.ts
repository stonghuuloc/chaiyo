import { describe, expect, it } from 'vitest';
import { BARS, clock, held, level, push } from './hold';

describe('hold', () => {
	it('Given_699ms_When_Held_Then_Short', () => {
		// Arrange / Act
		const state = held(0, 699);

		// Assert
		expect(state).toBe('short');
	});

	it('Given_700ms_When_Held_Then_Done', () => {
		// Arrange / Act
		const state = held(0, 700);

		// Assert
		expect(state).toBe('done');
	});

	it('Given_NoMicOn_When_Held_Then_Short', () => {
		// Arrange / Act
		const state = held(null, 3_000);

		// Assert
		expect(state).toBe('short');
	});

	it('Given_3s_When_Clock_Then_0_03', () => {
		// Arrange / Act
		const label = clock(3_000);

		// Assert
		expect(label).toBe('0:03');
	});

	it('Given_61s_When_Clock_Then_1_01', () => {
		// Arrange / Act
		const label = clock(61_000);

		// Assert
		expect(label).toBe('1:01');
	});

	it('Given_Silence128_When_Level_Then_0', () => {
		// Arrange
		const buf = new Uint8Array(1024).fill(128);

		// Act
		const value = level(buf);

		// Assert
		expect(value).toBe(0);
	});

	it('Given_FullSwing_When_Level_Then_1', () => {
		// Arrange
		const buf = new Uint8Array(1024).fill(0);

		// Act
		const value = level(buf);

		// Assert
		expect(value).toBe(1);
	});

	it('Given_28Levels_When_Push_Then_Still28', () => {
		// Arrange
		const levels = Array(BARS).fill(0);

		// Act
		const next = push(levels, 0.5);

		// Assert
		expect(next).toHaveLength(BARS);
		expect(next.at(-1)).toBe(0.5);
		expect(levels.at(-1)).toBe(0);
	});
});
