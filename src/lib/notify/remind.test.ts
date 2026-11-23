import { describe, expect, it } from 'vitest';
import { initialState } from '#lib/study/index.js';
import type { Channel, ChannelName } from './channel';
import { fakeChannel } from './fake-channel';
import { memoryMarks } from './marks';
import { sendReminders } from './remind';
import { webPushChannel } from './web-push';
import type { Rolled } from './tick';

const HCM = 'Asia/Ho_Chi_Minh';
const NOW = new Date('2026-11-23T13:00:00Z');

const NY = 'America/New_York';

const rolledFor = (
	id: string,
	last: string,
	channels: ChannelName[],
	remindAt = '20:00',
	tz = HCM
): Rolled => ({
	learner: { id, tz, channels, remindAt },
	day: '2026-11-22',
	state: { ...initialState({ tz }), streak: { count: 3, last, freezes: 0 } },
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
		const result = await sendReminders(
			NOW,
			[rolledFor('lan', '2026-11-23', ['email'])],
			all(f),
			memoryMarks()
		);

		// Assert
		expect(result).toEqual({
			sent: [],
			skipped: [{ id: 'lan', reason: 'counted' }],
			failed: [],
			deliveries: []
		});
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_LocalMidnightPassed_When_SendReminders_Then_UsesLocalToday', async () => {
		// Arrange
		const now = new Date('2026-11-22T17:30:00Z');
		const f = fakes();

		// Act
		const counted = await sendReminders(
			now,
			[rolledFor('lan', '2026-11-23', ['email'], '00:00')],
			all(f),
			memoryMarks()
		);
		const notCounted = await sendReminders(
			now,
			[rolledFor('lan', '2026-11-22', ['email'], '00:00')],
			all(f),
			memoryMarks()
		);

		// Assert
		expect(counted.skipped).toEqual([{ id: 'lan', reason: 'counted' }]);
		expect(notCounted.sent).toEqual(['lan']);
	});

	it('Given_CountedAndNoChannel_When_SendReminders_Then_OneCountedSkip', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(
			NOW,
			[rolledFor('nam', '2026-11-23', [])],
			all(f),
			memoryMarks()
		);

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
			all(f),
			memoryMarks()
		);

		// Assert
		expect(result).toEqual({
			sent: ['minh'],
			skipped: [],
			failed: [],
			deliveries: [
				{ id: 'minh', channel: 'push', ok: true },
				{ id: 'minh', channel: 'email', ok: true }
			]
		});
		expect(counts(f)).toEqual([1, 1, 0]);
	});

	it('Given_AllChannelsOff_When_SendReminders_Then_SkippedNoChannel', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(
			NOW,
			[rolledFor('huy', '2026-11-22', [])],
			all(f),
			memoryMarks()
		);

		// Assert
		expect(result).toEqual({
			sent: [],
			skipped: [{ id: 'huy', reason: 'no-channel' }],
			failed: [],
			deliveries: []
		});
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_EnabledWithoutAdapter_When_SendReminders_Then_SkippedNoChannel', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(
			NOW,
			[rolledFor('minh', '2026-11-22', ['email'])],
			[f.push],
			memoryMarks()
		);

		// Assert
		expect(result.skipped).toEqual([{ id: 'minh', reason: 'no-channel' }]);
		expect(f.push.sent).toHaveLength(0);
	});

	it('Given_Minh_When_SendReminders_Then_ReminderPayloadIsLocalDay', async () => {
		// Arrange
		const f = fakes();

		// Act
		await sendReminders(NOW, [rolledFor('minh', '2026-11-22', ['push'])], all(f), memoryMarks());

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
		const result = await sendReminders(NOW, rolled, all(f), memoryMarks());

		// Assert
		expect(result.sent).toEqual(['minh']);
		expect(result.skipped.map((s) => s.id)).toEqual(['lan', 'huy', 'nam']);
	});

	it('Given_NoLearners_When_SendReminders_Then_EmptyResult', async () => {
		// Arrange
		const f = fakes();

		// Act
		const result = await sendReminders(NOW, [], all(f), memoryMarks());

		// Assert
		expect(result).toEqual({ sent: [], skipped: [], failed: [], deliveries: [] });
		expect(counts(f)).toEqual([0, 0, 0]);
	});

	it('Given_SendThrows_When_SendReminders_Then_FailedNotRejected', async () => {
		// Arrange
		const boom: Channel = {
			name: 'push',
			send: async () => {
				throw new Error('boom');
			}
		};

		// Act
		const act = sendReminders(
			NOW,
			[rolledFor('minh', '2026-11-22', ['push'])],
			[boom],
			memoryMarks()
		);

		// Assert
		await expect(act).resolves.toMatchObject({ sent: [], failed: ['minh'] });
	});

	it('Given_MinhHcmHuyNy_When_SendAt1300Z_Then_OnlyMinhSent', async () => {
		// Arrange
		const f = fakes();
		const rolled = [
			rolledFor('minh', '2026-11-22', ['push']),
			rolledFor('huy', '2026-11-22', ['push'], '20:00', NY)
		];

		// Act
		const result = await sendReminders(NOW, rolled, all(f), memoryMarks());

		// Assert
		expect(result).toEqual({
			sent: ['minh'],
			skipped: [{ id: 'huy', reason: 'not-due' }],
			failed: [],
			deliveries: [{ id: 'minh', channel: 'push', ok: true }]
		});
		expect(f.push.sent.map((r) => r.learnerId)).toEqual(['minh']);
	});

	it('Given_HuyNy_When_SendAt0100ZNextDay_Then_Sent', async () => {
		// Arrange
		const f = fakes();
		const now = new Date('2026-11-24T01:00:00Z');

		// Act
		const result = await sendReminders(
			now,
			[rolledFor('huy', '2026-11-22', ['push'], '20:00', NY)],
			all(f),
			memoryMarks()
		);

		// Assert
		expect(result.sent).toEqual(['huy']);
		expect(f.push.sent).toEqual([{ learnerId: 'huy', day: '2026-11-23' }]);
	});

	it('Given_FourTicksOneHour_When_SendReminders_Then_OnePerChannel', async () => {
		// Arrange
		const f = fakes();
		const marks = memoryMarks();
		const rolled = [rolledFor('minh', '2026-11-22', ['push', 'email'])];
		const results = [];

		// Act
		for (const t of ['13:00', '13:15', '13:30', '13:45']) {
			results.push(await sendReminders(new Date(`2026-11-23T${t}:00Z`), rolled, all(f), marks));
		}

		// Assert
		expect(results[0]).toEqual({
			sent: ['minh'],
			skipped: [],
			failed: [],
			deliveries: [
				{ id: 'minh', channel: 'push', ok: true },
				{ id: 'minh', channel: 'email', ok: true }
			]
		});
		for (const r of results.slice(1)) {
			expect(r).toEqual({
				sent: [],
				skipped: [{ id: 'minh', reason: 'already-sent' }],
				failed: [],
				deliveries: []
			});
		}
		expect(counts(f)).toEqual([1, 1, 0]);
	});

	it('Given_NextLocalDay_When_SendReminders_Then_SentAgain', async () => {
		// Arrange
		const f = fakes();
		const marks = memoryMarks();
		const rolled = [rolledFor('minh', '2026-11-22', ['push'])];
		await sendReminders(NOW, rolled, all(f), marks);

		// Act
		const next = await sendReminders(new Date('2026-11-24T13:00:00Z'), rolled, all(f), marks);

		// Assert
		expect(next.sent).toEqual(['minh']);
		expect(f.push.sent).toHaveLength(2);
	});

	it('Given_SkippedLearners_When_SendReminders_Then_NoMarkers', async () => {
		// Arrange
		const f = fakes();
		const marks = memoryMarks();
		const rolled = [
			rolledFor('lan', '2026-11-23', ['email']),
			rolledFor('huy', '2026-11-22', []),
			rolledFor('huy-ny', '2026-11-22', ['push'], '20:00', NY)
		];

		// Act
		await sendReminders(NOW, rolled, all(f), marks);

		// Assert
		expect(marks.keys.size).toBe(0);
	});

	it('Given_NoAdapters_When_SendReminders_Then_NoClaims', async () => {
		// Arrange
		const marks = memoryMarks();

		// Act
		const result = await sendReminders(
			NOW,
			[rolledFor('minh', '2026-11-22', ['push', 'email'])],
			[],
			marks
		);

		// Assert
		expect(result.skipped).toEqual([{ id: 'minh', reason: 'no-channel' }]);
		expect(marks.keys.size).toBe(0);
	});

	it('Given_SendThrowsBeforeAnyDelivery_When_NextTick_Then_RetriesAndSends', async () => {
		// Arrange
		const marks = memoryMarks();
		const rolled = [rolledFor('minh', '2026-11-22', ['push'])];
		const boom: Channel = {
			name: 'push',
			send: async () => {
				throw new Error('boom');
			}
		};
		const first = await sendReminders(NOW, rolled, [boom], marks);
		expect(first.failed).toEqual(['minh']);
		const f = fakes();

		// Act
		const result = await sendReminders(new Date('2026-11-23T13:15:00Z'), rolled, all(f), marks);

		// Assert
		expect(result.sent).toEqual(['minh']);
		expect(f.push.sent).toHaveLength(1);
	});

	it('Given_PushDeliveredThenEmailThrows_When_NextTick_Then_AlreadySent', async () => {
		// Arrange
		const marks = memoryMarks();
		const rolled = [rolledFor('minh', '2026-11-22', ['push', 'email'])];
		const f = fakes();
		const boom: Channel = {
			name: 'email',
			send: async () => {
				throw new Error('boom');
			}
		};
		const first = await sendReminders(NOW, rolled, [f.push, boom], marks);
		expect(first.sent).toEqual(['minh']);
		expect(first.deliveries[1]).toEqual({ id: 'minh', channel: 'email', ok: false, error: 'boom' });

		// Act
		const result = await sendReminders(
			new Date('2026-11-23T13:15:00Z'),
			rolled,
			[f.push, boom],
			marks
		);

		// Assert
		expect(result.skipped).toEqual([{ id: 'minh', reason: 'already-sent' }]);
		expect(f.push.sent).toHaveLength(1);
	});

	describe('fan-out isolation', () => {
		const throwing = (name: ChannelName, message: string): Channel => ({
			name,
			send: async () => {
				throw new Error(message);
			}
		});
		const minh3 = () => rolledFor('minh', '2026-11-22', ['push', 'email', 'telegram']);

		it('Given_TelegramThrows_When_SendReminders_Then_PushAndEmailDelivered', async () => {
			// Arrange
			const f = fakes();

			// Act
			const result = await sendReminders(
				NOW,
				[minh3()],
				[f.push, f.email, throwing('telegram', 'telegram: 400')],
				memoryMarks()
			);

			// Assert
			expect(result).toEqual({
				sent: ['minh'],
				skipped: [],
				failed: [],
				deliveries: [
					{ id: 'minh', channel: 'push', ok: true },
					{ id: 'minh', channel: 'email', ok: true },
					{ id: 'minh', channel: 'telegram', ok: false, error: 'telegram: 400' }
				]
			});
			expect(counts(f)).toEqual([1, 1, 0]);
		});

		it('Given_TelegramThrows_When_NextTick_Then_AlreadySent', async () => {
			// Arrange
			const f = fakes();
			const marks = memoryMarks();
			const channels = [f.push, f.email, throwing('telegram', 'telegram: 400')];
			await sendReminders(NOW, [minh3()], channels, marks);

			// Act
			const next = await sendReminders(
				new Date('2026-11-23T13:15:00Z'),
				[minh3()],
				channels,
				marks
			);

			// Assert
			expect(next.skipped).toEqual([{ id: 'minh', reason: 'already-sent' }]);
			expect(f.push.sent).toHaveLength(1);
		});

		it('Given_AllChannelsThrow_When_SendReminders_Then_FailedAndClaimReleased', async () => {
			// Arrange
			const marks = memoryMarks();
			const rolled = [rolledFor('minh', '2026-11-22', ['push'])];

			// Act
			const first = await sendReminders(NOW, rolled, [throwing('push', 'boom')], marks);
			const keysAfterFail = marks.keys.size;
			const f = fakes();
			const retry = await sendReminders(new Date('2026-11-23T13:15:00Z'), rolled, all(f), marks);

			// Assert
			expect(first).toEqual({
				sent: [],
				skipped: [],
				failed: ['minh'],
				deliveries: [{ id: 'minh', channel: 'push', ok: false, error: 'boom' }]
			});
			expect(keysAfterFail).toBe(0);
			expect(retry.sent).toEqual(['minh']);
			expect(f.push.sent).toHaveLength(1);
		});

		it('Given_ReleaseThrows_When_AllFail_Then_ResolvesFailed', async () => {
			// Arrange
			const marks = {
				claim: async () => true,
				release: async () => {
					throw new Error('release down');
				}
			};

			// Act
			const result = await sendReminders(
				NOW,
				[rolledFor('minh', '2026-11-22', ['push'])],
				[throwing('push', 'boom')],
				marks
			);

			// Assert
			expect(result.failed).toEqual(['minh']);
		});

		it('Given_MinhFailsLanOk_When_SendReminders_Then_LanSent', async () => {
			// Arrange
			const f = fakes();
			const rolled = [
				rolledFor('minh', '2026-11-22', ['push']),
				rolledFor('lan', '2026-11-22', ['email'])
			];

			// Act
			const result = await sendReminders(
				NOW,
				rolled,
				[throwing('push', 'boom'), f.email],
				memoryMarks()
			);

			// Assert
			expect(result.failed).toEqual(['minh']);
			expect(result.sent).toEqual(['lan']);
			expect(f.email.sent).toHaveLength(1);
		});

		it('Given_ClaimThrows_When_SendReminders_Then_FailedAndNextLearnerSent', async () => {
			// Arrange
			const f = fakes();
			const marks = {
				claim: async (id: string) => {
					if (id === 'minh') throw new Error('db down');
					return true;
				},
				release: async () => {}
			};
			const rolled = [
				rolledFor('minh', '2026-11-22', ['push']),
				rolledFor('lan', '2026-11-22', ['email'])
			];

			// Act
			const result = await sendReminders(NOW, rolled, all(f), marks);

			// Assert
			expect(result.failed).toEqual(['minh']);
			expect(result.sent).toEqual(['lan']);
			expect(result.deliveries).toEqual([
				{ id: 'minh', channel: 'claim', ok: false, error: 'db down' },
				{ id: 'lan', channel: 'email', ok: true }
			]);
			expect(f.push.sent).toHaveLength(0);
		});

		it('Given_FourLearners_When_SendReminders_Then_DeliveriesOnlyForMinh', async () => {
			// Arrange
			const f = fakes();
			const rolled = [
				rolledFor('lan', '2026-11-23', ['email']),
				rolledFor('minh', '2026-11-22', ['push', 'email']),
				rolledFor('huy', '2026-11-22', []),
				rolledFor('nam', '2026-11-23', [])
			];

			// Act
			const result = await sendReminders(NOW, rolled, all(f), memoryMarks());

			// Assert
			expect(result.deliveries.map((d) => d.id)).toEqual(['minh', 'minh']);
		});

		it('Given_NonErrorReason_When_Rejects_Then_ErrorIsString', async () => {
			// Arrange
			const odd: Channel = {
				name: 'push',
				send: () => Promise.reject('plain')
			};

			// Act
			const result = await sendReminders(
				NOW,
				[rolledFor('minh', '2026-11-22', ['push'])],
				[odd],
				memoryMarks()
			);

			// Assert
			expect(result.deliveries).toEqual([
				{ id: 'minh', channel: 'push', ok: false, error: 'plain' }
			]);
		});

		it('Given_PushHasNoDeviceAndEmailThrows_When_NextTick_Then_RetriesAndSends', async () => {
			// Arrange
			const marks = memoryMarks();
			const rolled = [rolledFor('minh', '2026-11-22', ['push', 'email'])];
			const push = webPushChannel({
				subs: { list: async () => [], remove: async () => {} },
				post: async () => 201
			});
			const down: Channel = {
				name: 'email',
				send: async () => {
					throw new Error('429');
				}
			};
			const first = await sendReminders(NOW, rolled, [push, down], marks);
			const f = fakes();

			// Act
			const next = await sendReminders(
				new Date('2026-11-23T13:15:00Z'),
				rolled,
				[push, f.email],
				marks
			);

			// Assert
			expect(first.failed).toEqual(['minh']);
			expect(first.sent).toEqual([]);
			expect(next.sent).toEqual(['minh']);
			expect(f.email.sent).toHaveLength(1);
		});
	});
});
