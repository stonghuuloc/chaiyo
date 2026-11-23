import type { Channel, ChannelName, Reminder } from './channel';

export function fakeChannel(name: ChannelName): Channel & { sent: Reminder[] } {
	const sent: Reminder[] = [];
	return {
		name,
		sent,
		async send(r) {
			sent.push(r);
		}
	};
}
