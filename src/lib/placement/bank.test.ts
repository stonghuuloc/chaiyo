import { describe, expect, it } from 'vitest';
import { BLOCKS, items } from './bank';

describe('placement bank', () => {
	it.each([1, 2, 3, 4, 5])('level %i has 10 items in RRLRLRRLRL order', (level) => {
		const list = items(level);
		expect(list).toHaveLength(10);
		expect(list.map((i) => (i.kind === 'read' ? 'R' : 'L')).join('')).toBe('RRLRLRRLRL');
		expect(list.filter((i) => i.kind === 'read')).toHaveLength(6);
		expect(list.filter((i) => i.kind === 'listen')).toHaveLength(4);
		for (const item of list) {
			expect(item.options).toHaveLength(4);
			expect(item.options).toContain(item.answer);
			expect(item).not.toHaveProperty('pinyin');
			if (item.kind === 'listen') expect(item.clip).toMatch(/^words\/[0-9a-f]{64}$/);
		}
	});

	it('uses 200 distinct option strings across the bank', () => {
		const all = BLOCKS.flatMap((b) => items(b.level).flatMap((i) => i.options));
		expect(all).toHaveLength(200);
		expect(new Set(all).size).toBe(200);
	});

	it('rejects an unknown level', () => {
		expect(() => items(6)).toThrow();
	});
});
