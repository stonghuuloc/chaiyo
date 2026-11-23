import { localDate } from '#lib/study/index.js';
import type { Channel, ChannelName } from './channel';
import { isDue } from './due';
import type { Marks } from './marks';
import type { Rolled } from './tick';

export type Skip = { id: string; reason: 'counted' | 'no-channel' | 'not-due' | 'already-sent' };
export type Delivery = { id: string; channel: ChannelName; ok: boolean; error?: string };
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
	marks: Marks
): Promise<RemindResult> {
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
		} catch {
			failed.push(learner.id);
			continue;
		}
		if (!claimed) {
			skipped.push({ id: learner.id, reason: 'already-sent' });
			continue;
		}
		const settled = await Promise.allSettled(
			usable.map((c) => c.send({ learnerId: learner.id, day }))
		);
		const mine = settled.map((s, i): Delivery =>
			s.status === 'fulfilled'
				? { id: learner.id, channel: usable[i].name, ok: true }
				: {
						id: learner.id,
						channel: usable[i].name,
						ok: false,
						error: s.reason instanceof Error ? s.reason.message : String(s.reason)
					}
		);
		deliveries.push(...mine);
		if (mine.some((d) => d.ok)) sent.push(learner.id);
		else {
			failed.push(learner.id);
			await marks.release(learner.id, day).catch(() => {});
		}
	}
	return { sent, skipped, failed, deliveries };
}
