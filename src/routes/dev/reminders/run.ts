import { fakeChannel } from '#lib/notify/fake-channel.js';
import { sendReminders, type RemindResult } from '#lib/notify/remind.js';
import type { ChannelName, Reminder } from '#lib/notify/channel.js';
import type { Rolled } from '#lib/notify/tick.js';
import { initialState, localDate } from '#lib/study/index.js';

const TZ = 'Asia/Ho_Chi_Minh';

const shift = (day: string, n: number) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export async function runReminders(
	now: Date
): Promise<{ result: RemindResult; messages: Record<ChannelName, Reminder[]> }> {
	const today = localDate(now, TZ);
	const rolledFor = (id: string, last: string, channels: ChannelName[]): Rolled => ({
		learner: { id, tz: TZ, channels },
		day: shift(today, -1),
		state: { ...initialState({ tz: TZ }), streak: { count: 3, last, freezes: 0 } },
		events: []
	});
	const fakes = {
		push: fakeChannel('push'),
		email: fakeChannel('email'),
		telegram: fakeChannel('telegram')
	};
	const result = await sendReminders(
		now,
		[
			rolledFor('lan', today, ['email']),
			rolledFor('minh', shift(today, -1), ['push', 'email']),
			rolledFor('huy', shift(today, -1), []),
			rolledFor('nam', today, [])
		],
		[fakes.push, fakes.email, fakes.telegram]
	);
	return {
		result,
		messages: { push: fakes.push.sent, email: fakes.email.sent, telegram: fakes.telegram.sent }
	};
}
