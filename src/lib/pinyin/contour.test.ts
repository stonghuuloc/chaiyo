import { describe, expect, it } from 'vitest';
import { CONTOUR } from './contour';

describe('CONTOUR', () => {
	it('Given_FourTones_When_ReadContour_Then_EachIsAnSvgPath', () => {
		// Arrange
		const tones = [1, 2, 3, 4] as const;

		// Act
		const paths = tones.map((t) => CONTOUR[t]);

		// Assert
		expect(new Set(paths).size).toBe(4);
		for (const d of paths) expect(d).toMatch(/^M4 /);
	});
});
