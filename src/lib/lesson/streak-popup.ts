import { m } from '#lib/paraglide/messages.js';
import { MAX_FREEZES, type StudyEvent } from '#lib/study/index.js';

export type WeekCell = { label: string; ticked: boolean; today: boolean };

export type DayCountedView = {
	n: number;
	headline: string;
	body: string;
	note: string | null;
	week: WeekCell[];
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

function weekOf(day: string, n: number): WeekCell[] {
	const monday = addDays(day, -((new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7));
	return LABELS.map((label, i) => {
		const cell = addDays(monday, i);
		return { label: label(), ticked: cell <= day && cell > addDays(day, -n), today: cell === day };
	});
}

export function dayCountedView(events: StudyEvent[]): DayCountedView | null {
	const e = events.find((x) => x.type === 'DayCounted');
	if (!e) return null;
	const n = e.streak;
	const earned = events.some((x) => x.type === 'FreezeEarned');
	let note: string | null = null;
	if (earned) note = m.chy46s1_note_gift();
	else if (e.freezes !== undefined && e.freezes < MAX_FREEZES)
		note = m.chy46s1_note_next({ k: 7 - (n % 7) });
	return {
		n,
		headline: e.record ? m.chy46s1_record({ n }) : m.done_streak({ n }),
		body: m.chy46s1_body({ next: n + 1 }),
		note,
		week: weekOf(e.day, n)
	};
}
