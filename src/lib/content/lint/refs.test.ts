import { describe, expect, it } from 'vitest';
import { loadRefs } from './refs';

describe('loadRefs', () => {
	it('reads the grammar syllabus levels from the CSV', () => {
		const { refs } = loadRefs();
		expect(refs.syllabus.get(1)).toBe(1);
		expect(refs.syllabus.get(277)).toBe(4);
		expect(refs.syllabus.size).toBe(573);
	});
});
