import { describe, expect, it } from 'vitest';
import { failedLines, reminderChannels } from './channels';
import { fakeChannel } from './fake-channel';
import type { RemindResult } from './remind';

const push = fakeChannel('push');
const email = fakeChannel('email');
const result = (deliveries: RemindResult['deliveries']): RemindResult => ({
	sent: ['minh'],
	skipped: [],
	failed: [],
	deliveries
});

describe('reminderChannels', () => {
	it('Given_BothSet_When_ReminderChannels_Then_PushEmail', () => {
		expect(reminderChannels({ push, email }).map((c) => c.name)).toEqual(['push', 'email']);
	});

	it('Given_PushOnly_When_ReminderChannels_Then_Push', () => {
		expect(reminderChannels({ push, email: null }).map((c) => c.name)).toEqual(['push']);
	});

	it('Given_EmailOnly_When_ReminderChannels_Then_Email', () => {
		expect(reminderChannels({ push: null, email }).map((c) => c.name)).toEqual(['email']);
	});

	it('Given_None_When_ReminderChannels_Then_Empty', () => {
		expect(reminderChannels({ push: null, email: null })).toEqual([]);
	});
});

describe('failedLines', () => {
	it('Given_TelegramFailed_When_FailedLines_Then_OneLine', () => {
		const lines = failedLines(
			result([
				{ id: 'minh', channel: 'push', ok: true },
				{ id: 'minh', channel: 'email', ok: true },
				{ id: 'minh', channel: 'telegram', ok: false, error: 'telegram: 400' }
			])
		);

		expect(lines).toEqual(['remind minh telegram: telegram: 400']);
	});

	it('Given_AllOk_When_FailedLines_Then_Empty', () => {
		expect(failedLines(result([{ id: 'minh', channel: 'push', ok: true }]))).toEqual([]);
	});
});
