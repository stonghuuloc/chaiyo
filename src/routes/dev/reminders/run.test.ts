import { describe, expect, it } from 'vitest';
import { runReminders } from './run';

describe('/dev/reminders', () => {
	it('Given_FourFixtureLearners_When_RunReminders_Then_OutcomesAndChannelCounts', async () => {
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
				{ id: 'nam', reason: 'counted' }
			]
		});
		expect(messages.push).toHaveLength(1);
		expect(messages.email).toHaveLength(1);
		expect(messages.telegram).toHaveLength(0);
	});
});
