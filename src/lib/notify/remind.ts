import { localDate } from '#lib/study/index.js';
import type { Channel, ChannelName } from './channel';
import { isDue } from './due';
import type { Marks } from './marks';
import type { Rolled } from './tick';

export type Skip = { id: string; reason: 'counted' | 'no-channel' | 'not-due' | 'already-sent' };
export type Delivery = {
	id: string;
	channel: ChannelName | 'claim' | 'log';
	ok: boolean;
	error?: string;
};
export type SendRow = { id: string; learnerId: string; day: string; channel: ChannelName };
export type SendLog = { record(rows: SendRow[]): Promise<void> };
export type RemindResult = {
	sent: string[];
	skipped: Skip[];
	failed: string[];
	deliveries: Delivery[];
};

export async function sendReminders(
	now: Date,
	rolled: Rolled[],
	channels: Channel[],
	marks: Marks,
	o: { log?: SendLog; newId?: () => string } = {}
): Promise<RemindResult> {
	const newId = o.newId ?? (() => crypto.randomUUID());
	const sent: string[] = [];
	const skipped: Skip[] = [];
	const failed: string[] = [];
	const deliveries: Delivery[] = [];
	for (const { learner, state } of rolled) {
		const day = localDate(now, learner.tz);
		if (state.streak.last === day) {
			skipped.push({ id: learner.id, reason: 'counted' });
			continue;
		}
		const usable = channels.filter((c) => learner.channels.includes(c.name));
		if (usable.length === 0) {
			skipped.push({ id: learner.id, reason: 'no-channel' });
			continue;
		}
		if (!isDue(now, learner.tz, learner.remindAt)) {
			skipped.push({ id: learner.id, reason: 'not-due' });
			continue;
		}
		let claimed: boolean;
		try {
			claimed = await marks.claim(learner.id, day);
		} catch (e) {
			failed.push(learner.id);
			deliveries.push({
				id: learner.id,
				channel: 'claim',
				ok: false,
				error: e instanceof Error ? e.message : String(e)
			});
			continue;
		}
		if (!claimed) {
			skipped.push({ id: learner.id, reason: 'already-sent' });
			continue;
		}
		const opens = usable.map(() => (o.log ? newId() : undefined));
		const settled = await Promise.allSettled(
			usable.map((c, i) =>
				c.send({ learnerId: learner.id, day, ...(opens[i] && { open: opens[i] }) })
			)
		);
		const mine = settled.flatMap((s, i): Delivery[] =>
			s.status === 'fulfilled'
				? s.value === 'skipped'
					? []
					: [{ id: learner.id, channel: usable[i].name, ok: true }]
				: [
						{
							id: learner.id,
							channel: usable[i].name,
							ok: false,
							error: s.reason instanceof Error ? s.reason.message : String(s.reason)
						}
					]
		);
		deliveries.push(...mine);
		const rows = settled.flatMap((s, i): SendRow[] =>
			s.status === 'fulfilled' && s.value !== 'skipped' && opens[i]
				? [{ id: opens[i]!, learnerId: learner.id, day, channel: usable[i].name }]
				: []
		);
		if (o.log && rows.length)
			await o.log.record(rows).catch((e) =>
				deliveries.push({
					id: learner.id,
					channel: 'log',
					ok: false,
					error: e instanceof Error ? e.message : String(e)
				})
			);
		if (mine.length === 0) {
			skipped.push({ id: learner.id, reason: 'no-channel' });
			await marks.release(learner.id, day).catch(() => {});
		} else if (mine.some((d) => d.ok)) sent.push(learner.id);
		else {
			failed.push(learner.id);
			await marks.release(learner.id, day).catch(() => {});
		}
	}
	return { sent, skipped, failed, deliveries };
}
