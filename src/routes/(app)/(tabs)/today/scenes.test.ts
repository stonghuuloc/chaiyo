import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SCENES = ['reviews-due', 'lesson-next', 'day-done', 'streak-at-risk', 'freeze-used'];

describe('static/home scenes', () => {
	it.each(SCENES)('Given_EachScene_When_ReadFile_Then_WebpUnder150KB (%s)', (scene) => {
		// Arrange
		const path = `static/home/${scene}.webp`;

		// Act
		const bytes = readFileSync(path);

		// Assert
		expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
		expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
		expect(bytes.length).toBeLessThan(153600);
	});
});
