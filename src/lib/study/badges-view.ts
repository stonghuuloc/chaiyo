import { BADGES, type BadgeId } from './badges';
import { localDate } from './dates';
import type { State } from './types';

export const BADGE_ART: Record<BadgeId, string> = {
	first: 'first',
	streak7: 'streak7',
	streak30: 'streak30',
	streak100: 'streak30',
	words100: 'words100',
	words300: 'words100',
	write50: 'first',
	hsk1: 'hsk1',
	hsk2: 'hsk1'
};

export type EarnedBadge = { id: BadgeId; title: string; art: string; date: string };
export type LockedBadge = {
	id: BadgeId;
	title: string;
	art: string;
	have: number;
	need: number | null;
	pct: number;
};
export type BadgesView = {
	total: number;
	earned: EarnedBadge[];
	kind: 'none' | 'some' | 'all';
	soon: LockedBadge[];
	rest: LockedBadge[];
};

const dayMonth = (iso: string, tz: string) => {
	const [, mm, dd] = localDate(new Date(iso), tz).split('-');
	return `${dd}/${mm}`;
};

function progress(s: State, id: BadgeId): { have: number; need: number } | null {
	const streak = Math.max(s.streak.best ?? 0, s.streak.count);
	const words = Object.keys(s.lexicon).length;
	switch (id) {
		case 'first':
			return { have: 0, need: 1 };
		case 'streak7':
			return { have: streak, need: 7 };
		case 'streak30':
			return { have: streak, need: 30 };
		case 'streak100':
			return { have: streak, need: 100 };
		case 'words100':
			return { have: words, need: 100 };
		case 'words300':
			return { have: words, need: 300 };
		case 'write50':
			return { have: s.written, need: 50 };
		default:
			return null;
	}
}

export function badgesView(s: State): BadgesView {
	const earned: EarnedBadge[] = [];
	const ranked: { badge: LockedBadge; ratio: number; need: number; index: number }[] = [];
	BADGES.forEach(([id, title], index) => {
		const iso = s.badges[id];
		const art = BADGE_ART[id];
		if (iso) {
			earned.push({ id, title, art, date: dayMonth(iso, s.tz) });
			return;
		}
		const p = progress(s, id);
		const have = p?.have ?? 0;
		ranked.push({
			badge: {
				id,
				title,
				art,
				have,
				need: p && p.need > 1 ? p.need : null,
				pct: p ? Math.min(100, Math.round((have / p.need) * 100)) : 0
			},
			ratio: p ? have / p.need : -1,
			need: p?.need ?? Infinity,
			index
		});
	});
	const locked = ranked
		.sort((a, b) => b.ratio - a.ratio || a.need - b.need || a.index - b.index)
		.map((r) => r.badge);
	const kind = !earned.length ? 'none' : locked.length ? 'some' : 'all';
	return {
		total: BADGES.length,
		earned,
		kind,
		soon: kind === 'none' ? locked.slice(0, 3) : locked,
		rest: kind === 'none' ? locked.slice(3) : []
	};
}
