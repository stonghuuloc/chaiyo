import type { SupabaseClient } from '@supabase/supabase-js';
import { LESSONS } from '#lib/curriculum/index.js';
import type { Ledger } from '#lib/ledger/index.js';
import { addDays } from '#lib/lesson/streak-popup.js';
import { currentLevel, liveStreak, localDate, roadAnchor, type State } from '#lib/study/index.js';

export type PublicStats = {
	streak: number;
	streakUntil: string;
	wordsWeek: number;
	wordsKnown: number;
	hsk: number;
	lesson: number;
	badges: string[];
};

const numberOf = (id: string | undefined) => LESSONS.find((l) => l.id === id)?.n;

export function publicStats(state: State, now: Date): PublicStats {
	const today = localDate(now, state.tz);
	const monday = addDays(today, -((new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7));
	const k = liveStreak(state, now);
	const last = k.through ?? k.last;
	const entries = Object.values(state.lexicon);
	const passed = Object.keys(state.lessons).filter((id) => state.lessons[id].passed);
	return {
		streak: k.count,
		streakUntil: k.count > 0 && last ? addDays(last, 1 + k.freezes) : today,
		wordsWeek: entries.filter((e) => {
			const firsts = Object.values(e.cards).map((c) => c.first);
			return firsts.length > 0 && localDate(new Date(firsts.sort()[0]), state.tz) >= monday;
		}).length,
		wordsKnown: entries.length,
		hsk: currentLevel(state),
		lesson: numberOf(roadAnchor(state)) ?? Math.max(0, ...passed.map((id) => numberOf(id) ?? 0)),
		badges: Object.keys(state.badges).sort()
	};
}

export async function publishStats(
	client: Pick<SupabaseClient, 'rpc'>,
	s: PublicStats
): Promise<boolean> {
	const { data, error } = await client.rpc('publish_stats', {
		p_streak: s.streak,
		p_streak_until: s.streakUntil,
		p_words_week: s.wordsWeek,
		p_words_known: s.wordsKnown,
		p_hsk: s.hsk,
		p_lesson: s.lesson,
		p_badges: s.badges
	});
	if (error) throw new Error(error.message);
	return data === true;
}

export function publishOnChange(
	ledger: Pick<Ledger, 'state' | 'subscribe' | 'sync'>,
	client: Pick<SupabaseClient, 'rpc'>,
	wait = 2000
): () => void {
	let live = true;
	let accepted = '';
	let timer: ReturnType<typeof setTimeout> | undefined;
	const publish = async () => {
		if (!live) return;
		const synced = await ledger.sync().then(
			() => true,
			() => false
		);
		if (!live) return;
		const stats = publicStats(ledger.state(), new Date());
		const payload = JSON.stringify(stats);
		if (payload === accepted) return;
		if ((await publishStats(client, stats).catch(() => false)) && synced) accepted = payload;
	};
	void publish();
	const off = ledger.subscribe(() => {
		clearTimeout(timer);
		timer = setTimeout(() => void publish(), wait);
	});
	return () => {
		live = false;
		clearTimeout(timer);
		off();
	};
}
