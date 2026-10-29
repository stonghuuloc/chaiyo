import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TABS, tabFor } from './tabs';

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

describe('TABS icons', () => {
	const sprite = readFileSync(new URL('../assets/tab-icons.svg', import.meta.url), 'utf8');

	it.each(TABS.map((t) => t.icon))('has the line and fill symbols for %s', (icon) => {
		expect(sprite).toContain(`id="i-regular-${icon}"`);
		expect(sprite).toContain(`id="i-fill-${icon}"`);
	});

	it('orders icons house · path · brain · user-circle', () => {
		expect(TABS.map((t) => t.icon)).toEqual(['house', 'path', 'brain', 'user-circle']);
	});
});
