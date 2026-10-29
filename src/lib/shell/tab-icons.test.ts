import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const sprite = readFileSync(new URL('../assets/tab-icons.svg', import.meta.url), 'utf8');
const ids = [...sprite.matchAll(/<symbol[^>]*\sid="([^"]+)"/g)].map((m) => m[1]).sort();

describe('tab icon sprite', () => {
	it('holds exactly the 8 line + fill symbols of the four tabs', () => {
		const expected = ['house', 'path', 'brain', 'user-circle']
			.flatMap((n) => [`i-regular-${n}`, `i-fill-${n}`])
			.sort();
		expect(ids).toEqual(expected);
	});

	it('stays an extract, not the 86,614 B prototype sprite', () => {
		expect(Buffer.byteLength(sprite)).toBeLessThan(10_000);
	});
});
