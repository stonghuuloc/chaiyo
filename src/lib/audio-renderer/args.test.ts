import { describe, expect, it } from 'vitest';
import { takeFlag } from './args';

describe('takeFlag', () => {
	it('removes the flag and its value from the arguments', () => {
		const args = ['m.json', '--prefix', 'mv1', '--kind', 'word'];
		expect(takeFlag(args, 'prefix')).toBe('mv1');
		expect(args).toEqual(['m.json', '--kind', 'word']);
	});

	it('returns undefined when the flag is absent', () => {
		expect(takeFlag(['m.json'], 'prefix')).toBeUndefined();
	});

	it('rejects a missing value or a following flag', () => {
		expect(() => takeFlag(['--prefix'], 'prefix')).toThrow('--prefix needs a value');
		expect(() => takeFlag(['--from-dir', '--prefix', 'mv1'], 'from-dir')).toThrow(
			'--from-dir needs a value'
		);
	});
});
