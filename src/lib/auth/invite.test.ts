import { describe, expect, it } from 'vitest';
import { rememberInvite, takeInvite } from './invite';

const memory = () => {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		removeItem: (k: string) => void m.delete(k)
	};
};

describe('invite', () => {
	it('Given_RememberedLinh_When_TakeTwice_Then_LinhThenNull', () => {
		const s = memory();
		rememberInvite(s, 'Linh');
		expect(takeInvite(s)).toBe('linh');
		expect(takeInvite(s)).toBeNull();
	});

	it('Given_BadHandle_When_Remember_Then_NothingStored', () => {
		const s = memory();
		rememberInvite(s, '../login');
		expect(takeInvite(s)).toBeNull();
	});

	it('Given_TamperedStore_When_Take_Then_NullAndCleared', () => {
		const s = memory();
		s.setItem('chaiyo:invite', 'https://evil.example');
		expect(takeInvite(s)).toBeNull();
		expect(s.getItem('chaiyo:invite')).toBeNull();
	});
});
