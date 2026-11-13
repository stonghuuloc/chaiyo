import { describe, expect, it } from 'vitest';
import messages from '../../messages/vi.json';

const banned = {
	dạy: /(?<!\p{L})dạy(?!\p{L})/iu,
	'các bạn thú': /(?<!\p{L})các bạn thú(?!\p{L})(?!\s+vị)/iu
};

describe('vi copy voice', () => {
	for (const [w, re] of Object.entries(banned))
		it(`never says "${w}"`, () => {
			const hits = Object.entries(messages).filter(([, v]) => re.test(v.normalize('NFC')));
			expect(hits).toEqual([]);
		});

	it('matches the banned words as whole words only', () => {
		expect(banned['dạy'].test('Chaiyo dạy bạn')).toBe(true);
		expect(banned['dạy'].test('giảng dạy')).toBe(true);
		expect(banned['dạy'].test('dậy sớm')).toBe(false);
		expect(banned['dạy'].test('áo dày')).toBe(false);
		expect(banned['các bạn thú'].test('chơi với các bạn thú.')).toBe(true);
		expect(banned['các bạn thú'].test('các bạn thú vị')).toBe(false);
		expect(banned['các bạn thú'].test('một người bạn thú vị')).toBe(false);
	});
});
