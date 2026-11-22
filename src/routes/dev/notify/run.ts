import type { Input } from '#lib/ledger/types.js';
import { studied } from '#lib/notify/fixtures.js';
import { tick, type Deps, type TickResult } from '#lib/notify/tick.js';
import { localDate } from '#lib/study/index.js';

const TZ = 'Asia/Ho_Chi_Minh';

const shift = (day: string, n: number) => {
	const [y, m, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};

export async function runDemo(now: Date): Promise<{ log: string[]; result: TickResult }> {
	const today = localDate(now, TZ);
	const history: Record<string, Input[]> = {
		studied: studied(shift(today, -1), shift(today, -1), TZ),
		freeze: studied(shift(today, -8), shift(today, -2), TZ),
		reset: studied(shift(today, -4), shift(today, -2), TZ)
	};
	const log: string[] = [];
	const deps: Deps = {
		curriculum: { lessons: [] },
		learners: async () => Object.keys(history).map((id) => ({ id, tz: TZ })),
		inputs: async (id) => history[id],
		record: async (r) => {
			log.push(`record ${r.learner.id} (${r.events.map((e) => e.type).join(', ') || '0 events'})`);
		},
		remind: async (_now, rolled) => {
			log.push(`remind ${rolled.length}`);
		}
	};
	return { log, result: await tick(now, deps) };
}
