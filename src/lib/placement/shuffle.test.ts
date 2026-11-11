import { describe, expect, it } from 'vitest';
import { shuffle } from './shuffle';

const seq = (...ns: number[]) => {
	let i = 0;
	return () => ns[i++];
};

describe('shuffle', () => {
	it('swaps from the end with the injected random and leaves the input alone', () => {
		const input = ['a', 'b', 'c', 'd'];
		expect(shuffle(input, seq(0.9, 0.1, 0.5))).toEqual(['c', 'b', 'a', 'd']);
		expect(input).toEqual(['a', 'b', 'c', 'd']);
	});
});
