import { describe, expect, it } from 'vitest';
import { parseArgs } from './args';

const NAMES = ['kind', 'prefix'];

describe('parseArgs', () => {
	it('reads flags and positionals in one pass, in any order', () => {
		expect(parseArgs(['--prefix', 'mv1', 'm.json', '--kind', 'word'], NAMES)).toEqual({
			flags: { prefix: 'mv1', kind: 'word' },
			positional: ['m.json']
		});
	});

	it('rejects a missing value or a following flag', () => {
		expect(() => parseArgs(['--prefix'], NAMES)).toThrow('--prefix needs a value');
		expect(() => parseArgs(['--prefix', '--kind', 'word', 'mv1'], NAMES)).toThrow(
			'--prefix needs a value'
		);
	});

	it('rejects an unknown option', () => {
		expect(() => parseArgs(['m.json', '--limt', '3'], NAMES)).toThrow('unknown option --limt');
	});
});
