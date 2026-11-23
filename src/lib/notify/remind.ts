import { localDate } from '#lib/study/index.js';
import type { Channel } from './channel';
import { isDue } from './due';
import type { Marks } from './marks';
import type { Rolled } from './tick';

export type Skip = { id: string; reason: 'counted' | 'no-channel' | 'not-due' | 'already-sent' };
export type RemindResult = { sent: string[]; skipped: Skip[] };

export async function sendReminders(
	now: Date,
	rolled: Rolled[],
	channels: Channel[],
	marks: Marks
): Promise<RemindResult> {
	const sent: string[] = [];
	const skipped: Skip[] = [];
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
		if (!(await marks.claim(learner.id, day))) {
			skipped.push({ id: learner.id, reason: 'already-sent' });
			continue;
		}
		for (const c of usable) await c.send({ learnerId: learner.id, day });
		sent.push(learner.id);
	}
	return { sent, skipped };
}
