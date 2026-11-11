import { apply, type Attempt, type State } from '#lib/study/index.js';

const DAY = 86_400_000;

const practice = (run: string, cards: string[], at: Date): Attempt[] =>
	cards.map((word, i) => ({
		id: `a:${run}:${i}`,
		at: new Date(at.getTime() + i * 1000).toISOString(),
		questionId: `q-${run}-${i}`,
		contentSha: 'fixture',
		correct: true,
		ms: 1000,
		card: { word, skill: 'the' as const },
		step: { kind: 'practice' as const, run, of: cards.length }
	}));

export { practice };

export function countDays(state: State, from: string, to: string): State {
	let s = state;
	for (let t = Date.parse(from); t <= Date.parse(to); t += DAY) {
		const date = new Date(t).toISOString().slice(0, 10);
		const utcNoon = new Date(`${date}T12:00:00Z`);
		const hour = Number(
			new Intl.DateTimeFormat('en-US', {
				timeZone: s.tz,
				hour: 'numeric',
				hourCycle: 'h23'
			}).format(utcNoon)
		);
		const noon = new Date(utcNoon.getTime() - (hour - 12) * 3_600_000);
		for (const a of practice(`p-${date}`, ['你'], noon)) s = apply(s, a, new Date(a.at)).state;
	}
	return s;
}
