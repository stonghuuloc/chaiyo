import { fakeChannel } from '#lib/notify/fake-channel.js';
import { memoryMarks } from '#lib/notify/marks.js';
import { sendReminders, type RemindResult } from '#lib/notify/remind.js';
import type { ChannelName, Reminder } from '#lib/notify/channel.js';
import type { Rolled } from '#lib/notify/tick.js';
import { initialState, localDate } from '#lib/study/index.js';

export const TZ = 'Asia/Ho_Chi_Minh';
const NY = 'America/New_York';
const TICK_MS = 900_000;

type Messages = Record<ChannelName, Reminder[]>;

const shift = (day: string, n: number) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

const fixturesFor = (today: string): Rolled[] => {
	const rolledFor = (id: string, last: string, channels: ChannelName[], tz = TZ): Rolled => ({
		learner: { id, tz, channels, remindAt: '20:00' },
		day: shift(today, -1),
		state: { ...initialState({ tz }), streak: { count: 3, last, freezes: 0 } },
		events: []
	});
	return [
		rolledFor('lan', today, ['email']),
		rolledFor('minh', shift(today, -1), ['push', 'email']),
		rolledFor('huy', shift(today, -1), []),
		rolledFor('nam', today, []),
		rolledFor('huy-ny', shift(today, -1), ['push'], NY)
	];
};

const newFakes = () => ({
	push: fakeChannel('push'),
	email: fakeChannel('email'),
	telegram: fakeChannel('telegram')
});

const messagesOf = (f: ReturnType<typeof newFakes>): Messages => ({
	push: f.push.sent,
	email: f.email.sent,
	telegram: f.telegram.sent
});

export async function runReminders(
	now: Date
): Promise<{ result: RemindResult; messages: Messages }> {
	const fakes = newFakes();
	const result = await sendReminders(
		now,
		fixturesFor(localDate(now, TZ)),
		[fakes.push, fakes.email, fakes.telegram],
		memoryMarks()
	);
	return { result, messages: messagesOf(fakes) };
}

export async function runTicks(
	day: string
): Promise<{ ticks: { at: string; result: RemindResult }[]; messages: Messages }> {
	const fakes = newFakes();
	const marks = memoryMarks();
	const rolled = fixturesFor(day);
	const start = Date.parse(`${day}T13:00:00Z`);
	const ticks: { at: string; result: RemindResult }[] = [];
	for (let i = 0; i < 4; i++) {
		const result = await sendReminders(
			new Date(start + i * TICK_MS),
			rolled,
			[fakes.push, fakes.email, fakes.telegram],
			marks
		);
		ticks.push({ at: `20:${String(i * 15).padStart(2, '0')}`, result });
	}
	return { ticks, messages: messagesOf(fakes) };
}
