import type { Input } from '#lib/ledger/index.js';
import { practice } from '#lib/study/fixtures/streak.js';

const DAY = 86_400_000;

export const noonIn = (date: string, tz: string): Date => {
	const utcNoon = new Date(`${date}T12:00:00Z`);
	const hour = Number(
		new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(
			utcNoon
		)
	);
	return new Date(utcNoon.getTime() - (hour - 12) * 3_600_000);
};

export const studied = (from: string, to: string, tz: string): Input[] => {
	const out: Input[] = [];
	for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) {
		const date = new Date(t).toISOString().slice(0, 10);
		out.push(...practice(`p-${date}`, ['你'], noonIn(date, tz)));
	}
	return out;
};
