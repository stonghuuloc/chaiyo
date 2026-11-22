import { describe, expect, it } from 'vitest';
import { runDemo } from './run';

describe('/dev/notify', () => {
	it('Given_ThreeFixtureLearners_When_RunDemo_Then_RecordsInOrderThenOneRemind', async () => {
		// Arrange
		const now = new Date('2026-11-23T00:00:00Z');

		// Act
		const { log, result } = await runDemo(now);

		// Assert
		expect(log).toEqual([
			'record studied (0 events)',
			'record freeze (FreezeSpent)',
			'record reset (StreakReset)',
			'remind 3'
		]);
		expect(result).toEqual({ rolled: ['studied', 'freeze', 'reset'], failed: [] });
	});
});
