import { describe, expect, it } from 'vitest';
import type { StudyEvent } from '#lib/study/index.js';
import { dayCountedView } from './streak-popup';

const counted = (
	streak: number,
	extra: { record?: boolean; freezes?: number } = {},
	day = '2026-11-13'
): StudyEvent => ({ type: 'DayCounted', day, streak, ...extra });

const strip = (events: StudyEvent[]) =>
	dayCountedView(events)!.week.map((c) => `${c.label}${c.ticked ? '*' : ''}${c.today ? '!' : ''}`);

describe('dayCountedView', () => {
	it('Given_Best12N13F1_When_View_Then_RecordHeadlineAndNextNote', () => {
		// Arrange
		const events = [counted(13, { record: true, freezes: 1 })];

		// Act
		const view = dayCountedView(events)!;

		// Assert
		expect(view.n).toBe(13);
		expect(view.headline).toBe('Kỷ lục mới 13 ngày!');
		expect(view.body).toBe(
			'Hôm nay đã tính rồi, lửa đang cháy đượm. Mai ghé tiếp là thành 14 nha.'
		);
		expect(view.note).toBe('Thêm 1 ngày nữa là được thêm 1 lượt đóng băng.');
	});

	it('Given_Best12N14Earned_When_View_Then_GiftNote', () => {
		// Arrange
		const events: StudyEvent[] = [
			counted(14, { record: true, freezes: 2 }, '2026-11-14'),
			{ type: 'FreezeEarned', freezes: 2 }
		];

		// Act
		const view = dayCountedView(events)!;

		// Assert
		expect(view.headline).toBe('Kỷ lục mới 14 ngày!');
		expect(view.note).toBe('Được tặng 1 lượt đóng băng! Lỡ bận một hôm thì chuỗi vẫn giữ.');
	});

	it('Given_N6F2NotRecord_When_View_Then_ChuoiLenNoNote', () => {
		// Arrange
		const events = [counted(6, { record: false, freezes: 2 })];

		// Act
		const view = dayCountedView(events)!;

		// Assert
		expect(view.headline).toBe('Chuỗi lên 6 ngày!');
		expect(view.note).toBeNull();
	});

	it('Given_N9F0_When_View_Then_K5', () => {
		// Arrange
		const events = [counted(9, { record: false, freezes: 0 })];

		// Act
		const view = dayCountedView(events)!;

		// Assert
		expect(view.note).toBe('Thêm 5 ngày nữa là được thêm 1 lượt đóng băng.');
	});

	it('Given_LegacyEventNoFields_When_View_Then_ChuoiLenNoNote', () => {
		// Arrange
		const events = [counted(4)];

		// Act
		const view = dayCountedView(events)!;

		// Assert
		expect(view.headline).toBe('Chuỗi lên 4 ngày!');
		expect(view.note).toBeNull();
	});

	it('Given_20261113N13_When_Week_Then_T2toT6TickedT6Today', () => {
		// Arrange
		const events = [counted(13, { record: true, freezes: 1 })];

		// Act
		const week = strip(events);

		// Assert
		expect(week).toEqual(['T2*', 'T3*', 'T4*', 'T5*', 'T6*!', 'T7', 'CN']);
	});

	it('Given_N2_When_Week_Then_OnlyT5T6', () => {
		// Arrange
		const events = [counted(2, { record: true, freezes: 0 })];

		// Act
		const week = strip(events);

		// Assert
		expect(week).toEqual(['T2', 'T3', 'T4', 'T5*', 'T6*!', 'T7', 'CN']);
	});

	it('Given_Sunday_When_Week_Then_CNToday', () => {
		// Arrange
		const events = [counted(3, {}, '2026-11-15')];

		// Act
		const week = strip(events);

		// Assert
		expect(week).toEqual(['T2', 'T3', 'T4', 'T5', 'T6*', 'T7*', 'CN*!']);
	});

	it('Given_NoDayCounted_When_View_Then_Null', () => {
		// Arrange
		const events: StudyEvent[] = [{ type: 'SectionDone', lesson: 'h1-01', section: 'words' }];

		// Act
		const view = dayCountedView(events);

		// Assert
		expect(view).toBeNull();
	});
});
