import { describe, expect, it } from 'vitest';
import { ago } from './ago';

const NOW = new Date('2026-11-24T10:00:00Z');
const before = (min: number) => new Date(NOW.getTime() - min * 60_000).toISOString();

describe('ago', () => {
	it.each([
		[0, '1 phút trước'],
		[12, '12 phút trước'],
		[59, '59 phút trước'],
		[60, '1 giờ trước'],
		[23 * 60 + 59, '23 giờ trước'],
		[24 * 60, 'Hôm qua'],
		[47 * 60 + 59, 'Hôm qua'],
		[48 * 60, '2 ngày trước'],
		[5 * 24 * 60, '5 ngày trước']
	])('Given_%i_MinutesAgo_Then_%s', (min, text) => {
		expect(ago(before(min), NOW)).toBe(text);
	});

	it('Given_FutureTime_Then_OneMinute', () => {
		expect(ago(before(-3), NOW)).toBe('1 phút trước');
	});
});
