export const CHANNEL_NAMES = ['push', 'email', 'telegram'] as const;
export type ChannelName = (typeof CHANNEL_NAMES)[number];
export type Reminder = { learnerId: string; day: string };
export type Channel = { name: ChannelName; send(r: Reminder): Promise<void> };
