import { CURRICULUM } from '#lib/curriculum/index.js';
import { countDays } from '#lib/study/fixtures/streak.js';
import { initialState, type State } from '#lib/study/index.js';
import { describe, expect, it } from 'vitest';
import { freezeUsedView, markFreezeSeen, readFreezeSeen } from './freeze-popup';
import { weekday } from './streak-popup';

const withStreak = (streak: State['streak']): State => ({
	...initialState({ curriculum: CURRICULUM }),
	streak
});

const ac3 = () =>
	withStreak({ count: 12, last: '2026-11-10', through: '2026-11-10', freezes: 2, best: 12 });

const fakeStorage = () => {
	const map = new Map<string, string>();
	return {
		getItem: (k: string) => map.get(k) ?? null,
		setItem: (k: string, v: string) => void map.set(k, v)
	};
};

describe('freezeUsedView', () => {
	it('Given_AC3State_When_View20261112_Then_HomT4Streak12Con1', () => {
		// Arrange
		const now = new Date('2026-11-12T02:00:00Z');

		// Act
		const view = freezeUsedView(ac3(), now, null);

		// Assert
		expect(view).toMatchObject({ day: '2026-11-11', n: 12, left: 1 });
		expect(view!.headline).toBe('Chuỗi vẫn còn nguyên!');
		expect(view!.body).toBe(
			'Hôm T4 bạn nghỉ, 1 lượt đóng băng đã tự giữ chuỗi 12 ngày cho bạn. Hôm nay học để chuỗi chạy tiếp nhé.'
		);
		expect(view!.note).toBe('Còn 1 lượt. Học đủ 7 ngày liền được tặng thêm 1.');
	});

	it('Given_SeenYesterday_When_View_Then_Null', () => {
		// Arrange / Act
		const view = freezeUsedView(ac3(), new Date('2026-11-12T02:00:00Z'), '2026-11-11');

		// Assert
		expect(view).toBeNull();
	});

	it('Given_SeenT4_When_View20261113_Then_HomT5HetLuot', () => {
		// Arrange / Act
		const view = freezeUsedView(ac3(), new Date('2026-11-13T02:00:00Z'), '2026-11-11');

		// Assert
		expect(view!.body).toContain('Hôm T5 bạn nghỉ');
		expect(view!.left).toBe(0);
		expect(view!.note).toBe('Hết lượt rồi. Học đủ 7 ngày liền được tặng thêm 1.');
	});

	it('Given_8FoldedDaysMissT2_When_View20261110_Then_HomT2HetLuot', () => {
		// Arrange
		const state = countDays(initialState({ curriculum: CURRICULUM }), '2026-11-01', '2026-11-08');

		// Act
		const view = freezeUsedView(state, new Date('2026-11-10T02:00:00Z'), null);

		// Assert
		expect(view!.body).toContain('Hôm T2 bạn nghỉ');
		expect(view!.left).toBe(0);
		expect(view!.note).toContain('Hết lượt rồi');
	});

	it('Given_CountedToday_When_View_Then_Null', () => {
		// Arrange
		const state = withStreak({
			count: 13,
			last: '2026-11-12',
			through: '2026-11-12',
			freezes: 1,
			best: 13
		});

		// Act
		const view = freezeUsedView(state, new Date('2026-11-12T02:00:00Z'), null);

		// Assert
		expect(view).toBeNull();
	});

	it('Given_ResetYesterday_When_View_Then_Null', () => {
		// Arrange
		const state = withStreak({
			count: 5,
			last: '2026-11-10',
			through: '2026-11-10',
			freezes: 0,
			best: 5
		});

		// Act
		const view = freezeUsedView(state, new Date('2026-11-12T02:00:00Z'), null);

		// Assert
		expect(view).toBeNull();
	});

	it('Given_StudiedYesterday_When_View_Then_Null', () => {
		// Arrange
		const state = withStreak({
			count: 5,
			last: '2026-11-11',
			through: '2026-11-11',
			freezes: 1,
			best: 5
		});

		// Act
		const view = freezeUsedView(state, new Date('2026-11-12T02:00:00Z'), null);

		// Assert
		expect(view).toBeNull();
	});
});

describe('freeze seen storage', () => {
	it('Given_FakeStorage_When_MarkThenRead_Then_DayPerLearner', () => {
		// Arrange
		const storage = fakeStorage();

		// Act
		markFreezeSeen(storage, 'u1', '2026-11-11');

		// Assert
		expect(readFreezeSeen(storage, 'u1')).toBe('2026-11-11');
		expect(readFreezeSeen(storage, 'u2')).toBeNull();
	});

	it('Given_ThrowingStorage_When_ReadOrMark_Then_NullAndNoThrow', () => {
		// Arrange
		const boom = () => {
			throw new Error('denied');
		};
		const storage = { getItem: boom, setItem: boom };

		// Act / Assert
		expect(readFreezeSeen(storage, 'u1')).toBeNull();
		expect(() => markFreezeSeen(storage, 'u1', '2026-11-11')).not.toThrow();
	});
});

describe('weekday', () => {
	it('Given_Sunday_When_Weekday_Then_CN', () => {
		// Arrange / Act / Assert
		expect(weekday('2026-11-15')).toBe('CN');
		expect(weekday('2026-11-09')).toBe('T2');
	});
});
