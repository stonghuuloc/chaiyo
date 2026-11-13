import { describe, expect, it } from 'vitest';
import messages from '../../messages/vi.json';

const banned = ['dạy', 'bạn thú'];
const word = (w: string) => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, 'iu');

describe('vi copy voice', () => {
	for (const w of banned)
		it(`never says "${w}"`, () => {
			const hits = Object.entries(messages).filter(([, v]) => word(w).test(v.normalize('NFC')));
			expect(hits).toEqual([]);
		});

	it('matches the banned words as whole words only', () => {
		expect(word('dạy').test('Chaiyo dạy bạn')).toBe(true);
		expect(word('bạn thú').test('các bạn thú')).toBe(true);
		expect(word('dạy').test('dậy sớm')).toBe(false);
	});
});
