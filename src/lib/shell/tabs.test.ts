import { describe, expect, it } from 'vitest';
import { tabFor } from './tabs';

describe('tabFor', () => {
	it.each([
		['/today', 0],
		['/roadmap', 1],
		['/practice', 2],
		['/me', 3]
	])('selects %s as tab %i', (path, index) => {
		expect(tabFor(path)).toBe(index);
	});

	it.each(['/practice/session', '/word/x', '/', '/login'])('selects no tab on %s', (path) => {
		expect(tabFor(path)).toBeNull();
	});
});
