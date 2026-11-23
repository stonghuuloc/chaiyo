import { LESSONS, LEVELS } from '#lib/curriculum/index.js';
import { currentLevel, roadRows, type Road, type State } from '#lib/study/index.js';

type Item = { id: string; n: number; title: string; hanzi: string };

export type LevelRow = Road<Item> & { best?: number; part?: number };
export type LevelGroup = {
	kind: 'primer' | 'topic';
	i: number;
	title: string;
	rows: LevelRow[];
	passed: number;
	total: number;
	open: boolean;
};
export type LevelCell = { level: number; locked: boolean; current: boolean };
export type LevelView = {
	level: number;
	empty: boolean;
	strip: LevelCell[];
	header?: { passed: number; total: number; words: number };
	card?: LevelRow & { next: number };
	groups: LevelGroup[];
};

const LEVEL_COUNT = 5;

export function roadmapLevel(state: State, level: number): LevelView {
	const top = currentLevel(state);
	const strip = Array.from({ length: LEVEL_COUNT }, (_, k) => ({
		level: k + 1,
		locked: k + 1 > top,
		current: k + 1 === level
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
		return {
			...r,
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
	(holder ?? groups.find((g) => g.kind === 'topic'))!.open = true;

	const now = holder?.rows.find((r) => r.status === 'now');
	const outlined = groups.filter((g) => g.kind === 'topic');
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
		groups
	};
}
