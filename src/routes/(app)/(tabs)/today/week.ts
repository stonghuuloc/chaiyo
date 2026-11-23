import { m } from '#lib/paraglide/messages.js';
import { localDate, rollover, type State } from '#lib/study/index.js';

export type Mark = 'tick' | 'freeze' | 'today' | 'later' | 'blank';
export type WeekView = {
	count: number;
	freezes: number;
	cells: { day: string; label: string; mark: Mark; today: boolean }[];
	line: string;
};

const LABELS = [
	m.chy46s1_d1,
	m.chy46s1_d2,
	m.chy46s1_d3,
	m.chy46s1_d4,
	m.chy46s1_d5,
	m.chy46s1_d6,
	m.chy46s1_d7
];

const addDays = (day: string, n: number) => {
	const [y, mo, d] = day.split('-').map(Number);
	return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
};

export function weekView(state: State, now: Date): WeekView {
	const today = localDate(now, state.tz);
	const counted = state.streak.last === today;
	const s = counted ? state.streak : rollover(state, addDays(today, -1)).state.streak;
	const frozen = new Set(s.frozen ?? []);
	const ticks = new Set<string>();
	for (let d = s.last; d && ticks.size < s.count; d = addDays(d, -1)) {
		if (!frozen.has(d)) ticks.add(d);
	}
	const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
	const cells = LABELS.map((label, i) => {
		const day = addDays(monday, i);
		const mark: Mark =
			day === today
				? counted
					? 'tick'
					: 'today'
				: day > today
					? 'later'
					: frozen.has(day)
						? 'freeze'
						: ticks.has(day)
							? 'tick'
							: 'blank';
		return { day, label: label(), mark, today: day === today };
	});
	const missed = cells.filter((c) => c.mark === 'freeze').map((c) => c.label);
	const line = counted
		? m.chy45s2_line_counted({ n: s.count })
		: (missed.length
				? m.chy45s2_line_frozen({ days: missed.join(', '), k: missed.length }) + ' '
				: '') + m.chy45s2_line_next({ next: s.count + 1 });
	return { count: s.count, freezes: s.freezes, cells, line };
}
