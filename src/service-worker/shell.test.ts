import { describe, expect, it } from 'vitest';
import { appShell } from './shell';

describe('appShell', () => {
	it('Given_ContentPaths_When_AppShell_Then_DroppedOrderKept', () => {
		// Arrange
		const sha = 'a'.repeat(64);
		const paths = [
			'/_app/a.js',
			'/content/current.json',
			`/content/${sha}/h1-01.json`,
			'/fonts/lessons/ukai-h1-01.woff2',
			'/'
		];

		// Act
		const got = appShell(paths);

		// Assert
		expect(got).toEqual(['/_app/a.js', '/fonts/lessons/ukai-h1-01.woff2', '/']);
	});

	it('Given_NoContentPath_When_AppShell_Then_SameItems', () => {
		// Arrange
		const paths = ['/_app/a.js', '/'];

		// Act
		const got = appShell(paths);

		// Assert
		expect(got).toEqual(paths);
		expect(appShell([])).toEqual([]);
	});
});
