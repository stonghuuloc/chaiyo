import { m } from '#lib/paraglide/messages.js';
import { localDate, rollover, type State } from '#lib/study/index.js';
import { addDays, weekday } from './streak-popup';

export type FreezeUsedView = {
	day: string;
	n: number;
	left: number;
	headline: string;
	body: string;
	note: string;
};

export function freezeUsedView(
	state: State,
	now: Date,
	seen: string | null
): FreezeUsedView | null {
	const today = localDate(now, state.tz);
	if (state.streak.last === today) return null;
	const yesterday = addDays(today, -1);
	const r = rollover(state, yesterday);
	const spent = r.events.find((e) => e.type === 'FreezeSpent' && e.day === yesterday);
	if (spent?.type !== 'FreezeSpent' || seen === yesterday) return null;
	const n = r.state.streak.count;
	const left = spent.freezes;
	return {
		day: yesterday,
		n,
		left,
		headline: m.chy46s2_title(),
		body: m.chy46s2_body({ day: weekday(yesterday), n }),
		note: left > 0 ? m.chy46s2_note_left({ f: left }) : m.chy46s2_note_none()
	};
}

const seenKey = (learner: string) => `chaiyo.freeze-seen.${learner}`;

export function readFreezeSeen(storage: Pick<Storage, 'getItem'>, learner: string): string | null {
	try {
		return storage.getItem(seenKey(learner));
	} catch {
		return null;
	}
}

export function markFreezeSeen(
	storage: Pick<Storage, 'setItem'>,
	learner: string,
	day: string
): void {
	try {
		storage.setItem(seenKey(learner), day);
	} catch {
		return;
	}
}
