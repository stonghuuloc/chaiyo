import { resolve } from '$app/paths';
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

export type Tab = 'new' | 'resolved';

export type CardHead =
	| { kind: 'word'; hanzi: string; long: boolean; lesson: number | null; lessonId: string | null }
	| {
			kind: 'lesson';
			n: number;
			title: string;
			step: string | null;
			lessonId: string | null;
			known: boolean;
	  };

export type InboxCard = {
	id: string;
	chip: Exclude<ChipKey, 'all'>;
	head: CardHead;
	who: string;
	ago: string;
	note: string | null;
	status: Tab;
};

export type InboxEmpty =
	| { kind: 'inbox-clear' }
	| { kind: 'none-done' }
	| { kind: 'chip'; tab: Tab; chip: ChipKey };

export type InboxView = {
	counts: { new: number; resolved: number };
	chips: { key: ChipKey; count: number }[];
	cards: InboxCard[];
	empty: InboxEmpty | null;
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

const PAGE = 1000;

export async function listReports(client: Pick<SupabaseClient, 'rpc'>): Promise<InboxReport[]> {
	const rows: Row[] = [];
	for (let from = 0; ; from += PAGE) {
		const { data, error } = await client.rpc('list_error_reports').range(from, from + PAGE - 1);
		if (error) throw new Error(error.message);
		const page = (data as Row[] | null) ?? [];
		rows.push(...page);
		if (page.length < PAGE) break;
	}
	return rows.map((r) => ({
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

export async function setReportStatus(
	client: Pick<SupabaseClient, 'rpc'>,
	id: string,
	status: Tab
): Promise<void> {
	const { error } = await client.rpc('set_error_report_status', { p_id: id, p_status: status });
	if (error) throw new Error(error.message);
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
		return {
			kind: 'word',
			hanzi: r.word,
			long: [...r.word].length > 2,
			lesson: lesson?.n ?? null,
			lessonId: r.lesson
		};
	return {
		kind: 'lesson',
		n: lesson?.n ?? 0,
		title: lesson?.title ?? r.lesson ?? '',
		step: r.step,
		lessonId: r.lesson,
		known: lesson !== undefined
	};
}

export function cardHref(head: CardHead): string | null {
	if (head.kind === 'word')
		return (
			resolve('/(app)/word/[id]', { id: head.hanzi }) +
			(head.lessonId ? `?lesson=${encodeURIComponent(head.lessonId)}` : '')
		);
	return head.known && head.lessonId
		? resolve('/(app)/lesson/[id]/[section]', { id: head.lessonId, section: 'words' })
		: null;
}

export function inboxView(
	rows: InboxReport[],
	now: Date,
	{ tab = 'new', chip = 'all' }: { tab?: Tab; chip?: ChipKey } = {}
): InboxView {
	const counts = {
		new: rows.filter((r) => r.status === 'new').length,
		resolved: rows.filter((r) => r.status === 'resolved').length
	};
	const src = rows.filter((r) => r.status === tab).map(
		(r): InboxCard => ({
			id: r.id,
			chip: chipOf(r.category),
			head: headOf(r),
			who: r.reporter ?? m.chy54s1_reporter_none(),
			ago: ago(r.at, now),
			note: r.note,
			status: r.status
		})
	);
	const cards = src.filter((c) => chip === 'all' || c.chip === chip);
	return {
		counts,
		chips: [
			{ key: 'all', count: src.length },
			...CHIPS.map((key) => ({ key, count: src.filter((c) => c.chip === key).length }))
		],
		cards,
		empty:
			cards.length > 0
				? null
				: tab === 'new' && counts.new === 0
					? { kind: 'inbox-clear' }
					: tab === 'resolved' && counts.resolved === 0
						? { kind: 'none-done' }
						: { kind: 'chip', tab, chip }
	};
}
