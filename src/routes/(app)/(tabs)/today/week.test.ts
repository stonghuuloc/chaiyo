import { describe, expect, it } from 'vitest';
import { initialState, type State } from '#lib/study/index.js';
import { CURRICULUM } from '#lib/study/fixtures/curriculum.js';
import { countDays } from '#lib/study/fixtures/streak.js';
import { weekView } from './week';

const NEXT = (n: number) => `Học xong một phần bài hôm nay là chuỗi lên ${n}.`;
const THU = new Date('2026-11-20T03:00:00Z');

const withStreak = (streak: State['streak']): State => ({
	...initialState({ curriculum: CURRICULUM }),
	streak
});
const run = (count: number, last: string, freezes: number, best = count) =>
	withStreak({ count, last, through: last, freezes, best });
const marks = (s: State, now = THU) => weekView(s, now).cells.map((c) => c.mark);

describe('weekView', () => {
	const ac4 = () => countDays(run(11, '2026-11-17', 2), '2026-11-19', '2026-11-19');

	it('Given_Ac4Row_When_WeekView_Then_Chip12And1CellsAndLine', () => {
		const v = weekView(ac4(), THU);
		expect([v.count, v.freezes]).toEqual([12, 1]);
		expect(v.cells.map((c) => c.label)).toEqual(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
		expect(v.cells.map((c) => c.mark)).toEqual([
			'tick',
			'tick',
			'freeze',
			'tick',
			'today',
			'later',
			'later'
		]);
		expect(v.cells.map((c) => c.today)).toEqual([false, false, false, false, true, false, false]);
		expect(v.line).toBe(`T4 bạn nghỉ nên app dùng 1 lượt đóng băng. ${NEXT(13)}`);
	});

	it('Given_Ac5Row_When_WeekView_Then_CountedLineAndT6Tick', () => {
		const s = countDays(ac4(), '2026-11-20', '2026-11-20');
		const v = weekView(s, new Date('2026-11-20T08:00:00Z'));
		expect([v.count, v.freezes]).toEqual([13, 1]);
		expect(v.cells[4].mark).toBe('tick');
		expect(v.line).toBe('Hôm nay đã tính rồi, chuỗi 13 ngày. Mai gặp lại nha!');
	});

	it('Given_OvernightFreeze_When_WeekView_Then_T5FreezeChip5And0', () => {
		const v = weekView(run(5, '2026-11-18', 1), THU);
		expect([v.count, v.freezes]).toEqual([5, 0]);
		expect(v.cells.map((c) => c.mark)).toEqual([
			'tick',
			'tick',
			'tick',
			'freeze',
			'today',
			'later',
			'later'
		]);
		expect(v.line).toBe(`T5 bạn nghỉ nên app dùng 1 lượt đóng băng. ${NEXT(6)}`);
	});

	it('Given_TwoFrozenDays_When_WeekView_Then_T4T5And2Luot', () => {
		const v = weekView(run(5, '2026-11-17', 2), THU);
		expect(v.cells.map((c) => c.mark).slice(0, 5)).toEqual([
			'tick',
			'tick',
			'freeze',
			'freeze',
			'today'
		]);
		expect(v.line).toBe(`T4, T5 bạn nghỉ nên app dùng 2 lượt đóng băng. ${NEXT(6)}`);
	});

	it('Given_Reset_When_WeekView_Then_NoTickNoFreezeLen1', () => {
		const v = weekView(run(5, '2026-11-17', 1), THU);
		expect([v.count, v.freezes]).toEqual([0, 0]);
		expect(v.cells.map((c) => c.mark)).toEqual([
			'blank',
			'blank',
			'blank',
			'blank',
			'today',
			'later',
			'later'
		]);
		expect(v.line).toBe(NEXT(1));
	});

	it('Given_FreshLearner_When_WeekView_Then_TodayOnlyLen1', () => {
		const v = weekView(initialState({ curriculum: CURRICULUM }), THU);
		expect([v.count, v.freezes]).toEqual([0, 0]);
		expect(v.cells.map((c) => c.mark)).toEqual([
			'blank',
			'blank',
			'blank',
			'blank',
			'today',
			'later',
			'later'
		]);
		expect(v.line).toBe(NEXT(1));
	});

	it('Given_Monday_When_WeekView_Then_T2TodayRestLater', () => {
		const s = initialState({ curriculum: CURRICULUM });
		expect(marks(s, new Date('2026-11-16T03:00:00Z'))).toEqual([
			'today',
			'later',
			'later',
			'later',
			'later',
			'later',
			'later'
		]);
	});

	it('Given_NoFrozenThisWeek_When_WeekView_Then_NextSentenceOnly', () => {
		const s = countDays(initialState({ curriculum: CURRICULUM }), '2026-11-09', '2026-11-19');
		const v = weekView(s, THU);
		expect(v.count).toBe(11);
		expect(v.line).toBe(NEXT(12));
	});
});
