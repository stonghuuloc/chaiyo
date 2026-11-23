import { describe, expect, it } from 'vitest';
import { runReminders, runTicks } from './run';

describe('/dev/reminders', () => {
	it('Given_FiveFixtureLearners_When_RunReminders_Then_OutcomesAndChannelCounts', async () => {
		// Arrange
		const now = new Date('2026-11-23T13:00:00Z');

		// Act
		const { result, messages } = await runReminders(now);

		// Assert
		expect(result).toEqual({
			sent: ['minh'],
			skipped: [
				{ id: 'lan', reason: 'counted' },
				{ id: 'huy', reason: 'no-channel' },
				{ id: 'nam', reason: 'counted' },
				{ id: 'huy-ny', reason: 'not-due' }
			]
		});
		expect(messages.push).toHaveLength(1);
		expect(messages.email).toHaveLength(1);
		expect(messages.telegram).toHaveLength(0);
	});

	it('Given_FourTicks_When_RunTicks_Then_MinhSentOnceAndChannelTotals', async () => {
		// Act
		const { ticks, messages } = await runTicks('2026-11-23');

		// Assert
		expect(ticks.map((t) => t.at)).toEqual(['20:00', '20:15', '20:30', '20:45']);
		expect(ticks[0].result.sent).toEqual(['minh']);
		for (const t of ticks.slice(1)) {
			expect(t.result.sent).toEqual([]);
			expect(t.result.skipped).toContainEqual({ id: 'minh', reason: 'already-sent' });
		}
		expect(messages.push).toHaveLength(1);
		expect(messages.email).toHaveLength(1);
		expect(messages.telegram).toHaveLength(0);
	});
});
