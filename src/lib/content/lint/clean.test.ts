import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fixtureRefs } from './fixtures/refs';
import { lintDir } from './index';

describe('clean Bài 1 fixture', () => {
	it('lintDir returns no errors', () => {
		const { errors, notices } = lintDir(join(__dirname, 'fixtures/clean'), { refs: fixtureRefs });
		expect(errors).toEqual([]);
		expect(notices).toEqual([]);
	});
});
