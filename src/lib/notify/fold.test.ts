import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { memoryStore, openLedger } from '#lib/ledger/index';
import { initialState } from '#lib/study/index.js';
import { foldInputs, yesterday } from './fold';
import { studied } from './fixtures';

describe('fold', () => {
	it('Given_12DaysOfInputs_When_Folded_Then_EqualsPhoneLedgerState', async () => {
		// Arrange
		const tz = 'Asia/Ho_Chi_Minh';
		const inputs = studied('2026-11-01', '2026-11-12', tz);
		const shuffled = [...inputs].sort((a, b) => (a.at > b.at ? -1 : 1));
		const ledger = await openLedger({
			initial: initialState({ tz }),
			store: memoryStore(),
			idb: new IDBFactory()
		});
		for (const i of inputs) await ledger.record(i);

		// Act
		const server = foldInputs(initialState({ tz }), shuffled);

		// Assert
		expect(server).toEqual(ledger.state());
		expect(server.streak.count).toBe(12);
	});

	it.each([
		['2026-11-23T00:00:00Z', 'Asia/Ho_Chi_Minh', '2026-11-22'],
		['2026-11-23T00:00:00Z', 'America/New_York', '2026-11-21'],
		['2026-12-01T03:00:00Z', 'Asia/Ho_Chi_Minh', '2026-11-30']
	])('Given_%s_In_%s_When_Yesterday_Then_%s', (now, tz, expected) => {
		// Arrange / Act
		const day = yesterday(new Date(now), tz);

		// Assert
		expect(day).toBe(expected);
	});
});
