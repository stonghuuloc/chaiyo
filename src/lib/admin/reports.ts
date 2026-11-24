import { LESSONS } from '#lib/curriculum/index.js';
import { m } from '#lib/paraglide/messages.js';
import type { Category } from '#lib/report/types.js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ago } from './ago';

export type InboxReport = {
	id: string;
	category: Category;
	word: string | null;
	lesson: string | null;
	step: string | null;
	note: string | null;
	status: 'new' | 'resolved';
	at: string;
	reporter: string | null;
};

export type ChipKey = 'all' | 'meaning' | 'pinyin' | 'audio' | 'other';

export type CardHead =
	| { kind: 'word'; hanzi: string; long: boolean; lesson: number | null }
	| { kind: 'lesson'; n: number; title: string };

export type InboxCard = {
	id: string;
	chip: Exclude<ChipKey, 'all'>;
	head: CardHead;
	who: string;
	ago: string;
	note: string | null;
};

export type InboxView = {
	counts: { new: number; resolved: number };
	chips: { key: ChipKey; count: number }[];
	cards: InboxCard[];
};

type Row = {
	id: string;
	lesson_id: string | null;
	step_id: string | null;
	word_id: string | null;
	category: Category;
	note: string | null;
	status: 'new' | 'resolved';
	created_at: string;
	reporter: string | null;
};

export async function listReports(client: Pick<SupabaseClient, 'rpc'>): Promise<InboxReport[]> {
	const { data, error } = await client.rpc('list_error_reports');
	if (error) throw new Error(error.message);
	return ((data as Row[] | null) ?? []).map((r) => ({
		id: r.id,
		category: r.category,
		word: r.word_id,
		lesson: r.lesson_id,
		step: r.step_id,
		note: r.note,
		status: r.status,
		at: r.created_at,
		reporter: r.reporter
	}));
}

export const chipOf = (c: Category): InboxCard['chip'] => (c === 'hanviet' ? 'other' : c);

const CHIPS: InboxCard['chip'][] = ['meaning', 'pinyin', 'audio', 'other'];

const CHIP_NAMES: Record<ChipKey, () => string> = {
	all: m.chy54s1_chip_all,
	meaning: m.chy54s1_cat_meaning,
	pinyin: m.chy54s1_cat_pinyin,
	audio: m.chy54s1_cat_audio,
	other: m.chy54s1_cat_other
};

export const chipName = (key: ChipKey): string => CHIP_NAMES[key]();

function headOf(r: InboxReport): CardHead {
	const lesson = LESSONS.find((l) => l.id === r.lesson);
	if (r.word)
		return { kind: 'word', hanzi: r.word, long: [...r.word].length > 2, lesson: lesson?.n ?? null };
	return { kind: 'lesson', n: lesson?.n ?? 0, title: lesson?.title ?? r.lesson ?? '' };
}

export function inboxView(rows: InboxReport[], now: Date): InboxView {
	const fresh = rows.filter((r) => r.status === 'new');
	const cards = fresh.map((r) => ({
		id: r.id,
		chip: chipOf(r.category),
		head: headOf(r),
		who: r.reporter ?? m.chy54s1_reporter_none(),
		ago: ago(r.at, now),
		note: r.note
	}));
	return {
		counts: { new: fresh.length, resolved: rows.length - fresh.length },
		chips: [
			{ key: 'all', count: cards.length },
			...CHIPS.map((key) => ({ key, count: cards.filter((c) => c.chip === key).length }))
		],
		cards
	};
}
