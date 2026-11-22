import { describe, expect, it } from 'vitest';
import { decide, stampOpacity, velocity } from './swipe';

const W = 340;

describe('decide', () => {
	it.each([
		['dx 95 at rest', { dx: 95, dy: 0, vx: 0 }, null],
		['dx 96 at rest', { dx: 96, dy: 0, vx: 0 }, 'right'],
		['dx -96 at rest', { dx: -96, dy: 0, vx: 0 }, 'left'],
		['slow drag 80', { dx: 80, dy: 0, vx: 0.2 }, null],
		['fast flick 40', { dx: 40, dy: 0, vx: 0.9 }, 'right'],
		['fast flick -40', { dx: -40, dy: 0, vx: -0.9 }, 'left'],
		['too short flick 20', { dx: 20, dy: 0, vx: 2 }, null],
		['vertical-dominant flick', { dx: 40, dy: 60, vx: 0.9 }, null]
	] as const)('Given_%s_When_Decide_Then_%s', (_name, move, expected) => {
		// Arrange
		const input = { ...move, width: W };

		// Act
		const result = decide(input);

		// Assert
		expect(result).toBe(expected);
	});

	it('Given_ZeroWidthAndNoFlick_When_Decide_Then_Null', () => {
		// Arrange
		const input = { dx: 500, dy: 0, width: 0, vx: 0 };

		// Act
		const result = decide(input);

		// Assert
		expect(result).toBeNull();
	});

	it('Given_FlickAgainstDragDirection_When_Decide_Then_Null', () => {
		// Arrange
		const input = { dx: 40, dy: 0, width: W, vx: -0.9 };

		// Act
		const result = decide(input);

		// Assert
		expect(result).toBeNull();
	});
});

describe('stampOpacity', () => {
	it.each([
		['rest', 0, 0],
		['half threshold', (0.28 * W) / 2, 0.5],
		['past threshold', 0.28 * W * 2, 1],
		['negative half', -(0.28 * W) / 2, 0.5]
	])('Given_%s_When_StampOpacity_Then_%s', (_name, dx, expected) => {
		// Arrange
		const width = W;

		// Act
		const opacity = stampOpacity(dx, width);

		// Assert
		expect(opacity).toBeCloseTo(expected, 10);
	});

	it('Given_ZeroWidth_When_StampOpacity_Then_Zero', () => {
		// Arrange
		const dx = 50;

		// Act
		const opacity = stampOpacity(dx, 0);

		// Assert
		expect(opacity).toBe(0);
	});
});

describe('velocity', () => {
	it('Given_NoSamples_When_Velocity_Then_Zero', () => {
		// Arrange
		const samples: { x: number; t: number }[] = [];

		// Act
		const v = velocity(samples);

		// Assert
		expect(v).toBe(0);
	});

	it('Given_OneSample_When_Velocity_Then_Zero', () => {
		// Arrange
		const samples = [{ x: 0, t: 0 }];

		// Act
		const v = velocity(samples);

		// Assert
		expect(v).toBe(0);
	});

	it('Given_ThreeSamples_When_Velocity_Then_FirstToLastSlope', () => {
		// Arrange
		const samples = [
			{ x: 0, t: 0 },
			{ x: 10, t: 20 },
			{ x: 40, t: 60 }
		];

		// Act
		const v = velocity(samples);

		// Assert
		expect(v).toBeCloseTo(40 / 60, 10);
	});

	it('Given_SampleOlderThan100ms_When_Velocity_Then_ItIsIgnored', () => {
		// Arrange
		const samples = [
			{ x: 0, t: 0 },
			{ x: 100, t: 150 },
			{ x: 130, t: 180 }
		];

		// Act
		const v = velocity(samples);

		// Assert
		expect(v).toBe(1);
	});

	it('Given_SameTimestamps_When_Velocity_Then_Zero', () => {
		// Arrange
		const samples = [
			{ x: 0, t: 5 },
			{ x: 30, t: 5 }
		];

		// Act
		const v = velocity(samples);

		// Assert
		expect(v).toBe(0);
	});
});
