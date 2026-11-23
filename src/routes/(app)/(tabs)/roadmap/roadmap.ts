import { LESSONS, LEVELS } from '#lib/curriculum/index.js';
import { m } from '#lib/paraglide/messages.js';
import { currentLevel, roadRows, type Road, type State } from '#lib/study/index.js';

type Item = { id: string; n: number; title: string; hanzi: string };

export type LevelRow = Road<Item> & {
	best?: number;
	part?: number;
	lock?: 'after' | 'level' | 'draft';
};
export type LevelGroup = {
	kind: 'primer' | 'topic';
	i: number;
	title: string;
	rows: LevelRow[];
	passed: number;
	total: number;
	open: boolean;
};
export type LevelCell = { level: number; locked: boolean; current: boolean; progress: number };
export type ExamRow = {
	part?: 'viet' | 'noi';
	level: number;
	last: number;
	status: 'locked' | 'open';
};
export type LevelView = {
	level: number;
	empty: boolean;
	strip: LevelCell[];
	header?: { passed: number; total: number; words: number };
	card?: LevelRow & { next: number };
	groups: LevelGroup[];
	exams?: { rows: ExamRow[]; note: boolean };
};

const LEVEL_COUNT = 5;
const SPEAKING_FROM = 3;

const outlineIds = (level: number) =>
	(LEVELS.find((o) => o.level === level)?.topics ?? []).flatMap((t) => t.lessons.map((l) => l.id));

const progressOf = (state: State, level: number) => {
	const ids = outlineIds(level);
	return ids.length === 0 ? 0 : ids.filter((id) => state.lessons[id]?.passed).length / ids.length;
};

export function roadmapLevel(state: State, level: number): LevelView {
	const top = currentLevel(state);
	const strip = Array.from({ length: LEVEL_COUNT }, (_, k) => ({
		level: k + 1,
		locked: k + 1 > top,
		current: k + 1 === level,
		progress: progressOf(state, k + 1)
	}));
	const outline = LEVELS.find((o) => o.level === level);
	if (!outline) return { level, empty: true, strip, groups: [] };

	const primer: Item[] = LESSONS.filter((l) => l.level === level && l.testOut).map((l) => ({
		id: l.id,
		n: 0,
		title: l.title,
		hanzi: l.titleHanzi
	}));
	let n = 0;
	const topics: Item[][] = outline.topics.map((t) =>
		t.lessons.map((l) => ({ id: l.id, n: ++n, title: l.title, hanzi: l.titleHanzi ?? '' }))
	);
	const rows = roadRows(state, [...primer, ...topics.flat()]).map((r): LevelRow => {
		const p = state.lessons[r.id];
		const sections = LESSONS.find((l) => l.id === r.id)?.sections.length ?? 1;
		const { after, ...rest } = r;
		const published = LESSONS.some((l) => l.id === r.id);
		const lock =
			r.status !== 'locked'
				? undefined
				: level > top
					? 'level'
					: published && after !== undefined
						? 'after'
						: 'draft';
		return {
			...rest,
			...(published && after !== undefined ? { after } : {}),
			...(lock ? { lock } : {}),
			best: p?.passed ? p.best : undefined,
			part: r.status === 'now' ? Math.min((p?.done.length ?? 0) + 1, sections) : undefined
		};
	});

	const group = (kind: LevelGroup['kind'], i: number, title: string, take: number) => {
		const own = rows.splice(0, take);
		return {
			kind,
			i,
			title,
			rows: own,
			passed: own.filter((r) => r.status === 'done').length,
			total: own.length,
			open: false
		};
	};
	const groups: LevelGroup[] = [
		...(primer.length > 0 ? [group('primer', 0, '', primer.length)] : []),
		...outline.topics.map((t, k) => group('topic', k + 1, t.title, topics[k].length))
	];
	const holder = groups.find((g) => g.rows.some((r) => r.status === 'now'));
	const first = holder ?? groups.find((g) => g.kind === 'topic');
	if (first) first.open = true;

	const now = holder?.rows.find((r) => r.status === 'now');
	const outlined = groups.filter((g) => g.kind === 'topic');
	const ids = outlineIds(level);
	const live = LESSONS.filter((l) => l.level === level);
	const lastLive = ids.findLastIndex((id) => live.some((l) => l.id === id)) + 1;
	const status: ExamRow['status'] =
		level <= top && live.length > 0 && live.every((l) => state.lessons[l.id]?.passed)
			? 'open'
			: 'locked';
	const parts = level >= SPEAKING_FROM ? (['viet', 'noi'] as const) : [undefined];
	return {
		level,
		empty: false,
		strip,
		header: {
			passed: outlined.reduce((s, g) => s + g.passed, 0),
			total: n,
			words: outline.words
		},
		card: now ? { ...now, next: now.n + 1 } : undefined,
		groups,
		exams: {
			note: level >= SPEAKING_FROM,
			rows: parts.map((part) => ({
				...(part ? { part } : {}),
				level,
				last: lastLive || n,
				status
			}))
		}
	};
}

export const lockToast = (view: LevelView, row: LevelRow) =>
	row.lock === 'level'
		? m.chy49s2_lock_level({ prev: view.level - 1, level: view.level })
		: row.lock === 'after'
			? m.chy49s2_lock_after({ k: row.after ?? 0, n: row.n })
			: m.chy49s2_lock_draft({ n: row.n });

export const examToast = (row: ExamRow) =>
	row.status === 'open'
		? m.chy49s2_mock_soon({ level: row.level })
		: m.chy49s2_mock_toast({ last: row.last, level: row.level });
