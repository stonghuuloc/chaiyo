import { describe, expect, it } from 'vitest';
import { isDue, localMinutes } from './due';

const HCM = 'Asia/Ho_Chi_Minh';
const NY = 'America/New_York';

describe('localMinutes', () => {
	it('Given_HcmTimes_When_LocalMinutes_Then_H23Values', () => {
		expect(localMinutes(new Date('2026-11-23T12:59:00Z'), HCM)).toBe(1199);
		expect(localMinutes(new Date('2026-11-23T13:00:00Z'), HCM)).toBe(1200);
		expect(localMinutes(new Date('2026-11-22T17:00:00Z'), HCM)).toBe(0);
	});
});

describe('isDue', () => {
	it('Given_2000_When_IsDue_Then_FromSlotStart', () => {
		expect(isDue(new Date('2026-11-23T12:59:00Z'), HCM, '20:00')).toBe(false);
		expect(isDue(new Date('2026-11-23T13:00:00Z'), HCM, '20:00')).toBe(true);
		expect(isDue(new Date('2026-11-23T16:45:00Z'), HCM, '20:00')).toBe(true);
	});

	it('Given_OffSlotTimes_When_IsDue_Then_FlooredToSlot', () => {
		expect(isDue(new Date('2026-11-23T16:45:00Z'), HCM, '23:50')).toBe(true);
		expect(isDue(new Date('2026-11-23T13:00:00Z'), HCM, '20:07')).toBe(true);
		expect(isDue(new Date('2026-11-23T12:45:00Z'), HCM, '20:07')).toBe(false);
	});

	it('Given_NewYork_When_IsDue_Then_LocalTimeWithDst', () => {
		expect(isDue(new Date('2026-11-23T13:00:00Z'), NY, '20:00')).toBe(false);
		expect(isDue(new Date('2026-11-24T01:00:00Z'), NY, '20:00')).toBe(true);
		expect(isDue(new Date('2026-07-01T00:00:00Z'), NY, '20:00')).toBe(true);
	});

	it('Given_Midnight_When_IsDue_Then_ZeroOClockDue', () => {
		expect(isDue(new Date('2026-11-22T17:00:00Z'), HCM, '00:00')).toBe(true);
	});
});
