import { describe, expect, it } from 'vitest';
import { fakeChannel } from './fake-channel';

describe('fakeChannel', () => {
	it('Given_Send_When_Read_Then_SentHoldsReminder', async () => {
		// Arrange
		const push = fakeChannel('push');

		// Act
		await push.send({ learnerId: 'minh', day: '2026-11-23' });

		// Assert
		expect(push.name).toBe('push');
		expect(push.sent).toEqual([{ learnerId: 'minh', day: '2026-11-23' }]);
	});
});
