export const MAX_WRONG = 3;

export type VietVerdict = 'hit' | 'miss' | 'skip';

export const wrongTotal = (perChar: number[]) => perChar.reduce((sum, n) => sum + n, 0);

export const vietVerdict = (v: {
	total: number;
	peeked: boolean;
	unsure: boolean;
	loadFailed: boolean;
}): VietVerdict =>
	v.loadFailed ? 'skip' : v.unsure || v.peeked || v.total > MAX_WRONG ? 'miss' : 'hit';
