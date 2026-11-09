import type { SessionCard, Skill, State } from './types';

const ORDER: Skill[] = ['the', 'nghe', 'viet'];
const SECONDS: Record<Skill, number> = { the: 10, nghe: 15, viet: 35 };

const localDate = (d: Date, tz: string) => {
	const p = Object.fromEntries(
		new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		})
			.formatToParts(d)
			.map((x) => [x.type, x.value])
	);
	return `${p.year}-${p.month}-${p.day}`;
};

export function session(state: State, o: { now: Date; tz: string; only?: Skill[] }): SessionCard[] {
	const today = localDate(o.now, o.tz);
	const words = Object.keys(state.lexicon);
	const lanes = ORDER.filter((s) => !o.only || o.only.includes(s)).map((skill) => {
		const due = words
			.filter((w) => {
				const c = state.lexicon[w].cards[skill];
				return c && localDate(new Date(c.due), o.tz) <= today;
			})
			.sort(
				(a, b) =>
					Date.parse(state.lexicon[a].cards[skill]!.due) -
					Date.parse(state.lexicon[b].cards[skill]!.due)
			);
		const fresh =
			skill === 'the'
				? words.filter((w) => state.lexicon[w].saved && !state.lexicon[w].cards.the)
				: [];
		return [...due, ...fresh].map((word) => ({ word, skill }));
	});
	const out: SessionCard[] = [];
	while (lanes.some((l) => l.length)) {
		for (const lane of lanes) {
			if (!lane.length) continue;
			const i = lane.findIndex((c) => c.word !== out.at(-1)?.word);
			out.push(...lane.splice(i < 0 ? 0 : i, 1));
		}
	}
	return out;
}

export const minutes = (cards: SessionCard[]) =>
	Math.max(1, Math.round(cards.reduce((n, c) => n + SECONDS[c.skill], 0) / 60));
