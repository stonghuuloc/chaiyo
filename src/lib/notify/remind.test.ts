import { describe, expect, it } from 'vitest';
import { initialState } from '#lib/study/index.js';
import type { Channel, ChannelName } from './channel';
import { fakeChannel } from './fake-channel';
import { sendReminders } from './remind';
import type { Rolled } from './tick';

const HCM = 'Asia/Ho_Chi_Minh';
const NOW = new Date('2026-11-23T13:00:00Z');

const rolledFor = (id: string, last: string, channels: ChannelName[]): Rolled => ({
	learner: { id, tz: HCM, channels },
	day: '2026-11-22',
	state: { ...initialState({ tz: HCM }), streak: { count: 3, last, freezes: 0 } },
	events: []
});
const fakes = () => ({
	push: fakeChannel('push'),
	email: fakeChannel('email'),
	telegram: fakeChannel('telegram')
});
const all = (f: ReturnType<typeof fakes>) => [f.push, f.email, f.telegram];
const counts = (f: ReturnType<typeof fakes>) => all(f).map((c) => c.sent.length);

describe('sendReminders', () => {
	it('Given_TodayCounts_When_SendReminders_Then_ZeroMessagesAndSkippedCounted', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [rolledFor('lan', '2026-11-23', ['email'])], all(f));

		// Assert
		expect(result).toEqual({ sent: [], skipped: [{ id: 'lan', reason: 'counted' }] });
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_LocalMidnightPassed_When_SendReminders_Then_UsesLocalToday', async () => {
		// Arrange
		const now = new Date('2026-11-22T17:30:00Z');
		const f = fakes();

		// Act
		const counted = await sendReminders(now, [rolledFor('lan', '2026-11-23', ['email'])], all(f));
		const notCounted = await sendReminders(
			now,
			[rolledFor('lan', '2026-11-22', ['email'])],
			all(f)
		);

		// Assert
		expect(counted.skipped).toEqual([{ id: 'lan', reason: 'counted' }]);
		expect(notCounted.sent).toEqual(['lan']);
	});

	it('Given_CountedAndNoChannel_When_SendReminders_Then_OneCountedSkip', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [rolledFor('nam', '2026-11-23', [])], all(f));

		// Assert
		expect(result.skipped).toEqual([{ id: 'nam', reason: 'counted' }]);
	});

	it('Given_NotCountedPushEmail_When_SendReminders_Then_OnePerChannelAndSent', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(
			NOW,
			[rolledFor('minh', '2026-11-22', ['push', 'email'])],
			all(f)
		);

		// Assert
		expect(result).toEqual({ sent: ['minh'], skipped: [] });
		expect(counts(f)).toEqual([1, 1, 0]);
	});

	it('Given_AllChannelsOff_When_SendReminders_Then_SkippedNoChannel', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [rolledFor('huy', '2026-11-22', [])], all(f));

		// Assert
		expect(result).toEqual({ sent: [], skipped: [{ id: 'huy', reason: 'no-channel' }] });
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_EnabledWithoutAdapter_When_SendReminders_Then_SkippedNoChannel', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [rolledFor('minh', '2026-11-22', ['email'])], [f.push]);

		// Assert
		expect(result.skipped).toEqual([{ id: 'minh', reason: 'no-channel' }]);
		expect(f.push.sent).toHaveLength(0);
	});

	it('Given_Minh_When_SendReminders_Then_ReminderPayloadIsLocalDay', async () => {
		// Arrange
		const f = fakes();

		// Act
		await sendReminders(NOW, [rolledFor('minh', '2026-11-22', ['push'])], all(f));

		// Assert
		expect(f.push.sent).toEqual([{ learnerId: 'minh', day: '2026-11-23' }]);
	});

	it('Given_FourLearners_When_SendReminders_Then_ResultKeepsInputOrder', async () => {
		// Arrange
		const f = fakes();
		const rolled = [
			rolledFor('lan', '2026-11-23', ['email']),
			rolledFor('minh', '2026-11-22', ['push', 'email']),
			rolledFor('huy', '2026-11-22', []),
			rolledFor('nam', '2026-11-23', [])
		];

		// Act
		const result = await sendReminders(NOW, rolled, all(f));

		// Assert
		expect(result.sent).toEqual(['minh']);
		expect(result.skipped.map((s) => s.id)).toEqual(['lan', 'huy', 'nam']);
	});

	it('Given_NoLearners_When_SendReminders_Then_EmptyResult', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [], all(f));

		// Assert
		expect(result).toEqual({ sent: [], skipped: [] });
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_SendThrows_When_SendReminders_Then_Rejects', async () => {
		// Arrange
		const boom: Channel = {
			name: 'push',
			send: async () => {
				throw new Error('boom');
			}
		};

		// Act
		const act = sendReminders(NOW, [rolledFor('minh', '2026-11-22', ['push'])], [boom]);

		// Assert
		await expect(act).rejects.toThrow('boom');
	});
});
