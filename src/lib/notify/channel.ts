export const CHANNEL_NAMES = ['push', 'email', 'telegram'] as const;
export type ChannelName = (typeof CHANNEL_NAMES)[number];
export type Reminder = { learnerId: string; day: string; open?: string };
export const remindUrl = (url: string, open?: string) => (open ? `${url}?remind=${open}` : url);
export type Channel = { name: ChannelName; send(r: Reminder): Promise<void | 'skipped'> };
